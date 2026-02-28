// @vitest-environment happy-dom
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import type { FormField } from "@/types";

vi.mock("@/lib/form/extractors", () => ({
  getUniqueSelector: vi.fn().mockReturnValue("#mock-field"),
  findLabelWithStrategy: vi
    .fn()
    .mockReturnValue({ text: "Mock Label", strategy: "aria-label" }),
  buildSignals: vi.fn().mockReturnValue("mock label"),
}));

import {
  ALL_CLASSIFIERS,
  DEFAULT_PIPELINE,
  DEFAULT_COLLECTION_PIPELINE,
  getActiveClassifiers,
  setActiveClassifiers,
  buildClassifiersFromSettings,
  nativeInputDetector,
  classifyCustomFieldsSync,
  detectNativeFieldsAsync,
  streamNativeFieldsAsync,
  keywordClassifier,
} from "../classifiers";

// ── Helpers ───────────────────────────────────────────────────────────────────

function classifierNames(list: ReadonlyArray<{ name: string }>) {
  return list.map((c) => c.name);
}

// ── ALL_CLASSIFIERS ───────────────────────────────────────────────────────────

describe("ALL_CLASSIFIERS", () => {
  it("contains 5 classifiers", () => {
    expect(ALL_CLASSIFIERS).toHaveLength(5);
  });

  it("starts with html-type", () => {
    expect(ALL_CLASSIFIERS[0].name).toBe("html-type");
  });

  it("has keyword second", () => {
    expect(ALL_CLASSIFIERS[1].name).toBe("keyword");
  });

  it("has tensorflow third", () => {
    expect(ALL_CLASSIFIERS[2].name).toBe("tensorflow");
  });

  it("has chrome-ai fourth", () => {
    expect(ALL_CLASSIFIERS[3].name).toBe("chrome-ai");
  });

  it("ends with html-fallback", () => {
    expect(ALL_CLASSIFIERS[4].name).toBe("html-fallback");
  });

  it("every classifier has a detect function", () => {
    for (const c of ALL_CLASSIFIERS) {
      expect(typeof c.detect).toBe("function");
    }
  });
});

// ── DEFAULT_PIPELINE ──────────────────────────────────────────────────────────

describe("DEFAULT_PIPELINE", () => {
  it("is a DetectionPipeline instance with all classifiers", () => {
    expect(classifierNames(DEFAULT_PIPELINE.classifiers)).toEqual(
      classifierNames(ALL_CLASSIFIERS),
    );
  });
});

// ── getActiveClassifiers / setActiveClassifiers ───────────────────────────────

describe("getActiveClassifiers / setActiveClassifiers", () => {
  beforeEach(() => {
    // Reset to default after each test
    setActiveClassifiers([...ALL_CLASSIFIERS] as any);
  });

  it("returns all classifiers by default", () => {
    const active = getActiveClassifiers();
    expect(classifierNames(active)).toEqual(classifierNames(ALL_CLASSIFIERS));
  });

  it("reflects changes made via setActiveClassifiers", () => {
    const subset = ALL_CLASSIFIERS.filter((c) =>
      ["html-type", "html-fallback"].includes(c.name),
    ) as any[];
    setActiveClassifiers(subset);
    const active = getActiveClassifiers();
    expect(classifierNames(active)).toEqual(["html-type", "html-fallback"]);
  });

  it("returns empty array when set to empty", () => {
    setActiveClassifiers([]);
    expect(getActiveClassifiers()).toHaveLength(0);
  });

  it("returns the exact array reference passed in", () => {
    const custom: any[] = [];
    setActiveClassifiers(custom);
    expect(getActiveClassifiers()).toBe(custom);
  });
});

// ── buildClassifiersFromSettings ──────────────────────────────────────────────

