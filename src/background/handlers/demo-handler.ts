/**
 * Demo message handler — background-side CRUD and replay control.
 */

import type { MessageHandler } from "@/types/interfaces";
import type { ExtensionMessage, MessageType } from "@/types";
import { createLogger } from "@/lib/logger";
import {
  getDemoFlows,
  saveDemoFlow,
  deleteDemoFlow,
  getDemoFlowById,
} from "@/lib/demo/demo-storage";
import { parseFlowScript, flowScriptSchema } from "@/lib/demo/demo.schemas";
import {
  createReplayOrchestrator,
  type ReplayOrchestrator,
} from "@/lib/demo/replay-orchestrator";
import {
  createScreenRecorder,
  type ScreenRecorder,
} from "@/lib/demo/screen-recorder";
import { convertRecordingToFlow } from "@/lib/demo/flow-converter";
import type {
  RecordedStep,
  RecordedStepType,
} from "@/lib/e2e-export/e2e-export.types";

const log = createLogger("DemoHandler");

const SUPPORTED: ReadonlyArray<MessageType> = [
  "DEMO_SAVE_FLOW",
  "DEMO_CONVERT_RECORDING",
  "DEMO_GET_FLOWS",
  "DEMO_DELETE_FLOW",
  "DEMO_REPLAY_START",
  "DEMO_REPLAY_PAUSE",
  "DEMO_REPLAY_RESUME",
  "DEMO_REPLAY_STOP",
  "DEMO_REPLAY_STATUS",
  "DEMO_RECORD_SCREEN_START",
  "DEMO_RECORD_SCREEN_STOP",
  "DEMO_GET_STREAM_ID",
];

// ── Active replay / recorder instances ────────────────────────────────────

let activeOrchestrator: ReplayOrchestrator | null = null;
let activeRecorder: ScreenRecorder | null = null;

// ── Handler ───────────────────────────────────────────────────────────────

