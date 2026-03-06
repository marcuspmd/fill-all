/**
 * Replay Orchestrator — drives the full FlowScript replay from the
 * background service-worker.
 *
 * Responsibilities:
 *   1. Resolve generator values deterministically (seeded PRNG).
 *   2. Manage state machine (idle → preparing → running → paused/completed/failed).
 *   3. Send `DEMO_EXECUTE_STEP` to the content script per step.
 *   4. Handle "navigate" steps via `NavigationHandler`.
 *   5. Emit progress/completion events via callbacks.
 */

import { createLogger } from "@/lib/logger";
import type {
  FlowScript,
  FlowStep,
  ReplayConfig,
  ReplayStatus,
  ReplayProgress,
  ReplayResult,
  StepResult,
  StepCompletePayload,
  ExecuteStepPayload,
} from "./demo.types";
import { DEFAULT_REPLAY_CONFIG, SPEED_PRESETS } from "./demo.types";
import { createSeededRng } from "./seeded-prng";
import { resolveValueSource } from "./value-mapper";
import { generate } from "@/lib/generators";
import { navigateAndWait, injectContentScript } from "./navigation-handler";

const log = createLogger("ReplayOrchestrator");

// ── Types ─────────────────────────────────────────────────────────────────

export interface OrchestratorCallbacks {
  onProgress?: (progress: ReplayProgress) => void;
  onComplete?: (result: ReplayResult) => void;
  onStatusChange?: (status: ReplayStatus) => void;
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface ReplayOrchestrator {
  /** Current replay status */
  readonly status: ReplayStatus;
  /** Start replay of a FlowScript */
  start(flow: FlowScript, configOverride?: Partial<ReplayConfig>): void;
  /** Pause the current replay */
  pause(): void;
  /** Resume a paused replay */
  resume(): void;
  /** Stop the current replay (cannot resume) */
  stop(): void;
  /** Handle step-complete message coming from the content script */
  handleStepComplete(payload: StepCompletePayload): void;
}

/**
 * Create a new ReplayOrchestrator bound to a specific tab.
 *
 * @param tabId      Chrome tab ID to replay in
 * @param callbacks  Event callbacks for progress / completion / status
 */
export function createReplayOrchestrator(
  tabId: number,
  callbacks: OrchestratorCallbacks = {},
): ReplayOrchestrator {
  // ── Mutable state (encapsulated) ─────────────────────────────────────
  let status: ReplayStatus = "idle";
  let flow: FlowScript | null = null;
  let config: ReplayConfig = { ...DEFAULT_REPLAY_CONFIG };
  let stepIndex = 0;
  let stepResults: Array<{ stepId: string; result: StepResult }> = [];
  let startedAt = 0;
  let pauseResolve: (() => void) | null = null;
  let abortController: AbortController | null = null;
  let rng: ReturnType<typeof createSeededRng> | null = null;

  // ── Helpers ──────────────────────────────────────────────────────────

  function setStatus(next: ReplayStatus): void {
    status = next;
    callbacks.onStatusChange?.(next);
  }

  function emitProgress(step: FlowStep): void {
    if (!flow) return;
    callbacks.onProgress?.({
      stepIndex,
      total: flow.steps.length,
      currentAction: step.action,
      status,
      stepId: step.id,
    });
  }

  function buildResult(): ReplayResult {
    return {
      status: stepResults.some((r) => r.result.status === "failed")
        ? "failed"
        : "completed",
      totalSteps: flow?.steps.length ?? 0,
      successCount: stepResults.filter((r) => r.result.status === "success")
        .length,
      skippedCount: stepResults.filter((r) => r.result.status === "skipped")
        .length,
      failedCount: stepResults.filter((r) => r.result.status === "failed")
        .length,
      durationMs: Date.now() - startedAt,
      stepResults,
    };
  }

  async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new Error("aborted"));
      });
    });
  }

  async function waitIfPaused(): Promise<void> {
    if (status !== "paused") return;
    return new Promise<void>((resolve) => {
      pauseResolve = resolve;
    });
  }

  // ── Step execution ───────────────────────────────────────────────────

  async function sendStepToContentScript(
    step: FlowStep,
    resolvedValue?: string,
  ): Promise<StepResult> {
    const payload: ExecuteStepPayload = {
      step,
      resolvedValue,
      replayConfig: config,
    };

    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        type: "DEMO_EXECUTE_STEP",
        payload,
      });

      if (response?.result) {
        return response.result as StepResult;
      }
      return { status: "failed", error: "No response from content script" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      // If message fails, content script may be gone (after navigation)
      if (msg.includes("Receiving end does not exist")) {
        const injected = await injectContentScript(tabId);
        if (injected) {
          try {
            const retry = await chrome.tabs.sendMessage(tabId, {
              type: "DEMO_EXECUTE_STEP",
              payload,
            });
            if (retry?.result) return retry.result as StepResult;
          } catch {
            // fall through
          }
        }
      }

      return { status: "failed", error: msg };
    }
  }

  async function executeNavigateStep(step: FlowStep): Promise<StepResult> {
    if (!step.url) {
      return { status: "failed", error: "Navigate step missing url" };
    }

    const loaded = await navigateAndWait(tabId, step.url);
    if (!loaded) {
      return { status: "failed", error: `Navigation to ${step.url} timed out` };
    }

    // Re-inject content script after navigation
    await injectContentScript(tabId);
    return { status: "success" };
  }

  // ── Main loop ────────────────────────────────────────────────────────

  async function runLoop(signal: AbortSignal): Promise<void> {
    if (!flow || !rng) return;

    // Navigate to baseUrl before executing steps
    if (flow.metadata.baseUrl) {
      log.info(`Navigating to baseUrl: ${flow.metadata.baseUrl}`);
      const loaded = await navigateAndWait(tabId, flow.metadata.baseUrl);
      if (!loaded) {
        log.warn(`Failed to navigate to baseUrl: ${flow.metadata.baseUrl}`);
      }
      await injectContentScript(tabId);
    }

    for (; stepIndex < flow.steps.length; stepIndex++) {
      if (signal.aborted) return;
      await waitIfPaused();
      if (signal.aborted) return;

      const step = flow.steps[stepIndex]!;
      emitProgress(step);

      // Apply delay before step
      const delay =
        config.useRecordedTimings && step.delayBefore
          ? step.delayBefore
          : config.stepDelay;

      if (delay > 0 && stepIndex > 0) {
        try {
          await sleep(delay, signal);
        } catch {
          return; // aborted during delay
        }
      }

      // Resolve value for fill steps
      let resolvedValue: string | undefined;
      if (step.action === "fill" && step.valueSource) {
        resolvedValue = resolveValueSource(step.valueSource, generate);
      }

      // Execute
      let result: StepResult;
      if (step.action === "navigate") {
        result = await executeNavigateStep(step);
      } else {
        // Before interaction, move cursor (sent as separate message)
        if (
          step.selector &&
          config.highlightDuration > 0 &&
          config.showCursor !== false
        ) {
          try {
            await chrome.tabs.sendMessage(tabId, {
              type: "DEMO_CURSOR_MOVE",
              payload: { selector: step.selector, durationMs: 400 },
            });
            await sleep(config.highlightDuration, signal);
          } catch {
            // cursor overlay is optional — ignore
          }
        }

        // Click effect
        if (step.action === "click" && config.showCursor !== false) {
          try {
            await chrome.tabs.sendMessage(tabId, {
              type: "DEMO_CURSOR_CLICK",
            });
          } catch {
            // ignore
          }
        }

        // Highlight element
        if (config.highlightDuration > 0) {
          try {
            await chrome.tabs.sendMessage(tabId, {
              type: "DEMO_HIGHLIGHT_ELEMENT",
              payload: { step, durationMs: config.highlightDuration },
            });
          } catch {
            // ignore
          }
        }

        result = await sendStepToContentScript(step, resolvedValue);
      }

      stepResults.push({ stepId: step.id, result });

      // Handle failure
      if (result.status === "failed") {
        if (step.optional) {
          log.info(
            `Optional step ${step.id} failed, continuing:`,
            result.error,
          );
        } else {
          log.warn(`Step ${step.id} failed:`, result.error);
          setStatus("failed");
          callbacks.onComplete?.(buildResult());
          return;
        }
      }

      // Apply delay after step
      if (step.delayAfter && step.delayAfter > 0) {
        try {
          await sleep(step.delayAfter, signal);
        } catch {
          return;
        }
      }
    }

    // All steps complete
    setStatus("completed");
    chrome.tabs
      .sendMessage(tabId, { type: "DEMO_CURSOR_DESTROY" })
      .catch(() => {});
    callbacks.onComplete?.(buildResult());
  }

  // ── Public interface ─────────────────────────────────────────────────

  return {
    get status() {
      return status;
    },

    start(inputFlow, configOverride) {
      if (status === "running" || status === "preparing") {
        log.warn("Replay already in progress");
        return;
      }

      flow = inputFlow;
      stepIndex = 0;
      stepResults = [];
      startedAt = Date.now();

      // Merge config
      config = { ...DEFAULT_REPLAY_CONFIG, ...inputFlow.replayConfig };
      if (configOverride) {
        Object.assign(config, configOverride);
        if (configOverride.speed && !configOverride.typingDelay) {
          const preset = SPEED_PRESETS[configOverride.speed];
          Object.assign(config, preset);
        }
      }

      rng = createSeededRng(inputFlow.metadata.seed);
      abortController = new AbortController();

      setStatus("preparing");
      log.info(
        `Starting replay: "${inputFlow.metadata.name}" (${inputFlow.steps.length} steps)`,
      );

      // Run async loop (don't await — the orchestrator is non-blocking)
      setStatus("running");
      runLoop(abortController.signal).catch((err) => {
        log.error("Replay loop error:", err);
        setStatus("failed");
        chrome.tabs
          .sendMessage(tabId, { type: "DEMO_CURSOR_DESTROY" })
          .catch(() => {});
        callbacks.onComplete?.(buildResult());
      });
    },

    pause() {
      if (status !== "running") return;
      setStatus("paused");
      log.info("Replay paused");
    },

    resume() {
      if (status !== "paused") return;
      setStatus("running");
      log.info("Replay resumed");
      pauseResolve?.();
      pauseResolve = null;
    },

    stop() {
      if (status === "idle" || status === "completed" || status === "failed")
        return;
      abortController?.abort();
      setStatus("completed");
      log.info("Replay stopped by user");
      chrome.tabs
        .sendMessage(tabId, { type: "DEMO_CURSOR_DESTROY" })
        .catch(() => {});
      callbacks.onComplete?.(buildResult());
    },

    handleStepComplete(payload) {
      // This is for async step completion (when the content script
      // responds asynchronously). Currently, we await the response inline,
      // so this is a no-op placeholder for future scenarios.
      log.debug(`Step complete: ${payload.stepId}`, payload.result);
    },
  };
}
