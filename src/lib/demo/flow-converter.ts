/**
 * Flow Converter — transforms a RecordingSession into a FlowScript.
 *
 * The converter maps e2e-export `RecordedStep[]` into the portable
 * `FlowScript` format. Each step's `fieldType` is used to create a
 * generator-backed `FlowValueSource` (via `mapValueToSource`) so that
 * replays produce fresh data.
 */

import type { FieldType } from "@/types";
import type {
  RecordedStep,
  RecordingSession,
} from "@/lib/e2e-export/e2e-export.types";
import type {
  FlowScript,
  FlowStep,
  FlowMetadata,
  FlowActionType,
  FlowAssertion,
  AssertOperator,
} from "./demo.types";
import { DEFAULT_REPLAY_CONFIG, FLOW_SCRIPT_VERSION } from "./demo.types";
import { mapValueToSource } from "./value-mapper";
import { FIELD_TYPES } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────

const FIELD_TYPE_SET: ReadonlySet<string> = new Set(FIELD_TYPES);

function isValidFieldType(value: string | undefined): value is FieldType {
  return value != null && FIELD_TYPE_SET.has(value);
}

let idCounter = 0;
function nextStepId(): string {
  return `step_${++idCounter}`;
}

/** Reset internal counter (for testing) */
export function _resetIdCounter(): void {
  idCounter = 0;
}

/** Map recorded step type → FlowActionType (drop unsupported) */
function mapActionType(
  recordedType: RecordedStep["type"],
): FlowActionType | null {
  const map: Record<string, FlowActionType> = {
    navigate: "navigate",
    fill: "fill",
    click: "click",
    select: "select",
    check: "check",
    uncheck: "uncheck",
    clear: "clear",
    "press-key": "press-key",
    scroll: "scroll",
    assert: "assert",
    submit: "click",
    hover: "click",
    "wait-for-element": "wait",
    "wait-for-hidden": "wait",
    "wait-for-url": "wait",
    "wait-for-network-idle": "wait",
  };
  return map[recordedType] ?? null;
}

/** Map e2e-export assertion type → FlowAssertion */
function mapAssertion(step: RecordedStep): FlowAssertion | undefined {
  if (!step.assertion) return undefined;

  const operatorMap: Record<string, AssertOperator> = {
    "url-changed": "url-contains",
    "url-contains": "url-contains",
    "visible-text": "contains",
    "element-visible": "visible",
    "element-hidden": "hidden",
    "field-value": "equals",
    "field-error": "contains",
    redirect: "url-equals",
    "response-ok": "exists",
    "toast-message": "contains",
  };

  const operator = operatorMap[step.assertion.type];
  if (!operator) return undefined;

  return {
    operator,
    expected: step.assertion.expected,
  };
}

// ── Converter ─────────────────────────────────────────────────────────────

export interface ConvertOptions {
  /** Flow name (defaults to "Recorded Flow") */
  name?: string;
  /** Flow description */
  description?: string;
  /** Seed for deterministic PRNG (auto-generated if omitted) */
  seed?: string;
  /** Tags for categorisation */
  tags?: string[];
}

/**
 * Convert a `RecordingSession` into a `FlowScript`.
 *
 * Filters out steps that cannot be mapped and computes timing deltas
 * from the original timestamps.
 */
export function convertRecordingToFlow(
  session: RecordingSession,
  options: ConvertOptions = {},
): FlowScript {
  _resetIdCounter();

  const steps = convertSteps(session.steps);

  const now = Date.now();
  const metadata: FlowMetadata = {
    name: options.name ?? "Recorded Flow",
    description: options.description,
    baseUrl: session.startUrl,
    seed: options.seed ?? generateRandomSeed(),
    createdAt: now,
    updatedAt: now,
    version: FLOW_SCRIPT_VERSION,
    tags: options.tags,
  };

  return {
    id: generateFlowId(),
    metadata,
    replayConfig: { ...DEFAULT_REPLAY_CONFIG },
    steps,
  };
}

/**
 * Convert standalone `RecordedStep[]` into `FlowStep[]`.
 * Useful when you only have steps without a full session.
 */
export function convertSteps(recorded: RecordedStep[]): FlowStep[] {
  const result: FlowStep[] = [];
  let prevTimestamp: number | null = null;

  for (const rec of recorded) {
    const action = mapActionType(rec.type);
    if (!action) continue;

    const flowStep: FlowStep = {
      id: nextStepId(),
      action,
      label: rec.label,
    };

    // Selector
    if (rec.selector) {
      flowStep.selector = rec.selector;
    }
    if (rec.smartSelectors?.length) {
      flowStep.smartSelectors = rec.smartSelectors;
    }

    // Value source for fill steps
    if (action === "fill" && rec.value != null) {
      const fieldType = isValidFieldType(rec.fieldType) ? rec.fieldType : null;
      flowStep.valueSource = mapValueToSource(rec.value, fieldType);
    }

    // Navigation URL
    if (action === "navigate" && rec.url) {
      flowStep.url = rec.url;
    }

    // Select
    if (action === "select" && rec.value != null) {
      flowStep.selectText = rec.value;
    }

    // Key press
    if (action === "press-key" && rec.key) {
      flowStep.key = rec.key;
    }

    // Wait timeout
    if (action === "wait") {
      flowStep.waitTimeout = rec.waitTimeout ?? 10_000;
    }

    // Scroll
    if (action === "scroll" && rec.scrollPosition) {
      flowStep.scrollPosition = rec.scrollPosition;
    }

    // Assert
    if (action === "assert") {
      flowStep.assertion = mapAssertion(rec);
    }

    // Timing delta from previous step
    if (prevTimestamp !== null && rec.timestamp > 0) {
      const delta = rec.timestamp - prevTimestamp;
      if (delta > 0) {
        flowStep.delayBefore = delta;
      }
    }
    if (rec.timestamp > 0) {
      prevTimestamp = rec.timestamp;
    }

    result.push(flowStep);
  }

  return result;
}

// ── ID generation ─────────────────────────────────────────────────────────

function generateFlowId(): string {
  return `flow_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateRandomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}
