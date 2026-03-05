/**
 * Step Executor — runs a single FlowStep in the content script context.
 *
 * Receives an `ExecuteStepPayload` (step + resolved value + config) from
 * the background orchestrator and performs the corresponding DOM action.
 *
 * Every action is wrapped in a try/catch so the step result is always
 * reported back (never throws).
 */

import { createLogger } from "@/lib/logger";
import type {
  FlowStep,
  StepResult,
  ReplayConfig,
  ExecuteStepPayload,
} from "./demo.types";

const log = createLogger("StepExecutor");

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Execute a single flow step in the current page.
 *
 * Returns a `StepResult` describing the outcome. Never throws.
 */
export async function executeStep(
  payload: ExecuteStepPayload,
): Promise<StepResult> {
  const { step, resolvedValue, replayConfig } = payload;

  try {
    switch (step.action) {
      case "navigate":
        return handleNavigate(step);
      case "fill":
        return await handleFill(step, resolvedValue, replayConfig);
      case "click":
        return handleClick(step);
      case "select":
        return handleSelect(step);
      case "check":
        return handleCheck(step, true);
      case "uncheck":
        return handleCheck(step, false);
      case "clear":
        return handleClear(step);
      case "wait":
        return await handleWait(step);
      case "scroll":
        return handleScroll(step);
      case "press-key":
        return handlePressKey(step);
      case "assert":
        return handleAssert(step);
      default:
        return { status: "skipped", reason: `Unknown action: ${step.action}` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.warn(`Step ${step.id} failed:`, message);

    if (step.optional) {
      return { status: "skipped", reason: message };
    }
    return { status: "failed", error: message };
  }
}

// ── Element resolution ────────────────────────────────────────────────────

/**
 * Scrolls element into view if it lies outside the visible viewport.
 * Uses instant scrolling to avoid animations that would delay replay timing.
 */
function ensureVisible(el: Element): void {
  const rect = el.getBoundingClientRect();
  const inViewport =
    rect.top >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight);
  if (!inViewport) {
    el.scrollIntoView({ behavior: "instant", block: "center" });
  }
}

function findElement(step: FlowStep): Element | null {
  // Try smart selectors first (ordered by priority)
  if (step.smartSelectors?.length) {
    for (const ss of step.smartSelectors) {
      try {
        const el = document.querySelector(ss.value);
        if (el) return el;
      } catch {
        // invalid selector — skip
      }
    }
  }

  // Fallback to primary selector
  if (step.selector) {
    try {
      return document.querySelector(step.selector);
    } catch {
      return null;
    }
  }

  return null;
}

function requireElement(step: FlowStep): Element {
  const el = findElement(step);
  if (!el) {
    throw new Error(
      `Element not found: ${step.selector ?? step.smartSelectors?.[0]?.value ?? "(no selector)"}`,
    );
  }
  return el;
}

// ── Action handlers ───────────────────────────────────────────────────────

function handleNavigate(step: FlowStep): StepResult {
  if (!step.url) {
    return { status: "failed", error: "Navigate step missing url" };
  }
  // Navigation handled by orchestrator via chrome.tabs.update — this is a no-op
  // when executed in content script context. Return success so orchestrator proceeds.
  return { status: "success" };
}

async function handleFill(
  step: FlowStep,
  resolvedValue: string | undefined,
  config: ReplayConfig,
): Promise<StepResult> {
  const el = requireElement(step);
  ensureVisible(el);

  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
    return { status: "failed", error: "Fill target is not an input/textarea" };
  }

  const value = resolvedValue ?? "";

  // Clear existing value first
  el.value = "";
  el.dispatchEvent(new Event("input", { bubbles: true }));

  // Simulate typing character by character
  if (config.typingDelay > 0 && value.length > 0) {
    for (const char of value) {
      el.value += char;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(
        new KeyboardEvent("keydown", { key: char, bubbles: true }),
      );
      el.dispatchEvent(
        new KeyboardEvent("keyup", { key: char, bubbles: true }),
      );
      await sleep(config.typingDelay);
    }
  } else {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: true }));

  return { status: "success" };
}

function handleClick(step: FlowStep): StepResult {
  const el = requireElement(step);
  ensureVisible(el);

  if (el instanceof HTMLElement) {
    el.focus();
    el.click();
  } else {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }

  return { status: "success" };
}

function handleSelect(step: FlowStep): StepResult {
  const el = requireElement(step);
  ensureVisible(el);

  if (!(el instanceof HTMLSelectElement)) {
    return { status: "failed", error: "Select target is not a <select>" };
  }

  if (step.selectIndex != null) {
    if (step.selectIndex >= 0 && step.selectIndex < el.options.length) {
      el.selectedIndex = step.selectIndex;
    } else {
      return {
        status: "failed",
        error: `Select index ${step.selectIndex} out of range`,
      };
    }
  } else if (step.selectText != null) {
    const option = Array.from(el.options).find(
      (o) => o.text === step.selectText || o.value === step.selectText,
    );
    if (option) {
      el.value = option.value;
    } else {
      return {
        status: "failed",
        error: `Option "${step.selectText}" not found`,
      };
    }
  }

  el.dispatchEvent(new Event("change", { bubbles: true }));
  return { status: "success" };
}

