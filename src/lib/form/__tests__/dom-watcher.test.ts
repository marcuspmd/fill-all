// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../form-detector", () => ({
  detectAllFields: vi
    .fn()
    .mockReturnValue({ fields: [], url: "http://localhost/" }),
}));

vi.mock("../form-filler", () => ({
  fillAllFields: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { detectAllFields } from "../form-detector";
import { fillAllFields } from "../form-filler";
import {
  isWatcherActive,
  setFillingInProgress,
  startWatching,
  stopWatching,
} from "../dom-watcher";

const mockDetect = detectAllFields as ReturnType<typeof vi.fn>;
const mockFill = fillAllFields as ReturnType<typeof vi.fn>;

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

      startWatching(undefined, true);

      // Trigger a mutation
      const p = document.createElement("p");
      document.body.appendChild(p);

      // Advance debounce
      await vi.advanceTimersByTimeAsync(700);

      expect(mockFill).toHaveBeenCalled();

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
});
