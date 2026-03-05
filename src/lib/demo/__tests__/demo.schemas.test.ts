import { describe, it, expect } from "vitest";
import {
  parseFlowScript,
  parseFlowStep,
  parseReplayConfig,
} from "@/lib/demo/demo.schemas";
import type { FlowScript, FlowStep, ReplayConfig } from "@/lib/demo/demo.types";

// ── Fixtures ──────────────────────────────────────────────────────────────

function validFlowStep(
  overrides: Partial<FlowStep> = {},
): Record<string, unknown> {
  return {
    id: "step_1",
    action: "click",
    selector: "#btn",
    ...overrides,
  };
}

function validReplayConfig(
  overrides: Partial<ReplayConfig> = {},
): Record<string, unknown> {
  return {
    speed: "normal",
    typingDelay: 60,
    stepDelay: 400,
    useRecordedTimings: false,
    highlightDuration: 300,
    ...overrides,
  };
}

function validFlowScript(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: "flow_1",
    metadata: {
      name: "Test Flow",
      baseUrl: "https://example.com",
      seed: "seed123",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
    },
    replayConfig: validReplayConfig(),
    steps: [validFlowStep()],
    ...overrides,
  };
}

// ── parseFlowScript ───────────────────────────────────────────────────────

describe("parseFlowScript", () => {
  it("parses a valid FlowScript", () => {
    const input = validFlowScript();
    const result = parseFlowScript(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe("flow_1");
    expect(result!.metadata.name).toBe("Test Flow");
    expect(result!.steps).toHaveLength(1);
  });

  it("returns null for invalid input", () => {
    expect(parseFlowScript({})).toBeNull();
    expect(parseFlowScript(null)).toBeNull();
    expect(parseFlowScript("string")).toBeNull();
    expect(parseFlowScript(42)).toBeNull();
  });

  it("returns null when steps is empty", () => {
    const input = validFlowScript({ steps: [] });
    expect(parseFlowScript(input)).toBeNull();
  });

  it("returns null when metadata.baseUrl is not a valid URL", () => {
    const input = validFlowScript();
    (input.metadata as Record<string, unknown>).baseUrl = "not-a-url";
    expect(parseFlowScript(input)).toBeNull();
  });

  it("returns null with empty id", () => {
    const input = validFlowScript({ id: "" });
    expect(parseFlowScript(input)).toBeNull();
  });

  it("parses flow with optional metadata fields", () => {
    const input = validFlowScript();
    (input.metadata as Record<string, unknown>).description = "A description";
    (input.metadata as Record<string, unknown>).tags = ["tag1", "tag2"];

    const result = parseFlowScript(input);
    expect(result).not.toBeNull();
    expect(result!.metadata.description).toBe("A description");
    expect(result!.metadata.tags).toEqual(["tag1", "tag2"]);
  });
});

// ── parseFlowStep ─────────────────────────────────────────────────────────

describe("parseFlowStep", () => {
  it("parses a valid step", () => {
    const result = parseFlowStep(validFlowStep());
    expect(result).not.toBeNull();
    expect(result!.action).toBe("click");
    expect(result!.selector).toBe("#btn");
  });

  it("parses a fill step with generator value source", () => {
    const result = parseFlowStep(
      validFlowStep({
        action: "fill",
        valueSource: { type: "generator", fieldType: "cpf" },
      } as Partial<FlowStep>),
    );

    expect(result).not.toBeNull();
    expect(result!.valueSource).toEqual({
      type: "generator",
      fieldType: "cpf",
    });
  });

  it("parses a fill step with fixed value source", () => {
    const result = parseFlowStep(
      validFlowStep({
        action: "fill",
        valueSource: { type: "fixed", value: "hello" },
      } as Partial<FlowStep>),
    );

    expect(result).not.toBeNull();
    expect(result!.valueSource).toEqual({ type: "fixed", value: "hello" });
  });

  it("parses a navigate step with url", () => {
    const result = parseFlowStep(
      validFlowStep({
        action: "navigate",
        url: "https://example.com/page",
      } as Partial<FlowStep>),
    );

    expect(result).not.toBeNull();
    expect(result!.url).toBe("https://example.com/page");
  });

  it("parses assert step with assertion", () => {
    const result = parseFlowStep(
      validFlowStep({
        action: "assert",
        assertion: { operator: "visible" },
      } as Partial<FlowStep>),
    );

    expect(result).not.toBeNull();
    expect(result!.assertion?.operator).toBe("visible");
  });

  it("returns null for invalid action", () => {
    expect(parseFlowStep({ id: "x", action: "invalid-action" })).toBeNull();
  });

  it("returns null for missing id", () => {
    expect(parseFlowStep({ action: "click" })).toBeNull();
  });

  it("returns null for empty id", () => {
    expect(parseFlowStep({ id: "", action: "click" })).toBeNull();
  });

  it("parses step with optional fields", () => {
    const result = parseFlowStep(
      validFlowStep({
        delayBefore: 100,
        delayAfter: 200,
        label: "Click submit",
        optional: true,
      } as Partial<FlowStep>),
    );

    expect(result).not.toBeNull();
    expect(result!.delayBefore).toBe(100);
    expect(result!.delayAfter).toBe(200);
    expect(result!.label).toBe("Click submit");
    expect(result!.optional).toBe(true);
  });
});

// ── parseReplayConfig ─────────────────────────────────────────────────────

describe("parseReplayConfig", () => {
  it("parses valid config", () => {
    const result = parseReplayConfig(validReplayConfig());
    expect(result).not.toBeNull();
    expect(result!.speed).toBe("normal");
    expect(result!.typingDelay).toBe(60);
  });

  it("returns null for invalid speed", () => {
    expect(
      parseReplayConfig(validReplayConfig({ speed: "turbo" as "normal" })),
    ).toBeNull();
  });

  it("returns null for negative typingDelay", () => {
    expect(
      parseReplayConfig(validReplayConfig({ typingDelay: -1 })),
    ).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(parseReplayConfig(null)).toBeNull();
    expect(parseReplayConfig("string")).toBeNull();
    expect(parseReplayConfig(42)).toBeNull();
  });

  it("validates all speed values", () => {
    for (const speed of ["instant", "fast", "normal", "slow"] as const) {
      const result = parseReplayConfig(validReplayConfig({ speed }));
      expect(result).not.toBeNull();
      expect(result!.speed).toBe(speed);
    }
  });
});
