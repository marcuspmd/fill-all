/**
 * Tests for script-optimizer.ts — the Chrome AI-powered E2E script optimizer.
 * Mocks the LanguageModel global API to test all branches without a real model.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ScriptOptimizerInput } from "@/lib/ai/prompts/script-optimizer.prompt";

// ── Helpers ───────────────────────────────────────────────────────────────────

const baseInput: ScriptOptimizerInput = {
  script: "test('fill form', async () => { /* ... */ });",
  framework: "playwright",
};

function buildMockSession(promptReturnValue: string | Error) {
  return {
    prompt: vi
      .fn()
      .mockImplementation((_promptText: string, _opts: unknown) => {
        if (promptReturnValue instanceof Error) {
          return Promise.reject(promptReturnValue);
        }
        return Promise.resolve(promptReturnValue);
      }),
    destroy: vi.fn(),
  };
}

function setupLanguageModel(
  availability: string,
  promptValue: string | Error = "test('improved', async () => {});",
) {
  const session = buildMockSession(promptValue);
  const create = vi.fn().mockResolvedValue(session);
  const availabilityFn = vi.fn().mockResolvedValue(availability);

  Reflect.set(globalThis as object, "LanguageModel", {
    availability: availabilityFn,
    create,
  });

  return { session, create, availabilityFn };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  Reflect.deleteProperty(globalThis as object, "LanguageModel");
});

// ── optimizeScript ────────────────────────────────────────────────────────────

describe("optimizeScript", () => {
  it("returns null when LanguageModel API is not available", async () => {
    const { optimizeScript } = await import("@/lib/ai/script-optimizer");
    expect(await optimizeScript(baseInput)).toBeNull();
  });

  it("returns null and sets session failure when availability is 'unavailable'", async () => {
    setupLanguageModel("unavailable");
    const { optimizeScript } = await import("@/lib/ai/script-optimizer");
    expect(await optimizeScript(baseInput)).toBeNull();
  });

  it("returns optimized script when AI session responds", async () => {
    const optimized = "test('should fill form correctly', async () => {});";
    setupLanguageModel("readily", optimized);
    const { optimizeScript } = await import("@/lib/ai/script-optimizer");
    expect(await optimizeScript(baseInput)).toBe(optimized);
  });

  it("returns optimized script when availability is downloadable", async () => {
    const optimized = "test('downloadable-path', async () => {});";
    setupLanguageModel("downloadable", optimized);
    const { optimizeScript } = await import("@/lib/ai/script-optimizer");
    expect(await optimizeScript(baseInput)).toBe(optimized);
  });

  it("returns null when session.prompt rejects with a generic error", async () => {
    setupLanguageModel("readily", new Error("model error"));
    const { optimizeScript } = await import("@/lib/ai/script-optimizer");
    expect(await optimizeScript(baseInput)).toBeNull();
  });

  it("returns null when session.prompt rejects with AbortError (timeout)", async () => {
    const abortError = Object.assign(new Error("aborted"), {
      name: "AbortError",
    });
    setupLanguageModel("readily", abortError);
    const { optimizeScript } = await import("@/lib/ai/script-optimizer");
    expect(await optimizeScript(baseInput)).toBeNull();
  });

  it("returns null when parseResponse returns null (empty AI response)", async () => {
    setupLanguageModel("readily", "   ");
    const { optimizeScript } = await import("@/lib/ai/script-optimizer");
    expect(await optimizeScript(baseInput)).toBeNull();
  });

  it("strips markdown code fence from AI response", async () => {
    const withFence = "```typescript\ntest('better', async () => {});\n```";
    setupLanguageModel("readily", withFence);
    const { optimizeScript } = await import("@/lib/ai/script-optimizer");
    const result = await optimizeScript(baseInput);
    expect(result).toBe("test('better', async () => {});");
  });

  it("returns null when LanguageModel.create throws", async () => {
    Reflect.set(globalThis as object, "LanguageModel", {
      availability: vi.fn().mockResolvedValue("readily"),
      create: vi.fn().mockRejectedValue(new Error("create failed")),
    });
    const { optimizeScript } = await import("@/lib/ai/script-optimizer");
    expect(await optimizeScript(baseInput)).toBeNull();
  });
});

// ── destroyOptimizerSession ───────────────────────────────────────────────────

describe("destroyOptimizerSession", () => {
  it("can be called without an active session without throwing", async () => {
    const { destroyOptimizerSession } =
      await import("@/lib/ai/script-optimizer");
    expect(() => destroyOptimizerSession()).not.toThrow();
  });

  it("destroys the session after it has been created", async () => {
    const { session } = setupLanguageModel("readily", "test('x', () => {});");
    const mod = await import("@/lib/ai/script-optimizer");
    await mod.optimizeScript(baseInput);

    mod.destroyOptimizerSession();

    expect(session.destroy).toHaveBeenCalledOnce();
  });
});

// ── Session reuse ─────────────────────────────────────────────────────────────

describe("session reuse", () => {
  it("reuses the same session for multiple calls", async () => {
    const { create } = setupLanguageModel(
      "readily",
      "test('reused', async () => {});",
    );
    const { optimizeScript } = await import("@/lib/ai/script-optimizer");

    await optimizeScript(baseInput);
    await optimizeScript(baseInput);

    expect(create).toHaveBeenCalledOnce();
  });
});
