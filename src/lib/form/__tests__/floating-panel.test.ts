// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../form-filler", () => ({
  fillAllFields: vi.fn().mockResolvedValue([]),
  fillSingleField: vi.fn().mockResolvedValue(null),
  captureFormValues: vi.fn().mockReturnValue({}),
  applyTemplate: vi.fn().mockResolvedValue({ filled: 0 }),
}));

vi.mock("../form-detector", () => ({
  streamAllFields: vi.fn().mockReturnValue([]),
  detectAllFields: vi.fn().mockReturnValue({ fields: [] }),
}));

vi.mock("../dom-watcher", () => ({
  startWatching: vi.fn(),
  stopWatching: vi.fn(),
  isWatcherActive: vi.fn().mockReturnValue(false),
}));

vi.mock("@/lib/storage/storage", () => ({
  saveForm: vi.fn().mockResolvedValue(undefined),
  getSavedFormsForUrl: vi.fn().mockResolvedValue([]),
  deleteForm: vi.fn().mockResolvedValue(undefined),
  getIgnoredFieldsForUrl: vi.fn().mockResolvedValue([]),
  addIgnoredField: vi.fn().mockResolvedValue(undefined),
  removeIgnoredField: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./field-overlay", () => ({
  showDetectionBadge: vi.fn(),
  clearAllBadges: vi.fn(),
}));

vi.mock("@/lib/ui", () => ({
  escapeHtml: (s: string) => s,
  renderTypeBadge: () => "",
  renderMethodBadge: () => "",
  renderConfidenceBadge: () => "",
}));

vi.mock("@/lib/i18n", () => ({
  t: (key: string) => key,
}));

vi.mock("@/types", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/types")>();
  return { ...original };
});

// ── SUT ───────────────────────────────────────────────────────────────────────

import {
  createFloatingPanel,
  removeFloatingPanel,
  toggleFloatingPanel,
} from "../floating-panel";

const PANEL_ID = "fill-all-floating-panel";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("floating-panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
    document.body.style.paddingBottom = "";
    document.body.removeAttribute("data-fill-all-panel-offset");
  });

  // ── createFloatingPanel ────────────────────────────────────────────────────

  describe("createFloatingPanel", () => {
    it("injects panel element into DOM", () => {
      createFloatingPanel();

      expect(document.getElementById(PANEL_ID)).not.toBeNull();
    });

    it("does not create duplicate panels on repeated calls", () => {
      createFloatingPanel();
      createFloatingPanel();

      const panels = document.querySelectorAll(`#${PANEL_ID}`);
      expect(panels.length).toBe(1);
    });

    it("applies body padding offset after creation", () => {
      createFloatingPanel();

      const padding = document.body.style.paddingBottom;
      expect(padding).toBeTruthy();
    });

    it("panel contains toolbar and tab structure", () => {
      createFloatingPanel();

      const panel = document.getElementById(PANEL_ID)!;
      expect(panel.querySelector("#fa-toolbar")).not.toBeNull();
      expect(panel.querySelector(".fa-tab[data-tab='actions']")).not.toBeNull();
      expect(panel.querySelector(".fa-tab[data-tab='fields']")).not.toBeNull();
      expect(panel.querySelector(".fa-tab[data-tab='forms']")).not.toBeNull();
      expect(panel.querySelector(".fa-tab[data-tab='log']")).not.toBeNull();
    });

    it("panel contains action buttons", () => {
      createFloatingPanel();

      const panel = document.getElementById(PANEL_ID)!;
      expect(panel.querySelector("#fa-btn-fill")).not.toBeNull();
      expect(panel.querySelector("#fa-btn-close")).not.toBeNull();
      expect(panel.querySelector("#fa-btn-minimize")).not.toBeNull();
    });
  });

  // ── removeFloatingPanel ────────────────────────────────────────────────────

  describe("removeFloatingPanel", () => {
    it("removes panel from DOM", () => {
      createFloatingPanel();
      expect(document.getElementById(PANEL_ID)).not.toBeNull();

      removeFloatingPanel();

      expect(document.getElementById(PANEL_ID)).toBeNull();
    });

    it("restores body padding offset after removal", () => {
      createFloatingPanel();
      const paddingAfterCreate = document.body.style.paddingBottom;
      expect(paddingAfterCreate).toBeTruthy();

      removeFloatingPanel();

      // padding should be removed or back to 0
      expect(
        document.body.getAttribute("data-fill-all-panel-offset"),
      ).toBeNull();
    });

    it("is safe to call when panel does not exist", () => {
      expect(() => removeFloatingPanel()).not.toThrow();
    });
  });

  // ── toggleFloatingPanel ────────────────────────────────────────────────────

  describe("toggleFloatingPanel", () => {
    it("creates panel when it does not exist", () => {
      expect(document.getElementById(PANEL_ID)).toBeNull();

      toggleFloatingPanel();

      expect(document.getElementById(PANEL_ID)).not.toBeNull();
    });

    it("removes panel when it already exists", () => {
      createFloatingPanel();
      expect(document.getElementById(PANEL_ID)).not.toBeNull();

      toggleFloatingPanel();

      expect(document.getElementById(PANEL_ID)).toBeNull();
    });

    it("creates panel again after second toggle", () => {
      toggleFloatingPanel(); // create
      toggleFloatingPanel(); // remove
      toggleFloatingPanel(); // create again

      expect(document.getElementById(PANEL_ID)).not.toBeNull();
    });
  });
});
