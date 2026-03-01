/** @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockLoadLogEntries = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockClearLogEntries = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined),
);
const mockOnLogUpdate = vi.hoisted(() => vi.fn().mockReturnValue(() => {}));

vi.mock("@/lib/logger/log-store", () => ({
  loadLogEntries: mockLoadLogEntries,
  clearLogEntries: mockClearLogEntries,
  onLogUpdate: mockOnLogUpdate,
}));

vi.mock("@/lib/ui/html-utils", () => ({
  escapeHtml: (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
}));

import { createLogViewer, getLogViewerStyles } from "../log-viewer";
import type { LogEntry } from "../index";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    ts: "2024-01-15T10:30:00.000Z",
    level: "info",
    ns: "[FillAll/Test]",
    msg: "test message",
    ...overrides,
  };
}

function makeEntries(): LogEntry[] {
  return [
    makeEntry({ level: "debug", msg: "debug msg", ns: "[FillAll/Debug]" }),
    makeEntry({ level: "info", msg: "info msg", ns: "[FillAll/Info]" }),
    makeEntry({ level: "warn", msg: "warn msg", ns: "[FillAll/Warn]" }),
    makeEntry({ level: "error", msg: "error msg", ns: "[FillAll/Error]" }),
  ];
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("log-viewer", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.clearAllMocks();
    mockOnLogUpdate.mockReturnValue(() => {});
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  // ── createLogViewer ───────────────────────────────────────────────────────

  describe("createLogViewer", () => {
    it("returns an object with refresh and dispose methods", () => {
      const viewer = createLogViewer({ container, variant: "panel" });

      expect(typeof viewer.refresh).toBe("function");
      expect(typeof viewer.dispose).toBe("function");
    });

    it("subscribes to log updates on creation", () => {
      createLogViewer({ container, variant: "panel" });

      expect(mockOnLogUpdate).toHaveBeenCalledTimes(1);
      expect(typeof mockOnLogUpdate.mock.calls[0][0]).toBe("function");
    });
  });

  // ── refresh ─────────────────────────────────────────────────────────────

  describe("refresh", () => {
    it("loads entries from the store and renders them", async () => {
      const entries = makeEntries();
      mockLoadLogEntries.mockResolvedValue(entries);

      const viewer = createLogViewer({ container, variant: "panel" });
      await viewer.refresh();

      expect(mockLoadLogEntries).toHaveBeenCalled();
      expect(container.querySelectorAll(".lv-entry").length).toBe(4);
    });

    it("displays empty state when no entries", async () => {
      mockLoadLogEntries.mockResolvedValue([]);

      const viewer = createLogViewer({ container, variant: "panel" });
      await viewer.refresh();

      expect(container.querySelector(".lv-empty")).not.toBeNull();
      expect(container.querySelector(".lv-empty")!.textContent).toContain(
        "Nenhum log encontrado",
      );
    });

    it("shows filter buttons for all levels", async () => {
      mockLoadLogEntries.mockResolvedValue(makeEntries());

      const viewer = createLogViewer({ container, variant: "panel" });
      await viewer.refresh();

      const buttons = container.querySelectorAll(".lv-filter-btn");
      expect(buttons.length).toBe(6); // all, debug, info, warn, error, audit
    });

    it("shows entry count", async () => {
      mockLoadLogEntries.mockResolvedValue(makeEntries());

      const viewer = createLogViewer({ container, variant: "panel" });
      await viewer.refresh();

      const count = container.querySelector(".lv-count");
      expect(count?.textContent).toBe("4/4");
    });

    it("renders entry level, namespace, and message", async () => {
      mockLoadLogEntries.mockResolvedValue([
        makeEntry({ level: "warn", msg: "disk full", ns: "[FillAll/Storage]" }),
      ]);

      const viewer = createLogViewer({ container, variant: "panel" });
      await viewer.refresh();

      const entry = container.querySelector(".lv-entry");
      expect(entry?.querySelector(".lv-level")?.textContent).toBe("WARN");
      expect(entry?.querySelector(".lv-ns")?.textContent).toBe(
        "[FillAll/Storage]",
      );
      expect(entry?.querySelector(".lv-msg")?.textContent).toBe("disk full");
    });

    it("applies CSS class based on entry level", async () => {
      mockLoadLogEntries.mockResolvedValue([makeEntry({ level: "error" })]);

      const viewer = createLogViewer({ container, variant: "panel" });
      await viewer.refresh();

      const entry = container.querySelector(".lv-entry");
      expect(entry?.classList.contains("lv-error")).toBe(true);
    });
  });

  // ── Level filtering ─────────────────────────────────────────────────────

  describe("level filtering", () => {
    it("filters entries by level when a filter button is clicked", async () => {
      mockLoadLogEntries.mockResolvedValue(makeEntries());

      const viewer = createLogViewer({ container, variant: "panel" });
      await viewer.refresh();

      // Click the "error" filter button
      const errorBtn = container.querySelector(
        '.lv-filter-btn[data-level="error"]',
      ) as HTMLButtonElement;
      errorBtn.click();

      const entries = container.querySelectorAll(".lv-entry");
      expect(entries.length).toBe(1);
      expect(entries[0].querySelector(".lv-msg")?.textContent).toBe(
        "error msg",
      );
    });

    it("shows all entries when 'all' filter is clicked", async () => {
      mockLoadLogEntries.mockResolvedValue(makeEntries());

      const viewer = createLogViewer({ container, variant: "panel" });
      await viewer.refresh();

      // First filter to error only
      const errorBtn = container.querySelector(
        '.lv-filter-btn[data-level="error"]',
      ) as HTMLButtonElement;
      errorBtn.click();
      expect(container.querySelectorAll(".lv-entry").length).toBe(1);

      // Then reset to all
      const allBtn = container.querySelector(
        '.lv-filter-btn[data-level="all"]',
      ) as HTMLButtonElement;
      allBtn.click();
      expect(container.querySelectorAll(".lv-entry").length).toBe(4);
    });

    it("marks the active filter button", async () => {
      mockLoadLogEntries.mockResolvedValue(makeEntries());

      const viewer = createLogViewer({ container, variant: "panel" });
      await viewer.refresh();

      const warnBtn = container.querySelector(
        '.lv-filter-btn[data-level="warn"]',
      ) as HTMLButtonElement;
      warnBtn.click();

      const activeBtn = container.querySelector<HTMLElement>(
        ".lv-filter-btn.active",
      );
      expect(activeBtn?.dataset.level).toBe("warn");
    });

    it("updates count when filtering", async () => {
      mockLoadLogEntries.mockResolvedValue(makeEntries());

      const viewer = createLogViewer({ container, variant: "panel" });
      await viewer.refresh();

      const warnBtn = container.querySelector(
        '.lv-filter-btn[data-level="warn"]',
      ) as HTMLButtonElement;
      warnBtn.click();

      const count = container.querySelector(".lv-count");
      expect(count?.textContent).toBe("1/4");
    });
  });

  // ── Search ──────────────────────────────────────────────────────────────

  describe("search", () => {
    it("filters entries by search query (message)", async () => {
      mockLoadLogEntries.mockResolvedValue(makeEntries());

      const viewer = createLogViewer({ container, variant: "panel" });
      await viewer.refresh();

      const searchInput =
        container.querySelector<HTMLInputElement>(".lv-search")!;
      searchInput.value = "warn";
      searchInput.dispatchEvent(new Event("input"));

      const entries = container.querySelectorAll(".lv-entry");
      expect(entries.length).toBe(1);
      expect(entries[0].querySelector(".lv-msg")?.textContent).toBe("warn msg");
    });

    it("filters entries by search query (namespace)", async () => {
      mockLoadLogEntries.mockResolvedValue(makeEntries());

      const viewer = createLogViewer({ container, variant: "panel" });
      await viewer.refresh();

      const searchInput =
        container.querySelector<HTMLInputElement>(".lv-search")!;
      searchInput.value = "Error";
      searchInput.dispatchEvent(new Event("input"));

      const entries = container.querySelectorAll(".lv-entry");
      // Should match both the namespace "[FillAll/Error]" and the msg "error msg"
      expect(entries.length).toBe(1);
    });

    it("search is case-insensitive", async () => {
      mockLoadLogEntries.mockResolvedValue([
        makeEntry({ msg: "UPPERCASE test" }),
      ]);

      const viewer = createLogViewer({ container, variant: "panel" });
      await viewer.refresh();

      const searchInput =
        container.querySelector<HTMLInputElement>(".lv-search")!;
      searchInput.value = "uppercase";
      searchInput.dispatchEvent(new Event("input"));

      expect(container.querySelectorAll(".lv-entry").length).toBe(1);
    });

    it("combines search + level filter", async () => {
      mockLoadLogEntries.mockResolvedValue([
        makeEntry({ level: "info", msg: "user logged in" }),
        makeEntry({ level: "warn", msg: "user session expired" }),
        makeEntry({ level: "info", msg: "page loaded" }),
      ]);

      const viewer = createLogViewer({ container, variant: "panel" });
      await viewer.refresh();

      // Filter to info level
      const infoBtn = container.querySelector(
        '.lv-filter-btn[data-level="info"]',
      ) as HTMLButtonElement;
      infoBtn.click();

      // Search for "user"
      const searchInput =
        container.querySelector<HTMLInputElement>(".lv-search")!;
      searchInput.value = "user";
      searchInput.dispatchEvent(new Event("input"));

      const entries = container.querySelectorAll(".lv-entry");
      expect(entries.length).toBe(1);
      expect(entries[0].querySelector(".lv-msg")?.textContent).toBe(
        "user logged in",
      );
    });
  });

  // ── Clear button ────────────────────────────────────────────────────────

  describe("clear button", () => {
    it("clears all entries when clicked", async () => {
      mockLoadLogEntries.mockResolvedValue(makeEntries());

      const viewer = createLogViewer({ container, variant: "panel" });
      await viewer.refresh();

      expect(container.querySelectorAll(".lv-entry").length).toBe(4);

      const clearBtn = container.querySelector(
        ".lv-clear-btn",
      ) as HTMLButtonElement;
      await clearBtn.click();

      // Wait for async clearLogEntries
      await vi.waitFor(() => {
        expect(mockClearLogEntries).toHaveBeenCalled();
      });
    });
  });

  // ── Real-time updates ───────────────────────────────────────────────────

  describe("real-time updates", () => {
    it("re-renders when onLogUpdate fires", async () => {
      let updateCallback: ((entries: LogEntry[]) => void) | null = null;
      mockOnLogUpdate.mockImplementation(
        (cb: (entries: LogEntry[]) => void) => {
          updateCallback = cb;
          return () => {};
        },
      );
      mockLoadLogEntries.mockResolvedValue([]);

      const viewer = createLogViewer({ container, variant: "panel" });
      await viewer.refresh();

      expect(container.querySelectorAll(".lv-entry").length).toBe(0);

      // Simulate real-time update
      updateCallback!(makeEntries());

      expect(container.querySelectorAll(".lv-entry").length).toBe(4);
    });
  });

  // ── dispose ─────────────────────────────────────────────────────────────

  describe("dispose", () => {
    it("calls the unsubscribe function from onLogUpdate", () => {
      const unsubFn = vi.fn();
      mockOnLogUpdate.mockReturnValue(unsubFn);

      const viewer = createLogViewer({ container, variant: "panel" });
      viewer.dispose();

      expect(unsubFn).toHaveBeenCalled();
    });

    it("is safe to call multiple times", () => {
      const unsubFn = vi.fn();
      mockOnLogUpdate.mockReturnValue(unsubFn);

      const viewer = createLogViewer({ container, variant: "panel" });
      viewer.dispose();
      viewer.dispose();

      // Only called once — second dispose is a no-op
      expect(unsubFn).toHaveBeenCalledTimes(1);
    });
  });

  // ── getLogViewerStyles ──────────────────────────────────────────────────

  describe("getLogViewerStyles", () => {
    it("returns CSS string for panel variant (dark)", () => {
      const css = getLogViewerStyles("panel");

      expect(typeof css).toBe("string");
      expect(css).toContain(".lv-toolbar");
      expect(css).toContain(".lv-entries");
      expect(css).toContain(".lv-entry");
      expect(css).toContain("#0f172a"); // dark background
    });

    it("returns CSS string for devtools variant (dark)", () => {
      const css = getLogViewerStyles("devtools");

      expect(typeof css).toBe("string");
      expect(css).toContain("#0f172a"); // dark background
    });

    it("returns CSS string for options variant (light)", () => {
      const css = getLogViewerStyles("options");

      expect(typeof css).toBe("string");
      expect(css).toContain("#ffffff"); // light background
    });
  });
});
