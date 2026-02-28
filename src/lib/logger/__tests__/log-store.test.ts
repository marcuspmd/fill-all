import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

let addLogEntry: (typeof import("@/lib/logger/log-store"))["addLogEntry"];
let getLogEntries: (typeof import("@/lib/logger/log-store"))["getLogEntries"];
let clearLogEntries: (typeof import("@/lib/logger/log-store"))["clearLogEntries"];
let loadLogEntries: (typeof import("@/lib/logger/log-store"))["loadLogEntries"];
let onLogUpdate: (typeof import("@/lib/logger/log-store"))["onLogUpdate"];
let initLogStore: (typeof import("@/lib/logger/log-store"))["initLogStore"];

function makeEntry(
  overrides: Partial<import("@/lib/logger/log-store").LogEntry> = {},
): import("@/lib/logger/log-store").LogEntry {
  return {
    ts: new Date().toISOString(),
    level: "info",
    ns: "[FillAll/Test]",
    msg: "test message",
    ...overrides,
  };
}

function mockChrome() {
  vi.stubGlobal("chrome", {
    storage: {
      session: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
      },
      onChanged: {
        addListener: vi.fn(),
      },
    },
  });
}

describe("log-store", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.useFakeTimers();

    mockChrome();

    const store = await import("@/lib/logger/log-store");
    addLogEntry = store.addLogEntry;
    getLogEntries = store.getLogEntries;
    clearLogEntries = store.clearLogEntries;
    loadLogEntries = store.loadLogEntries;
    onLogUpdate = store.onLogUpdate;
    initLogStore = store.initLogStore;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── addLogEntry / getLogEntries ─────────────────────────────────────────

  describe("addLogEntry + getLogEntries", () => {
    it("stores entries in memory", () => {
      const entry = makeEntry();
      addLogEntry(entry);

      const entries = getLogEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual(entry);
    });

    it("stores multiple entries in order", () => {
      addLogEntry(makeEntry({ msg: "first" }));
      addLogEntry(makeEntry({ msg: "second" }));
      addLogEntry(makeEntry({ msg: "third" }));

      const entries = getLogEntries();
      expect(entries).toHaveLength(3);
      expect(entries[0].msg).toBe("first");
      expect(entries[2].msg).toBe("third");
    });

    it("evicts old entries when exceeding MAX_ENTRIES (1000)", () => {
      for (let i = 0; i < 1005; i++) {
        addLogEntry(makeEntry({ msg: `entry-${i}` }));
      }

      const entries = getLogEntries();
      expect(entries.length).toBeLessThanOrEqual(1000);
      // The first 5 should have been evicted
      expect(entries[0].msg).toBe("entry-5");
    });
  });

  // ── flush to storage ────────────────────────────────────────────────────

  describe("flush to storage", () => {
    it("schedules flush on addLogEntry", async () => {
      await initLogStore();
      addLogEntry(makeEntry({ msg: "will-flush" }));

      // Before flush
      expect(chrome.storage.session.set).not.toHaveBeenCalled();

      // Advance timer to trigger debounced flush
      await vi.advanceTimersByTimeAsync(600);

      expect(chrome.storage.session.set).toHaveBeenCalled();
    });

    it("batches multiple entries in a single flush", async () => {
      await initLogStore();

      addLogEntry(makeEntry({ msg: "batch-1" }));
      addLogEntry(makeEntry({ msg: "batch-2" }));
      addLogEntry(makeEntry({ msg: "batch-3" }));

      await vi.advanceTimersByTimeAsync(600);

      // Only 1 call to storage.set, not 3
      expect(chrome.storage.session.set).toHaveBeenCalledTimes(1);
    });

    it("merges with existing storage entries on flush", async () => {
      (
        chrome.storage.session.get as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        fill_all_log_entries: [makeEntry({ msg: "existing" })],
      });

      await initLogStore();

      addLogEntry(makeEntry({ msg: "new" }));
      await vi.advanceTimersByTimeAsync(600);

      const setCall = (chrome.storage.session.set as ReturnType<typeof vi.fn>)
        .mock.calls[0]?.[0];
      const allEntries = setCall?.fill_all_log_entries;
      expect(allEntries).toHaveLength(2);
      expect(allEntries[0].msg).toBe("existing");
      expect(allEntries[1].msg).toBe("new");
    });

    it("handles storage.session.set failure silently", async () => {
      await initLogStore();

      (
        chrome.storage.session.set as ReturnType<typeof vi.fn>
      ).mockRejectedValueOnce(new Error("quota exceeded"));

      addLogEntry(makeEntry({ msg: "no-crash" }));
      await vi.advanceTimersByTimeAsync(600);

      // Entries remain in local memory
      const entries = getLogEntries();
      expect(entries.some((e) => e.msg === "no-crash")).toBe(true);
    });
  });

  // ── initLogStore ────────────────────────────────────────────────────────

  describe("initLogStore", () => {
    it("loads existing entries from chrome.storage.session", async () => {
      (
        chrome.storage.session.get as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        fill_all_log_entries: [
          makeEntry({ msg: "persisted-1" }),
          makeEntry({ msg: "persisted-2" }),
        ],
      });

      await initLogStore();

      const entries = getLogEntries();
      expect(entries).toHaveLength(2);
      expect(entries[0].msg).toBe("persisted-1");
    });

    it("is idempotent — second call is a no-op", async () => {
      await initLogStore();
      await initLogStore();

      expect(chrome.storage.session.get).toHaveBeenCalledTimes(1);
    });

    it("subscribes to storage.onChanged for cross-context sync", async () => {
      await initLogStore();

      expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();
    });

    it("handles missing chrome.storage.session gracefully", async () => {
      vi.stubGlobal("chrome", { storage: {} });
      vi.resetModules();
      const store = await import("@/lib/logger/log-store");

      await expect(store.initLogStore()).resolves.not.toThrow();
    });

    it("handles storage.session.get failure gracefully", async () => {
      (
        chrome.storage.session.get as ReturnType<typeof vi.fn>
      ).mockRejectedValueOnce(new Error("access denied"));

      await expect(initLogStore()).resolves.not.toThrow();
    });
  });

  // ── clearLogEntries ─────────────────────────────────────────────────────

  describe("clearLogEntries", () => {
    it("clears all entries from memory", async () => {
      addLogEntry(makeEntry({ msg: "before-clear" }));
      expect(getLogEntries()).toHaveLength(1);

      await clearLogEntries();
      expect(getLogEntries()).toHaveLength(0);
    });

    it("clears entries from chrome.storage.session", async () => {
      await initLogStore();
      addLogEntry(makeEntry());
      await clearLogEntries();

      expect(chrome.storage.session.set).toHaveBeenCalledWith({
        fill_all_log_entries: [],
      });
    });

    it("cancels any pending flush timer", async () => {
      await initLogStore();
      addLogEntry(makeEntry({ msg: "pending" }));

      // Clear before flush has a chance
      await clearLogEntries();
      await vi.advanceTimersByTimeAsync(600);

      // Only the clear call should have written (empty array)
      const setCalls = (chrome.storage.session.set as ReturnType<typeof vi.fn>)
        .mock.calls;
      const lastCall = setCalls[setCalls.length - 1][0];
      expect(lastCall.fill_all_log_entries).toEqual([]);
    });
  });

  // ── loadLogEntries ──────────────────────────────────────────────────────

  describe("loadLogEntries", () => {
    it("refreshes local entries from storage", async () => {
      await initLogStore();

      (
        chrome.storage.session.get as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        fill_all_log_entries: [makeEntry({ msg: "loaded-fresh" })],
      });

      const entries = await loadLogEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].msg).toBe("loaded-fresh");
    });

    it("returns local entries when chrome is unavailable", async () => {
      vi.stubGlobal("chrome", undefined);
      vi.resetModules();
      const store = await import("@/lib/logger/log-store");
      store.addLogEntry(makeEntry({ msg: "local-only" }));

      const entries = await store.loadLogEntries();
      expect(entries.some((e) => e.msg === "local-only")).toBe(true);
    });

    it("handles storage.session.get failure without losing local entries", async () => {
      await initLogStore();
      addLogEntry(makeEntry({ msg: "safe" }));

      (
        chrome.storage.session.get as ReturnType<typeof vi.fn>
      ).mockRejectedValueOnce(new Error("fail"));

      const entries = await loadLogEntries();
      expect(entries.some((e) => e.msg === "safe")).toBe(true);
    });
  });

  // ── onLogUpdate ─────────────────────────────────────────────────────────

  describe("onLogUpdate", () => {
    it("notifies listener on addLogEntry", () => {
      const listener = vi.fn();
      const unsub = onLogUpdate(listener);

      addLogEntry(makeEntry({ msg: "trigger" }));
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0]).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: "trigger" })]),
      );

      unsub();
    });

    it("stops notifying after unsubscribe", () => {
      const listener = vi.fn();
      const unsub = onLogUpdate(listener);

      addLogEntry(makeEntry({ msg: "before" }));
      expect(listener).toHaveBeenCalledTimes(1);

      unsub();
      addLogEntry(makeEntry({ msg: "after" }));
      expect(listener).toHaveBeenCalledTimes(1); // not called again
    });

    it("handles listener errors silently", () => {
      const badListener = vi.fn(() => {
        throw new Error("listener crash");
      });
      onLogUpdate(badListener);

      // Should not throw
      expect(() => addLogEntry(makeEntry())).not.toThrow();
    });

    it("supports multiple concurrent listeners", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      onLogUpdate(listener1);
      onLogUpdate(listener2);

      addLogEntry(makeEntry());

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });
});
