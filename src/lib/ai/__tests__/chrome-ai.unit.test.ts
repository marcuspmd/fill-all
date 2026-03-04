// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
  // clear any global LanguageModel
  // @ts-ignore
  delete (globalThis as any).LanguageModel;
});

describe("chrome-ai integration (unit) — availability/session/generate flows", () => {
  it("isAvailable returns false when API missing", async () => {
    const mod = await import("../chrome-ai");
    const ok = await mod.isAvailable();
    expect(ok).toBe(false);
  });

  it("getSession returns null when availability is unavailable", async () => {
    const fakeApi = {
      availability: async () => "unavailable",
      create: async () => ({}),
    };
    // @ts-ignore
    globalThis.LanguageModel = fakeApi;
    const mod = await import("../chrome-ai");
    const s = await mod.getSession();
    expect(s).toBeNull();
  });

  it("generateFieldValueFromInput returns trimmed prompt response", async () => {
    const fakeSession = {
      prompt: async () => "  hello world  ",
      destroy: () => {},
    };
    const fakeApi = {
      availability: async () => "available",
      create: async () => fakeSession,
    };
    // @ts-ignore
    globalThis.LanguageModel = fakeApi;

    const mod = await import("../chrome-ai");

    const res = await mod.generateFieldValueFromInput({
      label: "L",
      name: "n",
      fieldType: "text",
    } as any);
    expect(res).toBe("hello world");
  });

  it("generateFormContextValues returns null when fields empty", async () => {
    const mod = await import("../chrome-ai");
    const res = await mod.generateFormContextValues([] as any);
    expect(res).toBeNull();
  });
});
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
  // clear any global LanguageModel
  // @ts-ignore
  delete (globalThis as any).LanguageModel;
});

describe("chrome-ai integration (unit) — availability/session/generate flows", () => {
  it("isAvailable returns false when API missing", async () => {
    const mod = await import("../chrome-ai");
    const ok = await mod.isAvailable();
    expect(ok).toBe(false);
  });

  it("getSession returns null when availability is unavailable", async () => {
    const fakeApi = {
      availability: async () => "unavailable",
      create: async () => ({}),
    };
    // @ts-ignore
    globalThis.LanguageModel = fakeApi;
    const mod = await import("../chrome-ai");
    const s = await mod.getSession();
    expect(s).toBeNull();
  });

  it("generateFieldValueFromInput returns trimmed prompt response", async () => {
    const fakeSession = {
      prompt: async () => "  hello world  ",
      destroy: () => {},
    };
    const fakeApi = {
      availability: async () => "available",
      create: async () => fakeSession,
    };
    // @ts-ignore
    globalThis.LanguageModel = fakeApi;

    const mod = await import("../chrome-ai");

    const res = await mod.generateFieldValueFromInput({
      label: "L",
      name: "n",
      fieldType: "text",
    } as any);
    expect(res).toBe("hello world");
  });

  it("generateFormContextValues returns null when fields empty", async () => {
    const mod = await import("../chrome-ai");
    const res = await mod.generateFormContextValues([] as any);
    expect(res).toBeNull();
  });
});
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
  // clear any global LanguageModel
  // @ts-ignore
  delete (globalThis as any).LanguageModel;
});

describe("chrome-ai integration (unit) — availability/session/generate flows", () => {
  it("isAvailable returns false when API missing", async () => {
    const mod = await import("../chrome-ai");
    const ok = await mod.isAvailable();
    expect(ok).toBe(false);
  });

  it("getSession returns null when availability is unavailable", async () => {
    const fakeApi = {
      availability: async () => "unavailable",
      create: async () => ({}),
    };
    // @ts-ignore
    globalThis.LanguageModel = fakeApi;
    const mod = await import("../chrome-ai");
    const s = await mod.getSession();
    expect(s).toBeNull();
  });

  it("generateFieldValueFromInput returns trimmed prompt response", async () => {
    const fakeSession = {
      prompt: async () => "  hello world  ",
      destroy: () => {},
    };
    const fakeApi = {
      availability: async () => "available",
      create: async () => fakeSession,
    };
    // @ts-ignore
    globalThis.LanguageModel = fakeApi;

    const mod = await import("../chrome-ai");

    const res = await mod.generateFieldValueFromInput({
      label: "L",
      name: "n",
      fieldType: "text",
    } as any);
    expect(res).toBe("hello world");
  });

  it("generateFormContextValues returns null when fields empty", async () => {
    const mod = await import("../chrome-ai");
    const res = await mod.generateFormContextValues([] as any);
    expect(res).toBeNull();
  });
});