async function handle(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    // ── Flow CRUD ────────────────────────────────────────────────────
    case "DEMO_GET_FLOWS":
      return getDemoFlows();

    case "DEMO_SAVE_FLOW": {
      const parsed = flowScriptSchema.safeParse(message.payload);
      if (!parsed.success) {
        const detail = parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
        log.warn("DEMO_SAVE_FLOW validation failed:", detail);
        return { error: `Payload inválido: ${detail}` };
      }
      await saveDemoFlow(parsed.data);
      return { success: true };
    }

    case "DEMO_CONVERT_RECORDING": {
      const p = message.payload as
        | {
            steps?: Array<Record<string, unknown>>;
            name?: string;
            seed?: string;
          }
        | undefined;

      if (!Array.isArray(p?.steps) || !p?.name) {
        return {
          error: "Missing steps or name in DEMO_CONVERT_RECORDING payload",
        };
      }

      // Map panel RecordStep[] → e2e-export RecordedStep[]
      const recorded: RecordedStep[] = p.steps.map((s, i) => ({
        type: (s["type"] as RecordedStepType) ?? "click",
        selector: typeof s["selector"] === "string" ? s["selector"] : undefined,
        value: typeof s["value"] === "string" ? s["value"] : undefined,
        url: typeof s["url"] === "string" ? s["url"] : undefined,
        label: typeof s["label"] === "string" ? s["label"] : undefined,
        waitTimeout: typeof s["waitMs"] === "number" ? s["waitMs"] : undefined,
        assertion:
          s["assertion"] != null && typeof s["assertion"] === "object"
            ? (s["assertion"] as Parameters<
                typeof convertRecordingToFlow
              >[0]["steps"][0]["assertion"])
            : undefined,
        timestamp: i * 1000,
      }));

      const startUrl = recorded.find((s) => s.type === "navigate")?.url ?? "";
      const session = {
        steps: recorded,
        startUrl,
        startTime: Date.now(),
        status: "stopped" as const,
      };

      const flow = convertRecordingToFlow(session, {
        name: p.name,
        seed: p.seed ?? "demo",
      });

      await saveDemoFlow(flow);
      return { success: true };
    }

    case "DEMO_DELETE_FLOW": {
      const id = typeof message.payload === "string" ? message.payload : null;
      if (!id) return { error: "Expected flow ID string" };
      await deleteDemoFlow(id);
      return { success: true };
    }

    // ── Replay control ───────────────────────────────────────────────
    case "DEMO_REPLAY_START": {
      const p = message.payload as
        | {
            flowId?: string;
            tabId?: number;
            config?: Record<string, unknown>;
          }
        | undefined;

      if (!p?.flowId || !p?.tabId) {
        return { error: "Missing flowId or tabId" };
      }

      const flow = await getDemoFlowById(p.flowId);
      if (!flow) return { error: `Flow "${p.flowId}" not found` };

      activeOrchestrator = createReplayOrchestrator(p.tabId, {
        onProgress(progress) {
          // Broadcast progress to popup / devtools
          chrome.runtime
            .sendMessage({
              type: "DEMO_REPLAY_PROGRESS" as MessageType,
              payload: progress,
            })
            .catch(() => {});
        },
        onComplete(result) {
          chrome.runtime
            .sendMessage({
              type: "DEMO_REPLAY_COMPLETE" as MessageType,
              payload: result,
            })
            .catch(() => {});
          activeOrchestrator = null;
        },
      });

      activeOrchestrator.start(flow, p.config);
      return { success: true, status: activeOrchestrator.status };
    }

    case "DEMO_REPLAY_PAUSE":
      activeOrchestrator?.pause();
      return { status: activeOrchestrator?.status ?? "idle" };

    case "DEMO_REPLAY_RESUME":
      activeOrchestrator?.resume();
      return { status: activeOrchestrator?.status ?? "idle" };

    case "DEMO_REPLAY_STOP":
      activeOrchestrator?.stop();
      activeOrchestrator = null;
      return { status: "completed" };

    case "DEMO_REPLAY_STATUS":
      return { status: activeOrchestrator?.status ?? "idle" };

    // ── Screen recording helpers ─────────────────────────────────────
    /**
     * Returns a chrome.tabCapture streamId so the DevTools panel can call
     * navigator.mediaDevices.getUserMedia() directly and record locally.
     * This avoids shipping the video blob through the messaging bus.
     */
    case "DEMO_GET_STREAM_ID": {
      const opts = message.payload as { tabId?: number } | undefined;
      if (!opts?.tabId) return { error: "Missing tabId" };

      const streamId = await new Promise<string | null>((resolve) => {
        chrome.tabCapture.getMediaStreamId(
          { targetTabId: opts.tabId },
          (id) => {
            if (chrome.runtime.lastError) {
              log.warn(
                "getMediaStreamId error:",
                chrome.runtime.lastError.message,
              );
              resolve(null);
            } else {
              resolve(id);
            }
          },
        );
      });

      if (!streamId) return { error: "Failed to get stream ID" };
      return { streamId };
    }

    // ── Screen recording (legacy — background-side recorder) ─────────
    case "DEMO_RECORD_SCREEN_START": {
      const opts = message.payload as { tabId?: number } | undefined;
      if (!opts?.tabId) return { error: "Missing tabId for screen recording" };

      activeRecorder = createScreenRecorder();
      await activeRecorder.start(opts.tabId);
      return { success: true };
    }

    case "DEMO_RECORD_SCREEN_STOP": {
      if (!activeRecorder || activeRecorder.state !== "recording") {
        return { error: "No active recording" };
      }
      const blob = await activeRecorder.stop();
      activeRecorder = null;

      // Convert blob to base64 for messaging (small demos only)
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          "",
        ),
      );

      return {
        success: true,
        mimeType: blob.type,
        sizeBytes: blob.size,
        base64,
      };
    }

    default:
      return null;
  }
}

export const demoHandler: MessageHandler = {
  supportedTypes: SUPPORTED,
  handle,
};
