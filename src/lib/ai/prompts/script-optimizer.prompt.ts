/**
 * Script Optimizer Prompt
 *
 * Structured prompt for optimizing E2E test scripts via Chrome AI (Gemini Nano).
 * Takes a raw generated test script and optional page context, then returns
 * an improved version with better selectors, assertions, and structure.
 *
 * Consumed by `script-optimizer.ts` → `optimizeScript()`.
 * Uses low temperature for deterministic, safe code output.
 */

import type { StructuredPrompt } from "./prompt.interface";
import { renderPromptBase } from "./prompt-renderer";

// ── Input / Output types ──────────────────────────────────────────────────────

/** Input context for script optimization. */
export interface ScriptOptimizerInput {
  /** The raw generated test script to optimize */
  readonly script: string;
  /** E2E framework used (playwright, cypress, pest) */
  readonly framework: string;
  /** Page URL where the test was recorded */
  readonly pageUrl?: string;
  /** Simplified HTML structure of the page (form elements, labels, buttons) */
  readonly pageContext?: string;
  /** Page title for better test descriptions */
  readonly pageTitle?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_SCRIPT_CHARS = 8_000;
const MAX_PAGE_CONTEXT_CHARS = 4_000;

/** Low temperature for deterministic code output (0.0–1.0). */
export const OPTIMIZER_TEMPERATURE = 0.1;

// ── Prompt definition ─────────────────────────────────────────────────────────

export const scriptOptimizerPrompt: StructuredPrompt<
  ScriptOptimizerInput,
  string
> = {
  id: "script-optimizer",
  version: "1.0.0",

  role: "system",
  persona:
    "You are a senior QA automation engineer specialized in E2E test scripts. " +
    "You write clean, maintainable, and resilient test code following industry best practices.",

  task:
    "Given a raw auto-generated E2E test script and optional page context, " +
    "refactor and optimize the script. Return ONLY the improved script code — " +
    "no explanations, no markdown fences, no comments about what you changed.",

  rules: [
    "Return ONLY the optimized script code. No markdown code blocks (```), no explanations before or after.",
    "Preserve the original test framework and language — do NOT switch frameworks.",
    "Prefer resilient selectors: data-testid > aria-label > role > name > id > CSS class. Replace fragile selectors when page context is available.",
    "Group related actions logically (e.g. fill personal data, fill address, submit).",
    "Add meaningful comments in English for each logical group of actions.",
    "Remove redundant waits or assertions that add no value.",
    "Ensure proper assertion coverage: verify form submission success, URL changes, or visible confirmation messages.",
    "Use the page context (when provided) to improve selector accuracy and add better labels.",
    "Keep the test focused and atomic — one test should verify one flow.",
    "Maintain proper error handling with timeouts for async operations.",
    "Use descriptive test names that explain what the test validates.",
    "For Playwright: prefer `getByRole`, `getByLabel`, `getByTestId` over raw CSS selectors.",
    "For Cypress: prefer `cy.findByRole`, `cy.findByLabelText`, or `cy.get('[data-testid=...]')` over fragile selectors.",
    "For Pest/Laravel Dusk: prefer `->assertSee`, `->type`, `->press` with readable selectors.",
    "Do NOT add new test steps that were not in the original script. Only improve existing ones.",
    "Do NOT remove any functional test step — only improve how it is written.",
  ],

  outputSchema: undefined,

  examples: [
    {
      input: [
        "Framework: playwright",
        "Script:",
        'test("fill form", async ({ page }) => {',
        '  await page.goto("https://example.com/form");',
        "  await page.locator('#name').fill('João Silva');",
        "  await page.locator('#email').fill('joao@email.com');",
        "  await page.locator('#submit').click();",
        "});",
      ].join("\n"),
      output: [
        'test("should fill contact form and submit successfully", async ({ page }) => {',
        '  await page.goto("https://example.com/form");',
        "",
        "  // Fill contact information",
        '  await page.getByLabel("Nome").fill("João Silva");',
        '  await page.getByLabel("E-mail").fill("joao@email.com");',
        "",
        "  // Submit form",
        '  await page.getByRole("button", { name: "Enviar" }).click();',
        "",
        "  // Verify submission",
        "  await expect(page).toHaveURL(/sucesso|obrigado/i);",
        "});",
      ].join("\n"),
    },
  ],

  buildPrompt(input: ScriptOptimizerInput): string {
    const base = renderPromptBase(this);
    const sections: string[] = [];

    sections.push(`=== Framework ===\n${input.framework}`);

    if (input.pageUrl) {
      sections.push(`=== Page URL ===\n${input.pageUrl}`);
    }

    if (input.pageTitle) {
      sections.push(`=== Page Title ===\n${input.pageTitle}`);
    }

    if (input.pageContext?.trim()) {
      const ctx =
        input.pageContext.length > MAX_PAGE_CONTEXT_CHARS
          ? input.pageContext.slice(0, MAX_PAGE_CONTEXT_CHARS) + "…"
          : input.pageContext;
      sections.push(`=== Page Structure (simplified HTML) ===\n${ctx}`);
    }

    const script =
      input.script.length > MAX_SCRIPT_CHARS
        ? input.script.slice(0, MAX_SCRIPT_CHARS) + "\n// … (truncated)"
        : input.script;
    sections.push(`=== Script to Optimize ===\n${script}`);

    return `${base}\n\nOptimize this test script:\n\n${sections.join("\n\n")}`;
  },

  parseResponse(raw: string): string | null {
    let value = raw.trim();
    if (value.length === 0) return null;

    // Strip markdown code fences if the AI added them despite the rules
    value = value.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");

    return value.trim() || null;
  },
};