describe("buildClassifiersFromSettings", () => {
  it("returns only enabled classifiers", () => {
    const result = buildClassifiersFromSettings([
      { name: "html-type", enabled: true },
      { name: "keyword", enabled: false },
      { name: "tensorflow", enabled: true },
    ]);
    const names = classifierNames(result);
    expect(names).toContain("html-type");
    expect(names).not.toContain("keyword");
    expect(names).toContain("tensorflow");
  });

  it("always appends html-fallback when not explicitly included", () => {
    const result = buildClassifiersFromSettings([
      { name: "html-type", enabled: true },
    ]);
    const names = classifierNames(result);
    expect(names[names.length - 1]).toBe("html-fallback");
  });

  it("does not duplicate html-fallback when already included", () => {
    const result = buildClassifiersFromSettings([
      { name: "html-type", enabled: true },
      { name: "html-fallback", enabled: true },
    ]);
    const fallbackCount = result.filter(
      (c) => c.name === "html-fallback",
    ).length;
    expect(fallbackCount).toBe(1);
  });

  it("respects the order of config entries", () => {
    const result = buildClassifiersFromSettings([
      { name: "tensorflow", enabled: true },
      { name: "keyword", enabled: true },
      { name: "html-type", enabled: true },
    ]);
    // html-fallback is always last; before that: tensorflow, keyword, html-type
    const names = classifierNames(result);
    expect(names[0]).toBe("tensorflow");
    expect(names[1]).toBe("keyword");
    expect(names[2]).toBe("html-type");
    // html-fallback appended at end
    expect(names[names.length - 1]).toBe("html-fallback");
  });

  it("ignores unknown classifier names", () => {
    const result = buildClassifiersFromSettings([
      { name: "nonexistent-classifier", enabled: true },
      { name: "html-type", enabled: true },
    ]);
    const names = classifierNames(result);
    expect(names).not.toContain("nonexistent-classifier");
    expect(names).toContain("html-type");
  });

  it("returns only html-fallback when all configs are disabled", () => {
    const result = buildClassifiersFromSettings([
      { name: "html-type", enabled: false },
      { name: "keyword", enabled: false },
    ]);
    const names = classifierNames(result);
    expect(names).toEqual(["html-fallback"]);
  });

  it("returns only html-fallback for empty config", () => {
    const result = buildClassifiersFromSettings([]);
    const names = classifierNames(result);
    expect(names).toEqual(["html-fallback"]);
  });
});

// ── DEFAULT_COLLECTION_PIPELINE ──────────────────────────────────────────────

describe("DEFAULT_COLLECTION_PIPELINE", () => {
  it("contains the nativeInputDetector", () => {
    const names = DEFAULT_COLLECTION_PIPELINE.detectors.map((d) => d.name);
    expect(names).toContain("native-inputs");
  });

  it("has nativeInputDetector as first detector", () => {
    expect(DEFAULT_COLLECTION_PIPELINE.detectors[0].name).toBe("native-inputs");
  });
});

// ── nativeInputDetector ──────────────────────────────────────────────────────

describe("nativeInputDetector", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    setActiveClassifiers([...ALL_CLASSIFIERS] as any);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it('has name "native-inputs"', () => {
    expect(nativeInputDetector.name).toBe("native-inputs");
  });

  it("returns empty array when page has no native inputs", () => {
    document.body.innerHTML = "<div>no inputs here</div>";
    const fields = nativeInputDetector.detect();
    expect(fields).toEqual([]);
  });

  it("skips hidden and submit inputs", () => {
    document.body.innerHTML = `
      <input type="hidden" value="secret" />
      <input type="submit" value="Submit" />
      <input type="button" value="Click" />
    `;
    const fields = nativeInputDetector.detect();
    expect(fields).toEqual([]);
  });

  it("collects visible text inputs via getBoundingClientRect mock", () => {
    document.body.innerHTML = `<input type="text" id="name-field" />`;
    const input = document.getElementById("name-field") as HTMLInputElement;
    vi.spyOn(input, "getBoundingClientRect").mockReturnValue({
      width: 200,
      height: 40,
      top: 0,
      left: 0,
      bottom: 40,
      right: 200,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    } as DOMRect);
    const fields = nativeInputDetector.detect();
    expect(fields.length).toBeGreaterThanOrEqual(1);
  });

  it("skips disabled elements", () => {
    document.body.innerHTML = `<input type="text" disabled />`;
    const fields = nativeInputDetector.detect();
    expect(fields).toEqual([]);
  });
});

// ── detectNativeFieldsAsync ──────────────────────────────────────────────────

describe("detectNativeFieldsAsync", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    setActiveClassifiers([...ALL_CLASSIFIERS] as any);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns empty array when page has no visible inputs", async () => {
    document.body.innerHTML = "<div>nothing here</div>";
    const fields = await detectNativeFieldsAsync();
    expect(Array.isArray(fields)).toBe(true);
    expect(fields).toHaveLength(0);
  });

  it("returns FormField array with visible inputs", async () => {
    document.body.innerHTML = `<input type="text" id="async-field" />`;
    const input = document.getElementById("async-field") as HTMLInputElement;
    vi.spyOn(input, "getBoundingClientRect").mockReturnValue({
      width: 200,
      height: 40,
      top: 0,
      left: 0,
      bottom: 40,
      right: 200,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    } as DOMRect);
    const fields = await detectNativeFieldsAsync();
    expect(fields.length).toBeGreaterThanOrEqual(1);
  });
});

// ── streamNativeFieldsAsync ──────────────────────────────────────────────────

