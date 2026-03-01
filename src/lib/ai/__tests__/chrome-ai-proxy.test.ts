/**
 * @vitest-environment happy-dom
 * Tests for chrome-ai-proxy — the content script → background messaging bridge.
 * Mocks `chrome.runtime.sendMessage` to test all branches without an actual extension context.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FormField } from "@/types";
import type { FieldClassifierInput } from "@/lib/ai/prompts";
import type { ScriptOptimizerInput } from "@/lib/ai/prompts/script-optimizer.prompt";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSendMessage(returnValue: unknown) {
  return vi.fn().mockResolvedValue(returnValue);
}

function buildField(): FormField {
  const element = document.createElement("input");
  element.type = "text";
  return {
    element,
    selector: "#name",
    category: "personal",
    fieldType: "name",
    label: "Nome completo",
    name: "name",
    id: "name",
    placeholder: "",
    required: false,
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();

  // Provide a minimal chrome global
  Reflect.set(globalThis, "chrome", {
    runtime: {
      sendMessage: vi.fn(),
    },
  });
});

// ── isAvailableViaProxy ───────────────────────────────────────────────────────

describe("isAvailableViaProxy", () => {
  it("returns true when background responds with true", async () => {
    (globalThis as any).chrome.runtime.sendMessage = makeSendMessage(true);
    const { isAvailableViaProxy } = await import("@/lib/ai/chrome-ai-proxy");
    expect(await isAvailableViaProxy()).toBe(true);
  });

  it("returns false when background responds with false", async () => {
    (globalThis as any).chrome.runtime.sendMessage = makeSendMessage(false);
    const { isAvailableViaProxy } = await import("@/lib/ai/chrome-ai-proxy");
    expect(await isAvailableViaProxy()).toBe(false);
  });

  it("returns false when background responds with a non-boolean truthy value", async () => {
    (globalThis as any).chrome.runtime.sendMessage = makeSendMessage("yes");
    const { isAvailableViaProxy } = await import("@/lib/ai/chrome-ai-proxy");
    // The proxy checks `result === true` strictly
    expect(await isAvailableViaProxy()).toBe(false);
  });

  it("returns false and does not throw when sendMessage rejects", async () => {
    (globalThis as any).chrome.runtime.sendMessage = vi
      .fn()
      .mockRejectedValue(new Error("Extension context unavailable"));
    const { isAvailableViaProxy } = await import("@/lib/ai/chrome-ai-proxy");
    await expect(isAvailableViaProxy()).resolves.toBe(false);
  });

  it("sends the correct message type", async () => {
    const sendMessage = makeSendMessage(true);
    (globalThis as any).chrome.runtime.sendMessage = sendMessage;
    const { isAvailableViaProxy } = await import("@/lib/ai/chrome-ai-proxy");
    await isAvailableViaProxy();
    expect(sendMessage).toHaveBeenCalledWith({ type: "AI_CHECK_AVAILABLE" });
  });
});

// ── generateFieldValueViaProxy ────────────────────────────────────────────────

describe("generateFieldValueViaProxy", () => {
  it("returns the string value from the background", async () => {
    (globalThis as any).chrome.runtime.sendMessage =
      makeSendMessage("Marcus Pereira");
    const { generateFieldValueViaProxy } =
      await import("@/lib/ai/chrome-ai-proxy");
    const result = await generateFieldValueViaProxy(buildField());
    expect(result).toBe("Marcus Pereira");
  });

  it("returns empty string when background returns a non-string", async () => {
    (globalThis as any).chrome.runtime.sendMessage = makeSendMessage(42);
    const { generateFieldValueViaProxy } =
      await import("@/lib/ai/chrome-ai-proxy");
    const result = await generateFieldValueViaProxy(buildField());
    expect(result).toBe("");
  });

  it("returns empty string when background returns null", async () => {
    (globalThis as any).chrome.runtime.sendMessage = makeSendMessage(null);
    const { generateFieldValueViaProxy } =
      await import("@/lib/ai/chrome-ai-proxy");
    const result = await generateFieldValueViaProxy(buildField());
    expect(result).toBe("");
  });

  it("returns empty string and does not throw when sendMessage rejects", async () => {
    (globalThis as any).chrome.runtime.sendMessage = vi
      .fn()
      .mockRejectedValue(new Error("no connection"));
    const { generateFieldValueViaProxy } =
      await import("@/lib/ai/chrome-ai-proxy");
    await expect(generateFieldValueViaProxy(buildField())).resolves.toBe("");
  });

  it("sends the AI_GENERATE message type", async () => {
    const sendMessage = makeSendMessage("value");
    (globalThis as any).chrome.runtime.sendMessage = sendMessage;
    const { generateFieldValueViaProxy } =
      await import("@/lib/ai/chrome-ai-proxy");
    await generateFieldValueViaProxy(buildField());
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "AI_GENERATE" }),
    );
  });
});

// ── classifyFieldViaProxy ─────────────────────────────────────────────────────

describe("classifyFieldViaProxy", () => {
  const input: FieldClassifierInput = {
    elementHtml: "<input type='text' id='cpf' placeholder='000.000.000-00' />",
    signals: "cpf documento identificação",
  };

  it("returns the classifier output when background returns a valid result", async () => {
    const mockResult = { fieldType: "cpf", confidence: 0.95 };
    (globalThis as any).chrome.runtime.sendMessage =
      makeSendMessage(mockResult);
    const { classifyFieldViaProxy } = await import("@/lib/ai/chrome-ai-proxy");
    const result = await classifyFieldViaProxy(input);
    expect(result).toEqual(mockResult);
  });

  it("returns null when background returns null", async () => {
    (globalThis as any).chrome.runtime.sendMessage = makeSendMessage(null);
    const { classifyFieldViaProxy } = await import("@/lib/ai/chrome-ai-proxy");
    expect(await classifyFieldViaProxy(input)).toBeNull();
  });

  it("returns null when background returns a result without fieldType", async () => {
    (globalThis as any).chrome.runtime.sendMessage = makeSendMessage({
      confidence: 0.5,
    });
    const { classifyFieldViaProxy } = await import("@/lib/ai/chrome-ai-proxy");
    expect(await classifyFieldViaProxy(input)).toBeNull();
  });

  it("returns null and does not throw when sendMessage rejects", async () => {
    (globalThis as any).chrome.runtime.sendMessage = vi
      .fn()
      .mockRejectedValue(new Error("disconnected"));
    const { classifyFieldViaProxy } = await import("@/lib/ai/chrome-ai-proxy");
    await expect(classifyFieldViaProxy(input)).resolves.toBeNull();
  });

  it("sends the AI_CLASSIFY_FIELD message type with payload", async () => {
    const sendMessage = makeSendMessage({ fieldType: "email", confidence: 1 });
    (globalThis as any).chrome.runtime.sendMessage = sendMessage;
    const { classifyFieldViaProxy } = await import("@/lib/ai/chrome-ai-proxy");
    await classifyFieldViaProxy(input);
    expect(sendMessage).toHaveBeenCalledWith({
      type: "AI_CLASSIFY_FIELD",
      payload: input,
    });
  });
});

// ── optimizeScriptViaProxy ────────────────────────────────────────────────────

describe("optimizeScriptViaProxy", () => {
  const scriptInput: ScriptOptimizerInput = {
    script: "test('fill form', async () => { /* ... */ });",
    framework: "playwright",
  };

  it("returns the optimized script string when background returns a non-empty string", async () => {
    const optimized = "test('should fill form', async () => {});";
    (globalThis as any).chrome.runtime.sendMessage = makeSendMessage(optimized);
    const { optimizeScriptViaProxy } = await import("@/lib/ai/chrome-ai-proxy");
    expect(await optimizeScriptViaProxy(scriptInput)).toBe(optimized);
  });

  it("returns null when background returns an empty string", async () => {
    (globalThis as any).chrome.runtime.sendMessage = makeSendMessage("");
    const { optimizeScriptViaProxy } = await import("@/lib/ai/chrome-ai-proxy");
    expect(await optimizeScriptViaProxy(scriptInput)).toBeNull();
  });

  it("returns null when background returns null", async () => {
    (globalThis as any).chrome.runtime.sendMessage = makeSendMessage(null);
    const { optimizeScriptViaProxy } = await import("@/lib/ai/chrome-ai-proxy");
    expect(await optimizeScriptViaProxy(scriptInput)).toBeNull();
  });

  it("returns null when background returns a non-string value", async () => {
    (globalThis as any).chrome.runtime.sendMessage = makeSendMessage(42);
    const { optimizeScriptViaProxy } = await import("@/lib/ai/chrome-ai-proxy");
    expect(await optimizeScriptViaProxy(scriptInput)).toBeNull();
  });

  it("returns null and does not throw when sendMessage rejects", async () => {
    (globalThis as any).chrome.runtime.sendMessage = vi
      .fn()
      .mockRejectedValue(new Error("context gone"));
    const { optimizeScriptViaProxy } = await import("@/lib/ai/chrome-ai-proxy");
    await expect(optimizeScriptViaProxy(scriptInput)).resolves.toBeNull();
  });

  it("sends the AI_OPTIMIZE_SCRIPT message type with payload", async () => {
    const optimized = "test('x', async () => {});";
    const sendMessage = makeSendMessage(optimized);
    (globalThis as any).chrome.runtime.sendMessage = sendMessage;
    const { optimizeScriptViaProxy } = await import("@/lib/ai/chrome-ai-proxy");
    await optimizeScriptViaProxy(scriptInput);
    expect(sendMessage).toHaveBeenCalledWith({
      type: "AI_OPTIMIZE_SCRIPT",
      payload: scriptInput,
    });
  });
});
