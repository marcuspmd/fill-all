import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/form/detectors/strategies", () => ({
  loadPretrainedModel: vi.fn().mockResolvedValue(undefined),
  invalidateClassifier: vi.fn(),
  reloadClassifier: vi.fn().mockResolvedValue(undefined),
  classifyField: vi.fn().mockReturnValue("email"),
  classifyByTfSoft: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/generators", () => ({
  generate: vi.fn().mockReturnValue("test@example.com"),
}));

import {
  loadPretrainedModel,
  invalidateClassifier,
  reloadClassifier,
  classifyField,
  classifyByTfSoft,
  generateWithTensorFlow,
} from "@/lib/ai/tensorflow-generator";
import { generate } from "@/lib/generators";
import type { FormField } from "@/types";

function makeField(overrides: Partial<FormField> = {}): FormField {
  return {
    element: { tagName: "INPUT", type: "text" } as unknown as HTMLInputElement,
    selector: "#test-field",
    category: "personal",
    fieldType: "email",
    label: "Email",
    placeholder: "",
    name: "email",
    id: "test-field",
    required: false,
    options: [],
    ...overrides,
  };
}

describe("tensorflow-generator re-exports", () => {
  it("exports loadPretrainedModel", () => {
    expect(loadPretrainedModel).toBeDefined();
    expect(typeof loadPretrainedModel).toBe("function");
  });

  it("exports invalidateClassifier", () => {
    expect(invalidateClassifier).toBeDefined();
    expect(typeof invalidateClassifier).toBe("function");
  });

  it("exports reloadClassifier", () => {
    expect(reloadClassifier).toBeDefined();
    expect(typeof reloadClassifier).toBe("function");
  });

  it("exports classifyField", () => {
    expect(classifyField).toBeDefined();
    expect(typeof classifyField).toBe("function");
  });

  it("exports classifyByTfSoft", () => {
    expect(classifyByTfSoft).toBeDefined();
    expect(typeof classifyByTfSoft).toBe("function");
  });
});

describe("generateWithTensorFlow", () => {
  beforeEach(() => {
    vi.mocked(classifyField).mockReturnValue("email");
    vi.mocked(generate).mockReturnValue("test@example.com");
  });

  it("classifies the field and generates a value", async () => {
    const field = makeField();
    const result = await generateWithTensorFlow(field);
    expect(classifyField).toHaveBeenCalledWith(field);
    expect(generate).toHaveBeenCalledWith("email");
    expect(result).toBe("test@example.com");
  });

  it("returns value from generate for any detected type", async () => {
    vi.mocked(classifyField).mockReturnValue("cpf");
    vi.mocked(generate).mockReturnValue("123.456.789-09");
    const result = await generateWithTensorFlow(
      makeField({ signals: { primary: [], secondary: [], structural: [] } }),
    );
    expect(result).toBe("123.456.789-09");
  });
});
