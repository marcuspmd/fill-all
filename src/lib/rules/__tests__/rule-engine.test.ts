/** @vitest-environment happy-dom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FieldRule, FormField } from "@/types";
import { resolveFieldValue } from "@/lib/rules/rule-engine";

const mockGetRulesForUrl = vi.fn();
const mockGenerate = vi.fn();
const mockGenerateWithConstraints = vi.fn();
const mockAdaptGeneratedValue = vi.fn();

vi.mock("@/lib/storage/storage", () => ({
  getRulesForUrl: (...args: unknown[]) => mockGetRulesForUrl(...args),
}));

vi.mock("@/lib/generators", () => ({
  generate: (...args: unknown[]) => mockGenerate(...args),
}));

vi.mock("@/lib/generators/adaptive", () => ({
  generateWithConstraints: (...args: unknown[]) =>
    mockGenerateWithConstraints(...args),
  adaptGeneratedValue: (...args: unknown[]) => mockAdaptGeneratedValue(...args),
}));

function createField(overrides: Partial<FormField> = {}): FormField {
  const element = document.createElement("input");
  element.type = "text";
  element.name = "email";

  return {
    element,
    selector: "#email",
    category: "contact",
    fieldType: "email",
    contextualType: undefined,
    label: "Email",
    name: "email",
    id: "email",
    placeholder: "Seu email",
    required: false,
    ...overrides,
  };
}

function createRule(overrides: Partial<FieldRule> = {}): FieldRule {
  return {
    id: "rule-1",
    urlPattern: "*example.com*",
    fieldSelector: "#email",
    fieldName: "email",
    fieldType: "email",
    generator: "auto",
    priority: 10,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("rule-engine/resolveFieldValue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRulesForUrl.mockResolvedValue([]);
    mockGenerate.mockReturnValue("generated-value");
    mockGenerateWithConstraints.mockImplementation((fn: () => string) => fn());
    mockAdaptGeneratedValue.mockImplementation((value: string) => value);
  });

  it("retorna fixedValue da regra quando disponível", async () => {
    const field = createField();
    mockGetRulesForUrl.mockResolvedValue([
      createRule({ fixedValue: "fixo@site.com" }),
    ]);

    const result = await resolveFieldValue(field, "https://example.com");

    expect(result).toEqual({
      fieldSelector: "#email",
      value: "fixo@site.com",
      source: "rule",
    });
  });

  it("seleciona opção por índice da regra em campo select", async () => {
    const select = document.createElement("select");
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.text = "Selecione";

    const optionA = document.createElement("option");
    optionA.value = "a";
    optionA.text = "A";

    const optionB = document.createElement("option");
    optionB.value = "b";
    optionB.text = "B";

    select.append(placeholder, optionA, optionB);

    const field = createField({
      element: select,
      selector: "#estado",
      fieldType: "state",
    });

    mockGetRulesForUrl.mockResolvedValue([
      createRule({
        fieldSelector: "#estado",
        fieldType: "state",
        selectOptionIndex: 2,
      }),
    ]);

    const result = await resolveFieldValue(field, "https://example.com");

    expect(result).toEqual({
      fieldSelector: "#estado",
      value: "a",
      source: "rule",
    });
  });

  it("usa gerador definido na regra quando generator não é auto/ai/tensorflow", async () => {
    const field = createField({ fieldType: "cpf" });
    mockGetRulesForUrl.mockResolvedValue([
      createRule({ fieldType: "cpf", generator: "cpf" }),
    ]);
    mockGenerate.mockReturnValue("11111111111");
    mockGenerateWithConstraints.mockReturnValue("111.111.111-11");

    const result = await resolveFieldValue(field, "https://example.com");

    expect(mockGenerateWithConstraints).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      fieldSelector: "#email",
      value: "111.111.111-11",
      source: "generator",
    });
  });

  it("usa AI quando regra especifica generator=ai", async () => {
    const field = createField({ fieldType: "text" });
    const aiGenerateFn = vi.fn().mockResolvedValue("gerado por ai");
    mockGetRulesForUrl.mockResolvedValue([
      createRule({ fieldType: "text", generator: "ai" }),
    ]);

    const result = await resolveFieldValue(
      field,
      "https://example.com",
      aiGenerateFn,
    );

    expect(aiGenerateFn).toHaveBeenCalledWith(field);
    expect(result).toEqual({
      fieldSelector: "#email",
      value: "gerado por ai",
      source: "ai",
    });
  });

  it("força AI primeiro quando forceAIFirst=true", async () => {
    const field = createField({ fieldType: "text" });
    const aiGenerateFn = vi.fn().mockResolvedValue("ai-primeiro");

    const result = await resolveFieldValue(
      field,
      "https://example.com",
      aiGenerateFn,
      true,
    );

    expect(result).toEqual({
      fieldSelector: "#email",
      value: "ai-primeiro",
      source: "ai",
    });
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("usa contextualType quando fieldType é unknown", async () => {
    const field = createField({
      fieldType: "unknown",
      contextualType: "email",
    });
    mockGenerate.mockReturnValue("context@example.com");

    const result = await resolveFieldValue(field, "https://example.com");

    expect(mockGenerate).toHaveBeenCalledWith("email");
    expect(result).toEqual({
      fieldSelector: "#email",
      value: "context@example.com",
      source: "generator",
    });
  });

  it("retorna true para checkbox/radio", async () => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    const field = createField({ element: checkbox, fieldType: "checkbox" });
    mockGenerateWithConstraints.mockReturnValue("");

    const result = await resolveFieldValue(field, "https://example.com");

    expect(result).toEqual({
      fieldSelector: "#email",
      value: "true",
      source: "generator",
    });
  });

  it("usa fallback de AI quando gerador retorna vazio para tipo elegível", async () => {
    const aiGenerateFn = vi.fn().mockResolvedValue("texto-ai");
    const field = createField({ fieldType: "text" });
    mockGenerateWithConstraints.mockReturnValue("");

    const result = await resolveFieldValue(
      field,
      "https://example.com",
      aiGenerateFn,
    );

    expect(aiGenerateFn).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      fieldSelector: "#email",
      value: "texto-ai",
      source: "ai",
    });
  });
});
