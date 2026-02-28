import { describe, expect, it, vi } from "vitest";
import { DetectionPipeline } from "@/lib/form/detectors/pipeline";
import type {
  FieldClassifier,
  ClassifierResult,
} from "@/lib/form/detectors/pipeline";
import type { FormField, DetectionMethod } from "@/types";

// ── Test helpers ─────────────────────────────────────────────────────────────

function makeField(overrides: Partial<FormField> = {}): FormField {
  return {
    element: { tagName: "INPUT", type: "text" } as unknown as HTMLInputElement,
    selector: "#test-field",
    category: "personal",
    fieldType: "text",
    label: "Test",
    name: "test",
    id: "test-field",
    placeholder: "",
    required: false,
    options: [],
    ...overrides,
  };
}

function makeClassifier(
  name: DetectionMethod,
  result: ClassifierResult | null,
): FieldClassifier {
  return {
    name,
    detect: vi.fn().mockReturnValue(result),
  };
}

function makeAsyncClassifier(
  name: DetectionMethod,
  result: ClassifierResult | null,
): FieldClassifier {
  return {
    name,
    detect: vi.fn().mockReturnValue(null),
    detectAsync: vi.fn().mockResolvedValue(result),
  };
}

// ── DetectionPipeline.run ────────────────────────────────────────────────────

describe("DetectionPipeline.run", () => {
  it("returns the first confident result", () => {
    const emailClassifier = makeClassifier("keyword", {
      type: "email",
      confidence: 0.9,
    });
    const pipeline = new DetectionPipeline([emailClassifier]);
    const result = pipeline.run(makeField());
    expect(result.type).toBe("email");
    expect(result.method).toBe("keyword");
    expect(result.confidence).toBe(0.9);
  });

  it("skips classifiers that return null", () => {
    const nullClassifier = makeClassifier("html-type", null);
    const emailClassifier = makeClassifier("keyword", {
      type: "email",
      confidence: 0.8,
    });
    const pipeline = new DetectionPipeline([nullClassifier, emailClassifier]);
    const result = pipeline.run(makeField());
    expect(result.type).toBe("email");
    expect(result.method).toBe("keyword");
  });

  it("skips classifiers that return type=unknown", () => {
    const unknownClassifier = makeClassifier("keyword", {
      type: "unknown",
      confidence: 0.1,
    });
    const cpfClassifier = makeClassifier("html-type", {
      type: "cpf",
      confidence: 1.0,
    });
    const pipeline = new DetectionPipeline([unknownClassifier, cpfClassifier]);
    const result = pipeline.run(makeField());
    expect(result.type).toBe("cpf");
    expect(result.method).toBe("html-type");
  });

  it("falls back to html-fallback when all classifiers return null", () => {
    const nullClassifier = makeClassifier("keyword", null);
    const pipeline = new DetectionPipeline([nullClassifier]);
    const result = pipeline.run(makeField());
    expect(result.type).toBe("unknown");
    expect(result.method).toBe("html-fallback");
    expect(result.confidence).toBe(0.1);
  });

  it("includes durationMs and timings in result", () => {
    const classifier = makeClassifier("html-type", {
      type: "email",
      confidence: 1.0,
    });
    const pipeline = new DetectionPipeline([classifier]);
    const result = pipeline.run(makeField());
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.timings).toHaveLength(1);
    expect(result.timings[0].strategy).toBe("html-type");
  });

  it("includes decision trace entries", () => {
    const nullClassifier = makeClassifier("keyword", null);
    const emailClassifier = makeClassifier("html-type", {
      type: "email",
      confidence: 0.9,
    });
    const pipeline = new DetectionPipeline([nullClassifier, emailClassifier]);
    const result = pipeline.run(makeField());
    expect(result.decisionTrace.some((t) => t.includes("null"))).toBe(true);
    expect(result.decisionTrace.some((t) => t.includes("selected"))).toBe(true);
  });

  it("collects all non-null predictions", () => {
    const unknownClassifier = makeClassifier("keyword", {
      type: "unknown",
      confidence: 0.1,
    });
    const emailClassifier = makeClassifier("html-type", {
      type: "email",
      confidence: 0.9,
    });
    const pipeline = new DetectionPipeline([
      unknownClassifier,
      emailClassifier,
    ]);
    const result = pipeline.run(makeField());
    expect(result.predictions).toHaveLength(2);
  });
});

// ── DetectionPipeline.runAsync ───────────────────────────────────────────────

