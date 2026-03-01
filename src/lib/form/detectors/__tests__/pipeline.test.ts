import { describe, expect, it, vi } from "vitest";
import {
  DetectionPipeline,
  FieldCollectionPipeline,
} from "@/lib/form/detectors/pipeline";
import type {
  FieldClassifier,
  ClassifierResult,
  PageDetector,
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

// ── DetectionPipeline.runAsync ────────────────────────────────────────────────

describe("DetectionPipeline.runAsync", () => {
  it("returns the first confident result", async () => {
    const emailClassifier = makeClassifier("keyword", {
      type: "email",
      confidence: 0.9,
    });
    const pipeline = new DetectionPipeline([emailClassifier]);
    const result = await pipeline.runAsync(makeField());
    expect(result.type).toBe("email");
    expect(result.method).toBe("keyword");
    expect(result.confidence).toBe(0.9);
  });

  it("skips classifiers that return null", async () => {
    const nullClassifier = makeClassifier("html-type", null);
    const emailClassifier = makeClassifier("keyword", {
      type: "email",
      confidence: 0.8,
    });
    const pipeline = new DetectionPipeline([nullClassifier, emailClassifier]);
    const result = await pipeline.runAsync(makeField());
    expect(result.type).toBe("email");
    expect(result.method).toBe("keyword");
  });

  it("skips classifiers that return type=unknown", async () => {
    const unknownClassifier = makeClassifier("keyword", {
      type: "unknown",
      confidence: 0.1,
    });
    const cpfClassifier = makeClassifier("html-type", {
      type: "cpf",
      confidence: 1.0,
    });
    const pipeline = new DetectionPipeline([unknownClassifier, cpfClassifier]);
    const result = await pipeline.runAsync(makeField());
    expect(result.type).toBe("cpf");
    expect(result.method).toBe("html-type");
  });

  it("falls back to html-fallback when all classifiers return null", async () => {
    const nullClassifier = makeClassifier("keyword", null);
    const pipeline = new DetectionPipeline([nullClassifier]);
    const result = await pipeline.runAsync(makeField());
    expect(result.type).toBe("unknown");
    expect(result.method).toBe("html-fallback");
    expect(result.confidence).toBe(0.1);
  });

  it("includes durationMs and timings in result", async () => {
    const classifier = makeClassifier("html-type", {
      type: "email",
      confidence: 1.0,
    });
    const pipeline = new DetectionPipeline([classifier]);
    const result = await pipeline.runAsync(makeField());
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.timings).toHaveLength(1);
    expect(result.timings[0].strategy).toBe("html-type");
  });

  it("includes decision trace entries", async () => {
    const nullClassifier = makeClassifier("keyword", null);
    const emailClassifier = makeClassifier("html-type", {
      type: "email",
      confidence: 0.9,
    });
    const pipeline = new DetectionPipeline([nullClassifier, emailClassifier]);
    const result = await pipeline.runAsync(makeField());
    expect(result.decisionTrace.some((t) => t.includes("null"))).toBe(true);
    expect(result.decisionTrace.some((t) => t.includes("selected"))).toBe(true);
  });

  it("collects all non-null predictions", async () => {
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
    const result = await pipeline.runAsync(makeField());
    expect(result.predictions).toHaveLength(2);
  });

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

  it("skips unknown result from first classifier and uses next", async () => {
    const unknownClassifier = makeAsyncClassifier("chrome-ai", {
      type: "unknown",
      confidence: 0.3,
    });
    const goodClassifier = makeClassifier("keyword", {
      type: "email",
      confidence: 0.9,
    });
    const pipeline = new DetectionPipeline([unknownClassifier, goodClassifier]);
    const result = await pipeline.runAsync(makeField());
    expect(result.type).toBe("email");
    expect(result.method).toBe("keyword");
  });

  it("includes unknown result in predictions but keeps going", async () => {
    const unknownClassifier = makeAsyncClassifier("chrome-ai", {
      type: "unknown",
      confidence: 0.2,
    });
    const pipeline = new DetectionPipeline([unknownClassifier]);
    const result = await pipeline.runAsync(makeField());
    // Falls back to html-fallback since only unknown was returned
    expect(result.type).toBe("unknown");
    expect(result.decisionTrace).toEqual(
      expect.arrayContaining([expect.stringContaining("chrome-ai: unknown")]),
    );
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

// ── FieldCollectionPipeline ──────────────────────────────────────────────────

function makePageDetector(
  name: string,
  fields: FormField[] = [],
): PageDetector {
  return {
    name,
    detect: vi.fn().mockReturnValue(fields),
  };
}

describe("FieldCollectionPipeline.run", () => {
  it("returns empty array when no detectors", () => {
    const pipeline = new FieldCollectionPipeline([]);
    expect(pipeline.run()).toEqual([]);
  });

  it("concatenates results from all detectors", () => {
    const f1 = makeField({ id: "f1", selector: "#f1" });
    const f2 = makeField({ id: "f2", selector: "#f2" });
    const d1 = makePageDetector("detector-a", [f1]);
    const d2 = makePageDetector("detector-b", [f2]);
    const pipeline = new FieldCollectionPipeline([d1, d2]);
    const result = pipeline.run();
    expect(result).toHaveLength(2);
    expect(result[0].selector).toBe("#f1");
    expect(result[1].selector).toBe("#f2");
  });

  it("returns only fields from detectors that have results", () => {
    const f1 = makeField({ id: "f1", selector: "#f1" });
    const d1 = makePageDetector("detector-a", [f1]);
    const d2 = makePageDetector("detector-b", []);
    const pipeline = new FieldCollectionPipeline([d1, d2]);
    const result = pipeline.run();
    expect(result).toHaveLength(1);
  });
});

describe("FieldCollectionPipeline.with", () => {
  it("returns a new pipeline with the detector appended", () => {
    const d1 = makePageDetector("d1");
    const d2 = makePageDetector("d2");
    const original = new FieldCollectionPipeline([d1]);
    const extended = original.with(d2);
    expect(extended.detectors).toHaveLength(2);
    expect(extended.detectors[1].name).toBe("d2");
  });

  it("does not mutate the original pipeline", () => {
    const d1 = makePageDetector("d1");
    const d2 = makePageDetector("d2");
    const original = new FieldCollectionPipeline([d1]);
    original.with(d2);
    expect(original.detectors).toHaveLength(1);
  });
});

describe("FieldCollectionPipeline.without", () => {
  it("returns a new pipeline excluding the named detector", () => {
    const d1 = makePageDetector("native-inputs");
    const d2 = makePageDetector("custom-selects");
    const original = new FieldCollectionPipeline([d1, d2]);
    const modified = original.without("custom-selects");
    expect(modified.detectors).toHaveLength(1);
    expect(modified.detectors[0].name).toBe("native-inputs");
  });

  it("returns same-length pipeline when name not found", () => {
    const d1 = makePageDetector("native-inputs");
    const original = new FieldCollectionPipeline([d1]);
    const modified = original.without("nonexistent");
    expect(modified.detectors).toHaveLength(1);
  });

  it("can exclude multiple names at once", () => {
    const d1 = makePageDetector("d1");
    const d2 = makePageDetector("d2");
    const d3 = makePageDetector("d3");
    const pipeline = new FieldCollectionPipeline([d1, d2, d3]);
    const modified = pipeline.without("d1", "d3");
    expect(modified.detectors).toHaveLength(1);
    expect(modified.detectors[0].name).toBe("d2");
  });
});

describe("FieldCollectionPipeline.withOrder", () => {
  it("reorders detectors by name", () => {
    const d1 = makePageDetector("d1");
    const d2 = makePageDetector("d2");
    const d3 = makePageDetector("d3");
    const original = new FieldCollectionPipeline([d1, d2, d3]);
    const reordered = original.withOrder(["d3", "d1", "d2"]);
    expect(reordered.detectors.map((d) => d.name)).toEqual(["d3", "d1", "d2"]);
  });

  it("excludes detectors not in the order list", () => {
    const d1 = makePageDetector("d1");
    const d2 = makePageDetector("d2");
    const original = new FieldCollectionPipeline([d1, d2]);
    const reordered = original.withOrder(["d2"]);
    expect(reordered.detectors).toHaveLength(1);
    expect(reordered.detectors[0].name).toBe("d2");
  });

  it("returns empty pipeline when no names match", () => {
    const d1 = makePageDetector("d1");
    const original = new FieldCollectionPipeline([d1]);
    const reordered = original.withOrder(["nonexistent"]);
    expect(reordered.detectors).toHaveLength(0);
  });
});
