import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

// Dynamic imports since logger stores state in module-level variables
let createLogger: (typeof import("@/lib/logger"))["createLogger"];
let initLogger: (typeof import("@/lib/logger"))["initLogger"];
let configureLogger: (typeof import("@/lib/logger"))["configureLogger"];
let getLogEntries: (typeof import("@/lib/logger/log-store"))["getLogEntries"];
let addLogEntry: (typeof import("@/lib/logger/log-store"))["addLogEntry"];
let clearLogEntries: (typeof import("@/lib/logger/log-store"))["clearLogEntries"];
let loadLogEntries: (typeof import("@/lib/logger/log-store"))["loadLogEntries"];
let onLogUpdate: (typeof import("@/lib/logger/log-store"))["onLogUpdate"];

function mockChrome(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const mock = {
    storage: {
      local: {
        get: vi.fn().mockResolvedValue({}),
      },
      session: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
      },
      onChanged: {
        addListener: vi.fn(),
      },
    },
    ...overrides,
  };
  vi.stubGlobal("chrome", mock);
  return mock;
}

describe("logger", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.useFakeTimers();

    mockChrome();

    const logStore = await import("@/lib/logger/log-store");
    const logger = await import("@/lib/logger");

    createLogger = logger.createLogger;
    initLogger = logger.initLogger;
    configureLogger = logger.configureLogger;
    getLogEntries = logStore.getLogEntries;
    addLogEntry = logStore.addLogEntry;
    clearLogEntries = logStore.clearLogEntries;
    loadLogEntries = logStore.loadLogEntries;
    onLogUpdate = logStore.onLogUpdate;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── createLogger ──────────────────────────────────────────────────────────

  describe("createLogger", () => {
    it("creates a logger with all expected methods", async () => {
      await initLogger();
      const log = createLogger("Test");

      expect(typeof log.debug).toBe("function");
      expect(typeof log.info).toBe("function");
      expect(typeof log.warn).toBe("function");
      expect(typeof log.error).toBe("function");
      expect(typeof log.group).toBe("function");
      expect(typeof log.groupCollapsed).toBe("function");
      expect(typeof log.groupEnd).toBe("function");
    });

    it("warn/error always emit regardless of enabled state", async () => {
      await initLogger();
      configureLogger({ enabled: false, level: "error" });

      const log = createLogger("WarnTest");
      log.warn("warning message");
      log.error("error message");

      const entries = getLogEntries();
      expect(entries.length).toBe(2);
      expect(entries[0].level).toBe("warn");
      expect(entries[1].level).toBe("error");
    });

    it("debug/info are silenced when not enabled", async () => {
      await initLogger();
      configureLogger({ enabled: false, level: "warn" });

      const log = createLogger("Silent");
      log.debug("should not appear");
      log.info("should not appear either");

      const entries = getLogEntries();
      expect(entries.length).toBe(0);
    });

    it("debug/info emit when enabled with appropriate level", async () => {
      await initLogger();
      configureLogger({ enabled: true, level: "debug" });

      const log = createLogger("Verbose");
      log.debug("debug msg");
      log.info("info msg");

      const entries = getLogEntries();
      expect(entries.length).toBe(2);
      expect(entries[0].msg).toBe("debug msg");
      expect(entries[1].msg).toBe("info msg");
    });

    it("respects level filtering — info level hides debug", async () => {
      await initLogger();
      configureLogger({ enabled: true, level: "info" });

      const log = createLogger("LevelFilter");
      log.debug("hidden");
      log.info("visible");

      const entries = getLogEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].msg).toBe("visible");
    });

    it("formats namespace prefix in entries", async () => {
      await initLogger();
      configureLogger({ enabled: true, level: "debug" });

      const log = createLogger("MyModule");
      log.info("hello");

      const entries = getLogEntries();
      expect(entries[0].ns).toBe("[FillAll/MyModule]");
    });

    it("formats Error objects in log args", async () => {
      await initLogger();
      configureLogger({ enabled: true, level: "debug" });

      const log = createLogger("ErrFmt");
      log.error("failed:", new Error("boom"));

      const entries = getLogEntries();
      expect(entries[0].msg).toContain("boom");
    });

    it("formats objects as JSON in log args", async () => {
      await initLogger();
      configureLogger({ enabled: true, level: "debug" });

      const log = createLogger("ObjFmt");
      log.info("data:", { key: "value" });

      const entries = getLogEntries();
      expect(entries[0].msg).toContain('"key":"value"');
    });

    it("handles non-JSON-serializable objects gracefully", async () => {
      await initLogger();
      configureLogger({ enabled: true, level: "debug" });

      const log = createLogger("Circular");
      const obj: Record<string, unknown> = {};
      obj.self = obj; // circular reference
      log.info("circ:", obj);

      const entries = getLogEntries();
      // Should not throw, and fallback to String(obj)
      expect(entries[0].msg).toContain("circ:");
    });

    it("group/groupCollapsed emit as debug level", async () => {
      await initLogger();
      configureLogger({ enabled: true, level: "debug" });

      const log = createLogger("Group");
      log.group("section");
      log.groupCollapsed("collapsed");

      const entries = getLogEntries();
      expect(entries.length).toBe(2);
      expect(entries[0].level).toBe("debug");
      expect(entries[0].ns).toContain("section");
    });

    it("groupEnd is a no-op", async () => {
      await initLogger();
      const log = createLogger("Noop");

      // Should not throw
      expect(() => log.groupEnd()).not.toThrow();
    });
  });

  // ── initLogger ──────────────────────────────────────────────────────────

  describe("initLogger", () => {
    it("reads settings from chrome.storage.local", async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        fill_all_settings: { debugLog: true, logLevel: "debug" },
      });

      await initLogger();
      const log = createLogger("Init");
      log.debug("should appear after init");

      const entries = getLogEntries();
      expect(entries.some((e) => e.msg === "should appear after init")).toBe(
        true,
      );
    });

    it("defaults to disabled when no settings in storage", async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue(
        {},
      );

      await initLogger();
      const log = createLogger("NoSettings");
      log.debug("hidden");

      const entries = getLogEntries();
      expect(entries.length).toBe(0);
    });

    it("works when chrome is undefined", async () => {
      vi.stubGlobal("chrome", undefined);

      // Need to re-import since chrome state is checked at import time
      vi.resetModules();
      const logger = await import("@/lib/logger");

      await logger.initLogger();
      const log = logger.createLogger("NoBrowser");
      log.warn("should still work");

      // Warn always emits
      const logStore = await import("@/lib/logger/log-store");
      const entries = logStore.getLogEntries();
      expect(entries.some((e) => e.msg === "should still work")).toBe(true);
    });

    it("flushes buffered messages after init", async () => {
      vi.resetModules();
      vi.stubGlobal("chrome", {
        storage: {
          local: {
            get: vi.fn().mockResolvedValue({
              fill_all_settings: { debugLog: true, logLevel: "debug" },
            }),
          },
          session: {
            get: vi.fn().mockResolvedValue({}),
            set: vi.fn().mockResolvedValue(undefined),
          },
          onChanged: { addListener: vi.fn() },
        },
      });

      const logger = await import("@/lib/logger");
      const log = logger.createLogger("Buffered");
      // Emit BEFORE init — should be buffered
      log.warn("before-init");

      await logger.initLogger();

      const logStore = await import("@/lib/logger/log-store");
      const entries = logStore.getLogEntries();
      expect(entries.some((e) => e.msg === "before-init")).toBe(true);
    });

    it("registers onChanged listener for real-time config updates", async () => {
      await initLogger();

      expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();
    });

    it("handles storage.local.get failure gracefully", async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("storage error"),
      );

      // Should not throw
      await expect(initLogger()).resolves.not.toThrow();
    });
  });

  // ── configureLogger ───────────────────────────────────────────────────────

  describe("configureLogger", () => {
    it("enables debug logging at runtime", async () => {
      await initLogger();
      configureLogger({ enabled: true, level: "debug" });

      const log = createLogger("Dynamic");
      log.debug("now visible");

      const entries = getLogEntries();
      expect(entries.some((e) => e.msg === "now visible")).toBe(true);
    });

    it("allows partial config updates", async () => {
      await initLogger();
      configureLogger({ enabled: true, level: "debug" });

      const log = createLogger("Partial");
      log.debug("visible");

      // Disable only
      configureLogger({ enabled: false });
      log.debug("hidden now");

      const entries = getLogEntries();
      expect(entries.filter((e) => e.ns === "[FillAll/Partial]").length).toBe(
        1,
      );
    });
  });
});
