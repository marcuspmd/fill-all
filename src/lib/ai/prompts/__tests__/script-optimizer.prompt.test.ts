import { describe, expect, it } from "vitest";
import {
  scriptOptimizerPrompt,
  OPTIMIZER_TEMPERATURE,
} from "../script-optimizer.prompt";
import type { ScriptOptimizerInput } from "../script-optimizer.prompt";

// ── Metadata ──────────────────────────────────────────────────────────────────

describe("scriptOptimizerPrompt metadata", () => {
  it("has expected id and version", () => {
    expect(scriptOptimizerPrompt.id).toBe("script-optimizer");
    expect(scriptOptimizerPrompt.version).toBe("1.0.0");
  });

  it("has role system", () => {
    expect(scriptOptimizerPrompt.role).toBe("system");
  });

  it("has persona about QA automation", () => {
    expect(scriptOptimizerPrompt.persona).toContain("QA automation");
  });

  it("has at least one rule", () => {
    expect(scriptOptimizerPrompt.rules.length).toBeGreaterThan(0);
  });

  it("has at least one example with input/output", () => {
    const examples = scriptOptimizerPrompt.examples;
    expect(examples).toBeDefined();
    expect(examples!.length).toBeGreaterThan(0);
    const first = examples![0];
    expect(first.input).toBeTruthy();
    expect(first.output).toBeTruthy();
  });

  it("has undefined outputSchema (plain-text response)", () => {
    expect(scriptOptimizerPrompt.outputSchema).toBeUndefined();
  });

  it("OPTIMIZER_TEMPERATURE is a deterministic low value (≤ 0.5)", () => {
    expect(typeof OPTIMIZER_TEMPERATURE).toBe("number");
    expect(OPTIMIZER_TEMPERATURE).toBeGreaterThanOrEqual(0);
    expect(OPTIMIZER_TEMPERATURE).toBeLessThanOrEqual(0.5);
  });

  it("OPTIMIZER_TEMPERATURE is exactly 0.1", () => {
    expect(OPTIMIZER_TEMPERATURE).toBe(0.1);
  });
});

// ── buildPrompt ───────────────────────────────────────────────────────────────

describe("scriptOptimizerPrompt.buildPrompt", () => {
  const baseInput: ScriptOptimizerInput = {
    script: "test('fill form', async () => { /* ... */ });",
    framework: "playwright",
  };

  it("includes the framework in the output", () => {
    const result = scriptOptimizerPrompt.buildPrompt(baseInput);
    expect(result).toContain("playwright");
  });

  it("includes the script content in the output", () => {
    const result = scriptOptimizerPrompt.buildPrompt(baseInput);
    expect(result).toContain("fill form");
  });

  it("includes pageUrl when provided", () => {
    const input: ScriptOptimizerInput = {
      ...baseInput,
      pageUrl: "https://example.com/form",
    };
    const result = scriptOptimizerPrompt.buildPrompt(input);
    expect(result).toContain("https://example.com/form");
  });

  it("omits Page URL section when not provided", () => {
    const result = scriptOptimizerPrompt.buildPrompt(baseInput);
    expect(result).not.toContain("=== Page URL ===");
  });

  it("includes pageTitle when provided", () => {
    const input: ScriptOptimizerInput = {
      ...baseInput,
      pageTitle: "Checkout Form",
    };
    const result = scriptOptimizerPrompt.buildPrompt(input);
    expect(result).toContain("Checkout Form");
  });

  it("omits Page Title section when not provided", () => {
    const result = scriptOptimizerPrompt.buildPrompt(baseInput);
    expect(result).not.toContain("=== Page Title ===");
  });

  it("includes pageContext when provided", () => {
    const input: ScriptOptimizerInput = {
      ...baseInput,
      pageContext: "<form><input id='name' /></form>",
    };
    const result = scriptOptimizerPrompt.buildPrompt(input);
    expect(result).toContain("<form>");
  });

  it("omits Page Structure section when pageContext is empty", () => {
    const input: ScriptOptimizerInput = { ...baseInput, pageContext: "   " };
    const result = scriptOptimizerPrompt.buildPrompt(input);
    expect(result).not.toContain("=== Page Structure");
  });

  it("truncates long scripts with ellipsis marker", () => {
    const longScript = "x".repeat(9000);
    const input: ScriptOptimizerInput = { ...baseInput, script: longScript };
    const result = scriptOptimizerPrompt.buildPrompt(input);
    expect(result).toContain("// … (truncated)");
  });

  it("does not truncate short scripts", () => {
    const shortScript = "test('x', () => {});";
    const input: ScriptOptimizerInput = { ...baseInput, script: shortScript };
    const result = scriptOptimizerPrompt.buildPrompt(input);
    expect(result).not.toContain("truncated");
  });

  it("truncates long pageContext with ellipsis", () => {
    const longCtx = "<div>" + "a".repeat(5000) + "</div>";
    const input: ScriptOptimizerInput = {
      ...baseInput,
      pageContext: longCtx,
    };
    const result = scriptOptimizerPrompt.buildPrompt(input);
    expect(result).toContain("…");
  });
});

// ── parseResponse ─────────────────────────────────────────────────────────────

describe("scriptOptimizerPrompt.parseResponse", () => {
  it("returns trimmed script for plain response", () => {
    const raw = "  test('form', async () => {});\n";
    expect(scriptOptimizerPrompt.parseResponse(raw)).toBe(
      "test('form', async () => {});",
    );
  });

  it("strips leading markdown code fence", () => {
    const raw = "```typescript\ntest('x', () => {});\n```";
    const result = scriptOptimizerPrompt.parseResponse(raw);
    expect(result).toBe("test('x', () => {});");
  });

  it("strips generic code fence", () => {
    const raw = "```\nconst x = 1;\n```";
    const result = scriptOptimizerPrompt.parseResponse(raw);
    expect(result).toBe("const x = 1;");
  });

  it("returns null for empty string", () => {
    expect(scriptOptimizerPrompt.parseResponse("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(scriptOptimizerPrompt.parseResponse("   \n  ")).toBeNull();
  });

  it("returns null when content after fence stripping is empty", () => {
    expect(scriptOptimizerPrompt.parseResponse("```\n```")).toBeNull();
  });
});
