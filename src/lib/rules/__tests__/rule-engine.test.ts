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
  it("pula AI forceAIFirst para fieldType com gerador determinístico", async () => {
    const field = createField({ fieldType: "cpf" });
    const aiGenerateFn = vi.fn().mockResolvedValue("ai-value");
    mockGenerateWithConstraints.mockReturnValue("111.111.111-11");

    const result = await resolveFieldValue(
      field,
      "https://example.com",
      aiGenerateFn,
      true,
    );

    // AI should be skipped for cpf (generator-only type)
    expect(aiGenerateFn).not.toHaveBeenCalled();
    expect(result.source).toBe("generator");
  });

  it("forceAIFirst falha e cai no gerador padrão", async () => {
    const field = createField({ fieldType: "text" });
    const aiGenerateFn = vi.fn().mockRejectedValue(new Error("AI failed"));
    mockGenerateWithConstraints.mockReturnValue("fallback-generated");

    const result = await resolveFieldValue(
      field,
      "https://example.com",
      aiGenerateFn,
      true,
    );

    expect(result.value).toBe("fallback-generated");
    expect(result.source).toBe("generator");
  });

  it("forceAIFirst AI retorna vazio após adapt e cai no gerador padrão", async () => {
    const field = createField({ fieldType: "text" });
    const aiGenerateFn = vi.fn().mockResolvedValue("  ");
    mockAdaptGeneratedValue.mockReturnValue("");
    mockGenerateWithConstraints.mockReturnValue("fallback");

    const result = await resolveFieldValue(
      field,
      "https://example.com",
      aiGenerateFn,
      true,
    );

    expect(result.value).toBe("fallback");
    expect(result.source).toBe("generator");
  });

  it("usa opção aleatória de select quando selectOptionIndex=0", async () => {
    const select = document.createElement("select");
    const optA = document.createElement("option");
    optA.value = "x";
    optA.text = "X";
    select.append(optA);

    const field = createField({
      element: select,
      selector: "#sel",
      fieldType: "state",
    });
    mockGetRulesForUrl.mockResolvedValue([
      createRule({ fieldSelector: "#sel", selectOptionIndex: 0 }),
    ]);

    const result = await resolveFieldValue(field, "https://example.com");
    expect(result.source).toBe("rule");
    expect(result.value).toBe("x");
  });

  it("ignora opção com índice inválido e cai no gerador padrão", async () => {
    const select = document.createElement("select");
    const opt = document.createElement("option");
    opt.value = "z";
    select.append(opt);

    const field = createField({
      element: select,
      selector: "#sel",
      fieldType: "state",
    });
    mockGetRulesForUrl.mockResolvedValue([
      createRule({ fieldSelector: "#sel", selectOptionIndex: 99 }),
    ]);
    mockGenerateWithConstraints.mockReturnValue("gerado");

    const result = await resolveFieldValue(field, "https://example.com");
    expect(result.source).toBe("generator");
  });

  it("encontra regra pelo fieldName quando selector não bate", async () => {
    const input = document.createElement("input");
    input.name = "cpf_field";
    const field = createField({
      element: input,
      name: "cpf_field",
      id: "cpf_field",
      fieldType: "cpf",
    });
    mockGetRulesForUrl.mockResolvedValue([
      createRule({
        fieldSelector: "#inexistente",
        fieldName: "cpf_field",
        fixedValue: "012.345.678-90",
      }),
    ]);

    const result = await resolveFieldValue(field, "https://example.com");
    expect(result.value).toBe("012.345.678-90");
    expect(result.source).toBe("rule");
  });

  it("usa opção aleatória de select quando gerador retorna vazio", async () => {
    const select = document.createElement("select");
    const opt = document.createElement("option");
    opt.value = "opt1";
    opt.text = "Opt 1";
    select.append(opt);

    const field = createField({
      element: select,
      selector: "#sel",
      fieldType: "state",
    });
    mockGenerateWithConstraints.mockReturnValue("");

    const result = await resolveFieldValue(field, "https://example.com");
    expect(result.value).toBe("opt1");
    expect(result.source).toBe("generator");
  });

  it("retorna vazio quando select não tem opções válidas", async () => {
    const select = document.createElement("select");
    const placeholder = document.createElement("option");
    placeholder.value = "";
    select.append(placeholder);

    const field = createField({
      element: select,
      selector: "#sel",
      fieldType: "state",
    });
    mockGenerateWithConstraints.mockReturnValue("");

    const result = await resolveFieldValue(field, "https://example.com");
    expect(result.value).toBe("");
    expect(result.source).toBe("generator");
  });

  it("AI rule falha e cai no gerador padrão", async () => {
    const field = createField({ fieldType: "text" });
    const aiGenerateFn = vi.fn().mockRejectedValue(new Error("AI error"));
    mockGetRulesForUrl.mockResolvedValue([
      createRule({ fieldType: "text", generator: "ai" }),
    ]);
    mockGenerateWithConstraints.mockReturnValue("fallback");

    const result = await resolveFieldValue(
      field,
      "https://example.com",
      aiGenerateFn,
    );

    expect(result.source).toBe("generator");
    expect(result.value).toBe("fallback");
  });

  it("usa contextualType state quando fieldType é select", async () => {
    const field = createField({
      fieldType: "select",
      contextualType: "state",
    });
    mockGenerateWithConstraints.mockReturnValue("SP");

    await resolveFieldValue(field, "https://example.com");
    expect(mockGenerateWithConstraints).toHaveBeenCalled();
  });

  it("AI último recurso retorna vazio, retorna valor vazio", async () => {
    const aiGenerateFn = vi.fn().mockResolvedValue("ai-resposta");
    const field = createField({ fieldType: "text" });
    mockGenerateWithConstraints.mockReturnValue("");
    mockAdaptGeneratedValue.mockReturnValue(""); // adapt returns empty

    const result = await resolveFieldValue(
      field,
      "https://example.com",
      aiGenerateFn,
    );

    expect(result.value).toBe("");
  });

  it("AI último recurso lança exceção, retorna valor vazio do gerador", async () => {
    const aiGenerateFn = vi.fn().mockRejectedValue(new Error("timeout"));
    const field = createField({ fieldType: "text" });
    mockGenerateWithConstraints.mockReturnValue("");

    const result = await resolveFieldValue(
      field,
      "https://example.com",
      aiGenerateFn,
    );

    expect(result.value).toBe("");
    expect(result.source).toBe("generator");
  });

  it("encontra regra pelo fieldSelector quando CSS selector corresponde ao elemento", async () => {
    // Arrange — element with id that matches the CSS selector
    const input = document.createElement("input");
    input.id = "css-match-field";
    const field = createField({
      element: input,
      selector: "#css-match-field",
      name: "unrelated-name",
      id: "css-match-field",
    });
    mockGetRulesForUrl.mockResolvedValue([
      createRule({
        fieldSelector: "#css-match-field",
        fieldName: "unrelated-name",
        fixedValue: "css-found",
      }),
    ]);

    // Act
    const result = await resolveFieldValue(field, "https://example.com");

    // Assert — rule matched via CSS selector (line 280)
    expect(result.value).toBe("css-found");
    expect(result.source).toBe("rule");
  });

  it("ignora regra que não corresponde ao selector nem ao fieldName", async () => {
    // Arrange — rule where neither CSS selector nor fieldName match the field
    const field = createField({
      name: "email",
      id: "email",
      selector: "#email",
    });
    mockGetRulesForUrl.mockResolvedValue([
      createRule({
        fieldSelector: "#never-exists",
        fieldName: "other-field-name",
        fixedValue: "should-not-be-used",
      }),
    ]);
    mockGenerateWithConstraints.mockReturnValue("generated-fallback");

    // Act
    const result = await resolveFieldValue(field, "https://example.com");

    // Assert — no rule matched, falls back to generator (line 289)
    expect(result.source).toBe("generator");
    expect(result.value).toBe("generated-fallback");
  });

  it("rejeita com timeout quando AI demora mais que AI_TIMEOUT_MS (fake timers)", async () => {
    // Arrange — use fake timers so we can advance past the AI timeout
    vi.useFakeTimers();
    const neverResolves = new Promise<string>(() => {});
    const aiGenerateFn = vi.fn().mockReturnValue(neverResolves);
    const field = createField({ fieldType: "text" });
    mockGenerateWithConstraints.mockReturnValue("fallback-after-timeout");

    // Act — start the resolution, advance time past the AI timeout
    const resultPromise = resolveFieldValue(
      field,
      "https://example.com",
      aiGenerateFn,
      true,
    );
    await vi.runAllTimersAsync();

    const result = await resultPromise;

    // Assert — AI timed out (line 63), fell back to generator
    expect(result.source).toBe("generator");
    expect(result.value).toBe("fallback-after-timeout");

    vi.useRealTimers();
  });

  it("passes generatorParams from rule to generate()", async () => {
    const field = createField({ fieldType: "cpf" });
    const params = { formatted: false };
    mockGetRulesForUrl.mockResolvedValue([
      createRule({
        fieldType: "cpf",
        generator: "cpf",
        generatorParams: params,
      }),
    ]);
    mockGenerateWithConstraints.mockImplementation((fn: () => string) => fn());
    mockGenerate.mockReturnValue("12345678901");

    await resolveFieldValue(field, "https://example.com");

    expect(mockGenerate).toHaveBeenCalledWith("cpf", params);
  });

  it("passes undefined generatorParams when rule has none", async () => {
    const field = createField({ fieldType: "cpf" });
    mockGetRulesForUrl.mockResolvedValue([
      createRule({ fieldType: "cpf", generator: "cpf" }),
    ]);
    mockGenerateWithConstraints.mockImplementation((fn: () => string) => fn());
    mockGenerate.mockReturnValue("111.111.111-11");

    await resolveFieldValue(field, "https://example.com");

    expect(mockGenerate).toHaveBeenCalledWith("cpf", undefined);
  });
});
