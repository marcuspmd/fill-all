// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
  // clear any global LanguageModel
  // @ts-ignore
  delete (globalThis as any).LanguageModel;
});

describe("chrome-ai branches — session recycle / errors / parseFailure", () => {
  it("recycles existing session when tokens used >=85%", async () => {
    let created = 0;
    const makeSession = () => ({
      id: ++created,
      tokensRemaining: 100,
      maxTokens: 100,
      prompt: async () => "ok",
      destroy: () => {},
    });

    const fakeApi = {
      availability: async () => "available",
      create: async () => makeSession(),
    };
    // @ts-ignore
    globalThis.LanguageModel = fakeApi;

    const mod = await import("../chrome-ai");

    const s1 = await mod.getSession();
    // simulate heavy usage
    (s1 as any).tokensRemaining = 5;
    (s1 as any).maxTokens = 100;

    const s2 = await mod.getSession();
    // should have been recreated
    expect((s2 as any).id).toBeGreaterThan((s1 as any).id);
  });

  it("generateFieldValue returns empty string when prompt throws and destroys session", async () => {
    const fakeSession = {
      prompt: async () => {
        throw new Error("prompt fail");
      },
      destroy: vi.fn(),
    };

    let created = 0;
    const fakeApi = {
      availability: async () => "available",
      create: async () => {
        created++;
        return fakeSession;
      },
    };
    // @ts-ignore
    globalThis.LanguageModel = fakeApi;

    const mod = await import("../chrome-ai");

    const res = await mod.generateFieldValue({
      selector: "#f",
      fieldType: "text",
      element: { type: "text" },
    } as any);
    expect(res).toBe("");
    expect(fakeSession.destroy as any).toHaveBeenCalled();
  });

  it("generateFormContextValues returns null when parseResponse fails", async () => {
    // Mock prompts to force parseResponse => null
    vi.doMock("@/lib/ai/prompts", () => ({
      formContextGeneratorPrompt: {
        buildPrompt: () => "prompt",
        parseResponse: () => null,
      },
      fieldValueGeneratorPrompt: { buildPrompt: () => "p" },
      renderSystemPrompt: () => "sys",
      FORM_CONTEXT_MAX_FIELDS: 10,
    }));

    const fakeSession = { prompt: async () => "not-json", destroy: () => {} };
    const fakeApi = {
      availability: async () => "available",
      create: async () => fakeSession,
    };
    // @ts-ignore
    globalThis.LanguageModel = fakeApi;

    const mod = await import("../chrome-ai");

    const out = await mod.generateFormContextValues(
      [{ index: 0, label: "L", fieldType: "text" } as any],
      undefined,
      [new Blob(["x"], { type: "image/png" })],
    );
    expect(out).toBeNull();
  });
});
