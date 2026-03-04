// @vitest-environment happy-dom
import { vi, describe, it, expect, beforeEach } from "vitest";
import type { SavedForm, ExtensionMessage } from "@/types";

import { handleContentMessage } from "@/content/content-script";
import { applyTemplate } from "@/lib/form/form-filler";
import { getIgnoredFieldsForUrl } from "@/lib/storage/storage";

vi.mock("@/lib/form/form-filler", () => ({
  applyTemplate: vi.fn(),
}));

vi.mock("@/lib/storage/storage", () => ({
  getIgnoredFieldsForUrl: vi.fn(),
  getSettings: vi.fn().mockResolvedValue({}),
}));

// other imports that might be referenced in handleContentMessage can remain unmocked

describe("handleContentMessage - LOAD_SAVED_FORM", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("errors when payload is invalid", async () => {
    // payload that fails parseSavedFormPayload inside handler
    const res = await handleContentMessage({
      type: "LOAD_SAVED_FORM",
      payload: null,
    } as any);
    expect(res).toEqual({ error: "Invalid payload for LOAD_SAVED_FORM" });
  });

  it("sanitizes ignored selectors and calls applyTemplate", async () => {
    const saved: SavedForm = {
      id: "f1",
      name: "Form",
      urlPattern: "*",
      fields: { "#a": "1", "#ignore": "X" },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    (getIgnoredFieldsForUrl as any).mockResolvedValue([
      { selector: "#ignore" },
    ]);
    (applyTemplate as any).mockResolvedValue({ filled: 1 });

    const msg: ExtensionMessage = {
      type: "LOAD_SAVED_FORM",
      payload: saved,
    } as any;
    const result = await handleContentMessage(msg);

    expect(applyTemplate).toHaveBeenCalledWith({
      ...saved,
      fields: { "#a": "1" },
    });
    expect(result).toEqual({ success: true, filled: 1 });
  });
});
