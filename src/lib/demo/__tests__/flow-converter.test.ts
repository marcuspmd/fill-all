import { describe, it, expect, beforeEach } from "vitest";
import {
  convertRecordingToFlow,
  convertSteps,
  _resetIdCounter,
} from "@/lib/demo/flow-converter";
import type {
  RecordedStep,
  RecordingSession,
} from "@/lib/e2e-export/e2e-export.types";
import {
  FLOW_SCRIPT_VERSION,
  DEFAULT_REPLAY_CONFIG,
} from "@/lib/demo/demo.types";

// ── Helpers ───────────────────────────────────────────────────────────────

function makeSession(
  overrides: Partial<RecordingSession> = {},
  steps?: RecordedStep[],
): RecordingSession {
  return {
    steps: steps ?? [
      { type: "navigate", url: "https://example.com", timestamp: 1000 },
      {
        type: "fill",
        selector: "#name",
        value: "John",
        fieldType: "full-name",
        timestamp: 2000,
      },
      { type: "click", selector: "#submit", timestamp: 3000 },
    ],
    startUrl: "https://example.com",
    startTime: 1000,
    status: "stopped",
    ...overrides,
  };
}

function makeStep(overrides: Partial<RecordedStep>): RecordedStep {
  return {
    type: "click",
    selector: "#btn",
    timestamp: 1000,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("convertRecordingToFlow", () => {
  beforeEach(() => {
    _resetIdCounter();
  });

  it("converts a basic session into a FlowScript", () => {
    const session = makeSession();
    const flow = convertRecordingToFlow(session);

    expect(flow.id).toMatch(/^flow_/);
    expect(flow.metadata.name).toBe("Recorded Flow");
    expect(flow.metadata.baseUrl).toBe("https://example.com");
    expect(flow.metadata.version).toBe(FLOW_SCRIPT_VERSION);
    expect(flow.steps.length).toBe(3);
    expect(flow.replayConfig).toEqual(DEFAULT_REPLAY_CONFIG);
  });

  it("uses custom options when provided", () => {
    const session = makeSession();
    const flow = convertRecordingToFlow(session, {
      name: "Login Test",
      description: "Testa o login",
      seed: "fixed-seed",
      tags: ["auth", "login"],
    });

    expect(flow.metadata.name).toBe("Login Test");
    expect(flow.metadata.description).toBe("Testa o login");
    expect(flow.metadata.seed).toBe("fixed-seed");
    expect(flow.metadata.tags).toEqual(["auth", "login"]);
  });

  it("generates a seed automatically if not provided", () => {
    const session = makeSession();
    const flow = convertRecordingToFlow(session);
    expect(flow.metadata.seed).toBeTruthy();
    expect(flow.metadata.seed.length).toBeGreaterThan(0);
  });

  it("sets timestamps on metadata", () => {
    const before = Date.now();
    const session = makeSession();
    const flow = convertRecordingToFlow(session);
    const after = Date.now();

    expect(flow.metadata.createdAt).toBeGreaterThanOrEqual(before);
    expect(flow.metadata.createdAt).toBeLessThanOrEqual(after);
    expect(flow.metadata.updatedAt).toEqual(flow.metadata.createdAt);
  });
});

describe("convertSteps", () => {
  beforeEach(() => {
    _resetIdCounter();
  });

  it("assigns incremental IDs to steps", () => {
    const steps = convertSteps([
      makeStep({ type: "click", timestamp: 1000 }),
      makeStep({ type: "click", timestamp: 2000 }),
      makeStep({ type: "click", timestamp: 3000 }),
    ]);

    expect(steps.map((s) => s.id)).toEqual(["step_1", "step_2", "step_3"]);
  });

  it("maps fill steps with FieldType to generator source", () => {
    const steps = convertSteps([
      makeStep({
        type: "fill",
        selector: "#cpf",
        value: "12345678901",
        fieldType: "cpf",
        timestamp: 1000,
      }),
    ]);

    expect(steps[0].action).toBe("fill");
    expect(steps[0].valueSource).toEqual({
      type: "generator",
      fieldType: "cpf",
    });
  });

  it("maps fill steps without FieldType to fixed source", () => {
    const steps = convertSteps([
      makeStep({
        type: "fill",
        selector: "#custom",
        value: "custom-value",
        timestamp: 1000,
      }),
    ]);

    expect(steps[0].valueSource).toEqual({
      type: "fixed",
      value: "custom-value",
    });
  });

  it("maps navigate steps with url", () => {
    const steps = convertSteps([
      makeStep({
        type: "navigate",
        url: "https://example.com/page",
        timestamp: 1000,
      }),
    ]);

    expect(steps[0].action).toBe("navigate");
    expect(steps[0].url).toBe("https://example.com/page");
  });

  it("maps select steps with selectText", () => {
    const steps = convertSteps([
      makeStep({
        type: "select",
        selector: "#opt",
        value: "Option 1",
        timestamp: 1000,
      }),
    ]);

    expect(steps[0].action).toBe("select");
    expect(steps[0].selectText).toBe("Option 1");
  });

  it("maps press-key steps with key", () => {
    const steps = convertSteps([
      makeStep({ type: "press-key", key: "Enter", timestamp: 1000 }),
    ]);

    expect(steps[0].action).toBe("press-key");
    expect(steps[0].key).toBe("Enter");
  });

  it("maps wait-for-element to wait action with timeout", () => {
    const steps = convertSteps([
      makeStep({
        type: "wait-for-element",
        selector: "#loading",
        waitTimeout: 5000,
        timestamp: 1000,
      }),
    ]);

    expect(steps[0].action).toBe("wait");
    expect(steps[0].waitTimeout).toBe(5000);
  });

  it("defaults wait timeout to 10000", () => {
    const steps = convertSteps([
      makeStep({
        type: "wait-for-element",
        selector: "#loading",
        timestamp: 1000,
      }),
    ]);

    expect(steps[0].waitTimeout).toBe(10_000);
  });

  it("maps scroll steps with position", () => {
    const steps = convertSteps([
      makeStep({
        type: "scroll",
        scrollPosition: { x: 0, y: 500 },
        timestamp: 1000,
      }),
    ]);

    expect(steps[0].action).toBe("scroll");
    expect(steps[0].scrollPosition).toEqual({ x: 0, y: 500 });
  });

  it("maps assert steps with assertion", () => {
    const steps = convertSteps([
      makeStep({
        type: "assert",
        selector: "#msg",
        assertion: { type: "element-visible" },
        timestamp: 1000,
      }),
    ]);

    expect(steps[0].action).toBe("assert");
    expect(steps[0].assertion).toEqual({ operator: "visible" });
  });

  it("computes delayBefore from timestamp deltas", () => {
    const steps = convertSteps([
      makeStep({ type: "click", timestamp: 1000 }),
      makeStep({ type: "click", timestamp: 2500 }),
      makeStep({ type: "click", timestamp: 4000 }),
    ]);

    expect(steps[0].delayBefore).toBeUndefined();
    expect(steps[1].delayBefore).toBe(1500);
    expect(steps[2].delayBefore).toBe(1500);
  });

  it("filters out unsupported step types", () => {
    const steps = convertSteps([
      makeStep({ type: "click", timestamp: 1000 }),
      // @ts-expect-error — testing unsupported type
      makeStep({ type: "drag-and-drop", timestamp: 2000 }),
      makeStep({ type: "fill", selector: "#x", value: "v", timestamp: 3000 }),
    ]);

    expect(steps).toHaveLength(2);
    expect(steps[0].action).toBe("click");
    expect(steps[1].action).toBe("fill");
  });

  it("carries smart selectors to flow steps", () => {
    const smartSelectors = [
      { value: "[data-testid='btn']", strategy: "data-testid" as const },
      { value: "#btn", strategy: "id" as const },
    ];

    const steps = convertSteps([
      makeStep({
        type: "click",
        selector: "#btn",
        smartSelectors,
        timestamp: 1000,
      }),
    ]);

    expect(steps[0].smartSelectors).toEqual(smartSelectors);
  });

  it("maps submit to click", () => {
    const steps = convertSteps([
      makeStep({ type: "submit", selector: "#form", timestamp: 1000 }),
    ]);

    expect(steps[0].action).toBe("click");
  });

  it("maps hover to click", () => {
    const steps = convertSteps([
      makeStep({ type: "hover", selector: "#el", timestamp: 1000 }),
    ]);

    expect(steps[0].action).toBe("click");
  });

  it("returns empty array for empty input", () => {
    expect(convertSteps([])).toEqual([]);
  });

  it("preserves step label", () => {
    const steps = convertSteps([
      makeStep({
        type: "click",
        selector: "#btn",
        label: "Submit button",
        timestamp: 1000,
      }),
    ]);

    expect(steps[0].label).toBe("Submit button");
  });
});