function handleCheck(step: FlowStep, checked: boolean): StepResult {
  const el = requireElement(step);
  ensureVisible(el);

  if (!(el instanceof HTMLInputElement)) {
    return { status: "failed", error: "Check target is not an input" };
  }

  if (el.checked !== checked) {
    el.checked = checked;
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("click", { bubbles: true }));
  }

  return { status: "success" };
}

function handleClear(step: FlowStep): StepResult {
  const el = requireElement(step);
  ensureVisible(el);

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.value = "";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  return { status: "success" };
}

async function handleWait(step: FlowStep): Promise<StepResult> {
  const timeout = step.waitTimeout ?? 10_000;

  if (!step.selector) {
    // Simple delay
    await sleep(timeout);
    return { status: "success" };
  }

  // Wait for element to appear
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (findElement(step)) {
      return { status: "success" };
    }
    await sleep(200);
  }

  return { status: "timeout" };
}

function handleScroll(step: FlowStep): StepResult {
  if (step.scrollPosition) {
    window.scrollTo({
      left: step.scrollPosition.x,
      top: step.scrollPosition.y,
      behavior: "smooth",
    });
  }
  return { status: "success" };
}

function handlePressKey(step: FlowStep): StepResult {
  if (!step.key) {
    return { status: "failed", error: "press-key step missing key" };
  }

  const target = step.selector ? findElement(step) : document.activeElement;
  if (!target) {
    return { status: "failed", error: "No target for key press" };
  }

  target.dispatchEvent(
    new KeyboardEvent("keydown", { key: step.key, bubbles: true }),
  );
  target.dispatchEvent(
    new KeyboardEvent("keyup", { key: step.key, bubbles: true }),
  );

  // Handle Enter on forms
  if (step.key === "Enter" && target instanceof HTMLElement) {
    const form = target.closest("form");
    if (form) {
      form.dispatchEvent(new Event("submit", { bubbles: true }));
    }
  }

  return { status: "success" };
}

function handleAssert(step: FlowStep): StepResult {
  if (!step.assertion) {
    return { status: "skipped", reason: "Assert step has no assertion config" };
  }

  const { operator, expected } = step.assertion;

  switch (operator) {
    case "visible": {
      const el = findElement(step);
      if (!el)
        return { status: "failed", error: "Element not visible (not found)" };
      if (el instanceof HTMLElement && el.offsetParent === null) {
        return { status: "failed", error: "Element not visible (hidden)" };
      }
      return { status: "success" };
    }

    case "hidden": {
      const el = findElement(step);
      if (!el) return { status: "success" }; // not found = hidden
      if (el instanceof HTMLElement && el.offsetParent === null) {
        return { status: "success" };
      }
      return { status: "failed", error: "Element is visible" };
    }

    case "exists": {
      const el = findElement(step);
      return el
        ? { status: "success" }
        : { status: "failed", error: "Element does not exist" };
    }

    case "equals": {
      const el = findElement(step);
      if (!el) return { status: "failed", error: "Element not found" };
      const text =
        el instanceof HTMLInputElement ? el.value : (el.textContent ?? "");
      return text === expected
        ? { status: "success" }
        : { status: "failed", error: `Expected "${expected}", got "${text}"` };
    }

    case "contains": {
      const el = findElement(step);
      if (!el) return { status: "failed", error: "Element not found" };
      const text =
        el instanceof HTMLInputElement ? el.value : (el.textContent ?? "");
      return expected && text.includes(expected)
        ? { status: "success" }
        : { status: "failed", error: `Text does not contain "${expected}"` };
    }

    case "url-equals":
      return window.location.href === expected
        ? { status: "success" }
        : {
            status: "failed",
            error: `URL: expected "${expected}", got "${window.location.href}"`,
          };

    case "url-contains":
      return expected && window.location.href.includes(expected)
        ? { status: "success" }
        : { status: "failed", error: `URL does not contain "${expected}"` };

    default:
      return {
        status: "skipped",
        reason: `Unknown assertion operator: ${operator}`,
      };
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Highlight an element briefly before interaction for visual feedback.
 */
export function highlightElement(step: FlowStep, durationMs: number): void {
  if (durationMs <= 0) return;

  const el = findElement(step);
  if (!(el instanceof HTMLElement)) return;

  const originalOutline = el.style.outline;
  const originalTransition = el.style.transition;

  el.style.transition = "outline 0.15s ease";
  el.style.outline = "3px solid #4285f4";

  setTimeout(() => {
    el.style.outline = originalOutline;
    el.style.transition = originalTransition;
  }, durationMs);
}
