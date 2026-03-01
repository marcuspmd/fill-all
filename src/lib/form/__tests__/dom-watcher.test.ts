// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../form-detector", () => ({
  detectAllFields: vi
    .fn()
    .mockReturnValue({ fields: [], url: "http://localhost/" }),
  detectAllFieldsAsync: vi
    .fn()
    .mockResolvedValue({ fields: [], url: "http://localhost/" }),
}));

vi.mock("../form-filler", () => ({
  fillSingleField: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { detectAllFields, detectAllFieldsAsync } from "../form-detector";
import { fillSingleField } from "../form-filler";
import {
  getWatcherConfig,
  isWatcherActive,
  setFillingInProgress,
  startWatching,
  stopWatching,
} from "../dom-watcher";

const mockDetect = detectAllFields as ReturnType<typeof vi.fn>;
const mockDetectAsync = detectAllFieldsAsync as ReturnType<typeof vi.fn>;
const mockFillSingle = fillSingleField as ReturnType<typeof vi.fn>;

describe("dom-watcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Always stop the watcher to reset module-level state
    stopWatching();
    mockDetect.mockReturnValue({ fields: [], url: "http://localhost/" });
  });

  afterEach(() => {
    stopWatching();
  });

  describe("isWatcherActive", () => {
    it("returns false initially", () => {
      expect(isWatcherActive()).toBe(false);
    });

    it("returns true after startWatching", () => {
      startWatching();
      expect(isWatcherActive()).toBe(true);
    });

    it("returns false after stopWatching", () => {
      startWatching();
      stopWatching();
      expect(isWatcherActive()).toBe(false);
    });
  });

  describe("startWatching", () => {
    it("does not start twice when already watching", () => {
      startWatching();
      startWatching(); // second call should be a no-op

      expect(isWatcherActive()).toBe(true);
    });

    it("accepts an optional callback without throwing", () => {
      const cb = vi.fn();
      expect(() => startWatching(cb)).not.toThrow();
      expect(isWatcherActive()).toBe(true);
    });
  });

  describe("stopWatching", () => {
    it("does not throw when called while not watching", () => {
      expect(() => stopWatching()).not.toThrow();
    });

    it("resets the watcher state", () => {
      startWatching();
      stopWatching();

      expect(isWatcherActive()).toBe(false);
    });
  });

  describe("setFillingInProgress", () => {
    it("can be set to true without throwing", () => {
      expect(() => setFillingInProgress(true)).not.toThrow();
    });

    it("can be set to false without throwing", () => {
      expect(() => setFillingInProgress(false)).not.toThrow();
    });
  });

  describe("MutationObserver integration", () => {
    it("starts watching and observes document.body", () => {
      const observeSpy = vi.spyOn(MutationObserver.prototype, "observe");
      startWatching();
      expect(observeSpy).toHaveBeenCalledWith(
        document.body,
        expect.any(Object),
      );
      observeSpy.mockRestore();
    });

    it("disconnects observer when stopped", () => {
      const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");
      startWatching();
      stopWatching();
      expect(disconnectSpy).toHaveBeenCalled();
      disconnectSpy.mockRestore();
    });

    it("calls autoRefill when new fields appear and autoRefill=true", async () => {
      vi.useFakeTimers();

      const mockFields = [
        { selector: "#f1", fieldType: "email" },
        { selector: "#f2", fieldType: "cpf" },
      ];
      mockDetect
        .mockReturnValueOnce({ fields: [] }) // initial signature
        .mockReturnValue({ fields: mockFields }); // after mutation

      // detectAllFieldsAsync returns the new fields for refill
      mockDetectAsync.mockResolvedValue({ fields: mockFields });

      startWatching(undefined, true);

      // Trigger a mutation
      const p = document.createElement("p");
      document.body.appendChild(p);

      // Advance debounce
      await vi.runAllTimersAsync();

      // Verify detectAllFieldsAsync was called (inside refillNewFields)
      expect(mockDetectAsync).toHaveBeenCalled();
      expect(mockFillSingle).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it("calls callback when new fields are detected", async () => {
      vi.useFakeTimers();

      const mockFields = [{ selector: "#f1", fieldType: "email" }];
      mockDetect
        .mockReturnValueOnce({ fields: [] })
        .mockReturnValue({ fields: mockFields });

      const callback = vi.fn();
      startWatching(callback, false);

      document.body.appendChild(document.createElement("input"));

      await vi.advanceTimersByTimeAsync(700);

      expect(callback).toHaveBeenCalledWith(1);

      vi.useRealTimers();
    });
  });

  describe("getWatcherConfig", () => {
    it("returns default config when started without config", () => {
      startWatching();
      const config = getWatcherConfig();
      expect(config).toEqual({
        debounceMs: 600,
        autoRefill: false,
        shadowDOM: false,
      });
    });

    it("returns custom config when started with config", () => {
      startWatching(undefined, undefined, {
        debounceMs: 1000,
        autoRefill: true,
        shadowDOM: true,
      });
      const config = getWatcherConfig();
      expect(config).toEqual({
        debounceMs: 1000,
        autoRefill: true,
        shadowDOM: true,
      });
    });

    it("returns a copy (not a reference to internal state)", () => {
      startWatching();
      const config1 = getWatcherConfig();
      const config2 = getWatcherConfig();
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });

    it("respects autoRefill param over config", () => {
      startWatching(undefined, true, { autoRefill: false });
      const config = getWatcherConfig();
      // config.autoRefill takes precedence when explicitly set in config
      expect(config.autoRefill).toBe(false);
    });

    it("falls back autoRefill param when config.autoRefill is undefined", () => {
      startWatching(undefined, true, { debounceMs: 200 });
      const config = getWatcherConfig();
      expect(config.autoRefill).toBe(true);
      expect(config.debounceMs).toBe(200);
    });
  });

  describe("WatcherConfig debounce", () => {
    it("uses custom debounce interval from config", async () => {
      vi.useFakeTimers();

      const mockFields = [{ selector: "#f1", fieldType: "email" }];
      mockDetect
        .mockReturnValueOnce({ fields: [] })
        .mockReturnValue({ fields: mockFields });

      const callback = vi.fn();
      startWatching(callback, false, { debounceMs: 200 });

      document.body.appendChild(document.createElement("input"));

      // Should NOT fire at 150ms
      await vi.advanceTimersByTimeAsync(150);
      expect(callback).not.toHaveBeenCalled();

      // Should fire at 200ms
      await vi.advanceTimersByTimeAsync(60);
      expect(callback).toHaveBeenCalledWith(1);

      vi.useRealTimers();
    });
  });
});