describe("DetectionPipeline.runAsync", () => {
  it("prefers detectAsync over detect", async () => {
    const asyncClassifier = makeAsyncClassifier("chrome-ai", {
      type: "email",
      confidence: 0.95,
    });
    const pipeline = new DetectionPipeline([asyncClassifier]);
    const result = await pipeline.runAsync(makeField());
    expect(result.type).toBe("email");
    expect(asyncClassifier.detectAsync).toHaveBeenCalled();
    expect(asyncClassifier.detect).not.toHaveBeenCalled();
  });

  it("falls back to sync detect when detectAsync not present", async () => {
    const syncClassifier = makeClassifier("keyword", {
      type: "email",
      confidence: 0.9,
    });
    const pipeline = new DetectionPipeline([syncClassifier]);
    const result = await pipeline.runAsync(makeField());
    expect(result.type).toBe("email");
    expect(syncClassifier.detect).toHaveBeenCalled();
  });

  it("falls back to html-fallback when all async resolve null", async () => {
    const asyncNull = makeAsyncClassifier("chrome-ai", null);
    const pipeline = new DetectionPipeline([asyncNull]);
    const result = await pipeline.runAsync(makeField());
    expect(result.type).toBe("unknown");
    expect(result.method).toBe("html-fallback");
  });
});

// ── Pipeline mutating operators ──────────────────────────────────────────────

describe("DetectionPipeline.without", () => {
  it("returns new pipeline excluding the specified classifier", () => {
    const htmlClassifier = makeClassifier("html-type", null);
    const keywordClassifier = makeClassifier("keyword", null);
    const original = new DetectionPipeline([htmlClassifier, keywordClassifier]);
    const modified = original.without("keyword");
    expect(modified.classifiers).toHaveLength(1);
    expect(modified.classifiers[0].name).toBe("html-type");
  });

  it("does not mutate the original pipeline", () => {
    const classifier = makeClassifier("html-type", null);
    const original = new DetectionPipeline([classifier]);
    original.without("html-type");
    expect(original.classifiers).toHaveLength(1);
  });
});

describe("DetectionPipeline.with", () => {
  it("returns new pipeline with classifier appended", () => {
    const existing = makeClassifier("html-type", null);
    const added = makeClassifier("keyword", null);
    const pipeline = new DetectionPipeline([existing]).with(added);
    expect(pipeline.classifiers).toHaveLength(2);
    expect(pipeline.classifiers[1].name).toBe("keyword");
  });

  it("does not mutate original pipeline", () => {
    const original = new DetectionPipeline([makeClassifier("html-type", null)]);
    original.with(makeClassifier("keyword", null));
    expect(original.classifiers).toHaveLength(1);
  });
});

describe("DetectionPipeline.withOrder", () => {
  it("reorders classifiers by given names", () => {
    const a = makeClassifier("html-type", null);
    const b = makeClassifier("keyword", null);
    const original = new DetectionPipeline([a, b]);
    const reordered = original.withOrder(["keyword", "html-type"]);
    expect(reordered.classifiers[0].name).toBe("keyword");
    expect(reordered.classifiers[1].name).toBe("html-type");
  });

  it("drops classifiers not in the given names list", () => {
    const a = makeClassifier("html-type", null);
    const b = makeClassifier("keyword", null);
    const c = makeClassifier("tensorflow", null);
    const original = new DetectionPipeline([a, b, c]);
    const reordered = original.withOrder(["tensorflow", "html-type"]);
    expect(reordered.classifiers).toHaveLength(2);
    expect(
      reordered.classifiers.find((c) => c.name === "keyword"),
    ).toBeUndefined();
  });
});

describe("DetectionPipeline.insertBefore", () => {
  it("inserts classifier before the target", () => {
    const a = makeClassifier("html-type", null);
    const b = makeClassifier("keyword", null);
    const c = makeClassifier("tensorflow", null);
    const original = new DetectionPipeline([a, b]);
    const modified = original.insertBefore("keyword", c);
    expect(modified.classifiers[1].name).toBe("tensorflow");
    expect(modified.classifiers[2].name).toBe("keyword");
  });

  it("appends when target not found", () => {
    const a = makeClassifier("html-type", null);
    const b = makeClassifier("keyword", null);
    const original = new DetectionPipeline([a]);
    const modified = original.insertBefore("keyword", b);
    expect(modified.classifiers).toHaveLength(2);
    expect(modified.classifiers[1].name).toBe("keyword");
  });
});