describe("streamNativeFieldsAsync", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    setActiveClassifiers([...ALL_CLASSIFIERS] as any);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("yields nothing when page has no visible inputs", async () => {
    document.body.innerHTML = "<p>empty page</p>";
    const collected: FormField[] = [];
    for await (const field of streamNativeFieldsAsync()) {
      collected.push(field);
    }
    expect(collected).toHaveLength(0);
  });

  it("yields FormField for each visible input", async () => {
    document.body.innerHTML = `<input type="text" id="stream-field" />`;
    const input = document.getElementById("stream-field") as HTMLInputElement;
    vi.spyOn(input, "getBoundingClientRect").mockReturnValue({
      width: 200,
      height: 40,
      top: 0,
      left: 0,
      bottom: 40,
      right: 200,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    } as DOMRect);
    const collected: FormField[] = [];
    for await (const field of streamNativeFieldsAsync()) {
      collected.push(field);
    }
    expect(collected.length).toBeGreaterThanOrEqual(1);
  });
});

// ── classifyCustomFieldsSync ─────────────────────────────────────────────────

function makeCustomField(overrides: Partial<FormField> = {}): FormField {
  return {
    element: document.createElement("input"),
    selector: "#custom-field",
    category: "generic",
    fieldType: "select",
    label: "Test",
    name: "test",
    id: "custom-field",
    placeholder: "",
    required: false,
    options: [],
    ...overrides,
  };
}

describe("classifyCustomFieldsSync", () => {
  it("returns same array reference", () => {
    const fields: FormField[] = [];
    const result = classifyCustomFieldsSync(fields);
    expect(result).toBe(fields);
  });

  it("returns empty array unchanged", () => {
    const result = classifyCustomFieldsSync([]);
    expect(result).toHaveLength(0);
  });

  it("applies keyword result when non-generic type is returned", () => {
    const field = makeCustomField({ fieldType: "select", label: "Email" });
    vi.spyOn(keywordClassifier, "detect").mockReturnValueOnce({
      type: "email",
      confidence: 0.95,
    });
    classifyCustomFieldsSync([field]);
    expect(field.fieldType).toBe("email");
    expect(field.detectionMethod).toBe("keyword");
    expect(field.detectionConfidence).toBe(0.95);
  });

  it("does NOT override concrete type when keyword returns generic 'text'", () => {
    const field = makeCustomField({ fieldType: "select", label: "Escolha" });
    vi.spyOn(keywordClassifier, "detect").mockReturnValueOnce({
      type: "text",
      confidence: 0.5,
    });
    classifyCustomFieldsSync([field]);
    expect(field.fieldType).toBe("select"); // not overridden
    expect(field.detectionMethod).toBe("keyword");
    expect(field.detectionConfidence).toBe(0.5);
  });

  it("overrides when both keyword and field have generic types", () => {
    const field = makeCustomField({ fieldType: "text", label: "Texto" });
    vi.spyOn(keywordClassifier, "detect").mockReturnValueOnce({
      type: "unknown",
      confidence: 0.3,
    });
    classifyCustomFieldsSync([field]);
    expect(field.fieldType).toBe("unknown"); // both generic → override
    expect(field.detectionMethod).toBe("keyword");
  });

  it("stamps custom-select when keyword returns null and no detectionMethod", () => {
    const field = makeCustomField({
      fieldType: "select",
      detectionMethod: undefined,
    });
    vi.spyOn(keywordClassifier, "detect").mockReturnValueOnce(null);
    classifyCustomFieldsSync([field]);
    expect(field.detectionMethod).toBe("custom-select");
    expect(field.detectionConfidence).toBe(0.9);
  });

  it("does not overwrite existing detectionMethod when keyword returns null", () => {
    const field = makeCustomField({
      fieldType: "select",
      detectionMethod: "html-type",
      detectionConfidence: 1.0,
    });
    vi.spyOn(keywordClassifier, "detect").mockReturnValueOnce(null);
    classifyCustomFieldsSync([field]);
    expect(field.detectionMethod).toBe("html-type"); // unchanged
    expect(field.detectionConfidence).toBe(1.0); // unchanged
  });

  it("processes multiple fields independently", () => {
    const field1 = makeCustomField({
      id: "f1",
      fieldType: "select",
      label: "CPF",
    });
    const field2 = makeCustomField({
      id: "f2",
      fieldType: "text",
      label: "Unknown",
    });
    vi.spyOn(keywordClassifier, "detect")
      .mockReturnValueOnce({ type: "cpf", confidence: 0.99 })
      .mockReturnValueOnce(null);
    classifyCustomFieldsSync([field1, field2]);
    expect(field1.fieldType).toBe("cpf");
    expect(field2.detectionMethod).toBe("custom-select");
  });
});
