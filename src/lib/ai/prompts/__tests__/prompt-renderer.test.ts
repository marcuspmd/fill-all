import { describe, expect, it } from "vitest";
import {
  renderOutputSchema,
  renderPromptBase,
  renderSystemPrompt,
} from "../prompt-renderer";
import type { StructuredPrompt, PromptOutputField } from "../prompt.interface";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePrompt(
  overrides: Partial<StructuredPrompt<unknown, unknown>> = {},
): StructuredPrompt<unknown, unknown> {
  return {
    id: "test-prompt",
    version: "1.0.0",
    role: "system",
    persona: "You are a test assistant.",
    task: "Do something useful.",
    rules: ["Rule 1", "Rule 2"],
    outputSchema: undefined,
    examples: [],
    buildPrompt: () => "",
    parseResponse: () => null,
    ...overrides,
  };
}

// ── renderOutputSchema ────────────────────────────────────────────────────────

describe("renderOutputSchema", () => {
  it("renders string fields", () => {
    const fields: readonly PromptOutputField[] = [
      { name: "fieldType", type: "string", description: "semantic type" },
    ];
    expect(renderOutputSchema(fields)).toBe('{"fieldType": <string>}');
  });

  it("renders number fields without range", () => {
    const fields: readonly PromptOutputField[] = [
      { name: "score", type: "number", description: "score value" },
    ];
    expect(renderOutputSchema(fields)).toBe('{"score": <number>}');
  });

  it("renders number fields with range", () => {
    const fields: readonly PromptOutputField[] = [
      {
        name: "confidence",
        type: "number",
        description: "0.0–1.0",
        range: { min: 0, max: 1 },
      },
    ];
    expect(renderOutputSchema(fields)).toBe('{"confidence": <number: 0–1>}');
  });

  it("renders boolean fields", () => {
    const fields: readonly PromptOutputField[] = [
      { name: "valid", type: "boolean", description: "is valid" },
    ];
    expect(renderOutputSchema(fields)).toBe('{"valid": <boolean>}');
  });

  it("renders multiple fields separated by commas", () => {
    const fields: readonly PromptOutputField[] = [
      { name: "fieldType", type: "string", description: "semantic type" },
      {
        name: "confidence",
        type: "number",
        description: "0.0–1.0",
        range: { min: 0, max: 1 },
      },
      { name: "generatorType", type: "string", description: "generator" },
    ];
    const result = renderOutputSchema(fields);
    expect(result).toBe(
      '{"fieldType": <string>, "confidence": <number: 0–1>, "generatorType": <string>}',
    );
  });

  it("renders empty fields array as empty object", () => {
    expect(renderOutputSchema([])).toBe("{}");
  });
});

// ── renderPromptBase ──────────────────────────────────────────────────────────

describe("renderPromptBase", () => {
  it("includes persona and task", () => {
    const prompt = makePrompt({ rules: [], examples: [] });
    const result = renderPromptBase(prompt);
    expect(result).toContain("You are a test assistant.");
    expect(result).toContain("Do something useful.");
  });

  it("renders rules as numbered list", () => {
    const prompt = makePrompt({
      rules: ["First rule", "Second rule"],
      examples: [],
    });
    const result = renderPromptBase(prompt);
    expect(result).toContain("1. First rule");
    expect(result).toContain("2. Second rule");
  });

  it("renders output schema when provided", () => {
    const prompt = makePrompt({
      rules: [],
      examples: [],
      outputSchema: [
        { name: "type", type: "string", description: "type" },
        {
          name: "confidence",
          type: "number",
          description: "score",
          range: { min: 0, max: 1 },
        },
      ],
    });
    const result = renderPromptBase(prompt);
    expect(result).toContain(
      "Respond ONLY with a JSON object in this exact format",
    );
    expect(result).toContain('"type": <string>');
    expect(result).toContain('"confidence": <number: 0–1>');
  });

  it("omits output schema section when outputSchema is undefined", () => {
    const prompt = makePrompt({
      rules: [],
      examples: [],
      outputSchema: undefined,
    });
    const result = renderPromptBase(prompt);
    expect(result).not.toContain("Respond ONLY with a JSON object");
  });

  it("omits output schema section when outputSchema is empty", () => {
    const prompt = makePrompt({ rules: [], examples: [], outputSchema: [] });
    const result = renderPromptBase(prompt);
    expect(result).not.toContain("Respond ONLY with a JSON object");
  });

  it("renders examples as input/output pairs", () => {
    const prompt = makePrompt({
      rules: [],
      examples: [
        { input: "input text", output: "output text" },
        { input: "second input", output: "second output" },
      ],
    });
    const result = renderPromptBase(prompt);
    expect(result).toContain("Input: input text");
    expect(result).toContain("Output: output text");
    expect(result).toContain("Input: second input");
    expect(result).toContain("Output: second output");
    expect(result).toContain("Examples:");
  });

  it("omits examples section when examples is undefined", () => {
    const prompt = makePrompt({ rules: [], examples: undefined });
    const result = renderPromptBase(prompt);
    expect(result).not.toContain("Examples:");
  });

  it("omits examples section when examples is empty", () => {
    const prompt = makePrompt({ rules: [], examples: [] });
    const result = renderPromptBase(prompt);
    expect(result).not.toContain("Examples:");
  });

  it("omits rules section when rules is empty", () => {
    const prompt = makePrompt({ rules: [], examples: [] });
    const result = renderPromptBase(prompt);
    expect(result).not.toContain("Rules:");
  });

  it("joins sections with double newlines", () => {
    const prompt = makePrompt({
      rules: ["Rule 1"],
      examples: [{ input: "i", output: "o" }],
    });
    const result = renderPromptBase(prompt);
    // Sections are joined with '\n\n'
    expect(result).toContain("\n\n");
  });
});

// ── renderSystemPrompt ────────────────────────────────────────────────────────

describe("renderSystemPrompt", () => {
  it("returns the same content as renderPromptBase", () => {
    const prompt = makePrompt({
      rules: ["A rule"],
      examples: [{ input: "in", output: "out" }],
    });
    expect(renderSystemPrompt(prompt)).toBe(renderPromptBase(prompt));
  });

  it("works with a full prompt with schema", () => {
    const prompt = makePrompt({
      rules: ["Do this"],
      examples: [],
      outputSchema: [{ name: "result", type: "string", description: "value" }],
    });
    const result = renderSystemPrompt(prompt);
    expect(result).toContain("You are a test assistant.");
    expect(result).toContain("Do this");
    expect(result).toContain('"result": <string>');
  });
});
