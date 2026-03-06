import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  navigateAndWait,
  waitForTabLoad,
  waitForUrlPattern,
  injectContentScript,
} from "@/lib/demo/navigation-handler";

// ── Chrome tabs mock helpers ──────────────────────────────────────────────────

type TabsUpdatedListener = (
  tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab?: chrome.tabs.Tab,
) => void;

let onUpdatedListeners: TabsUpdatedListener[] = [];

function setupChromeMock(overrides: Partial<typeof chrome.tabs> = {}) {
  const tabsMock = {
    update: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue({ status: "loading" }),
    sendMessage: vi.fn().mockResolvedValue(undefined),
    onUpdated: {
      addListener: vi.fn((listener: TabsUpdatedListener) => {
        onUpdatedListeners.push(listener);
      }),
      removeListener: vi.fn((listener: TabsUpdatedListener) => {
        onUpdatedListeners = onUpdatedListeners.filter((l) => l !== listener);
      }),
    },
    ...overrides,
  };

  vi.stubGlobal("chrome", {
    ...globalThis.chrome,
    tabs: tabsMock,
  });

  return tabsMock;
}

function fireTabUpdated(
  tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: Partial<chrome.tabs.Tab> = {},
) {
  for (const listener of [...onUpdatedListeners]) {
    listener(tabId, changeInfo, tab as chrome.tabs.Tab);
  }
}

beforeEach(() => {
  onUpdatedListeners = [];
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ── waitForTabLoad ─────────────────────────────────────────────────────────────

describe("waitForTabLoad", () => {
  it("resolves true when tab fires complete status event", async () => {
    setupChromeMock();
    const promise = waitForTabLoad(1, 5000);
    fireTabUpdated(1, { status: "complete" });
    expect(await promise).toBe(true);
  });

  it("ignores events from other tab IDs", async () => {
    setupChromeMock();
    const promise = waitForTabLoad(1, 5000);
    fireTabUpdated(2, { status: "complete" }); // wrong tabId
    // Tab 1 should NOT resolve yet
    let resolved = false;
    promise.then(() => {
      resolved = true;
    });
    await Promise.resolve();
    expect(resolved).toBe(false);
    // Now fire for the correct tab
    fireTabUpdated(1, { status: "complete" });
    expect(await promise).toBe(true);
  });

  it("ignores events with non-complete status", async () => {
    setupChromeMock();
    const promise = waitForTabLoad(1, 5000);
    fireTabUpdated(1, { status: "loading" });
    let resolved = false;
    promise.then(() => {
      resolved = true;
    });
    await Promise.resolve();
    expect(resolved).toBe(false);
    fireTabUpdated(1, { status: "complete" });
    expect(await promise).toBe(true);
  });

  it("resolves true when tab is already complete (tabs.get fast-path)", async () => {
    setupChromeMock({
      get: vi.fn().mockResolvedValue({ status: "complete" }),
    });
    // tabs.get resolves as a microtask — no timer advance needed
    expect(await waitForTabLoad(1, 5000)).toBe(true);
  });

  it("resolves false on timeout", async () => {
    setupChromeMock();
    const promise = waitForTabLoad(1, 3000);
    await vi.runAllTimersAsync();
    expect(await promise).toBe(false);
  });

  it("resolves false when tabs.get rejects", async () => {
    setupChromeMock({
      get: vi.fn().mockRejectedValue(new Error("No tab")),
    });
    expect(await waitForTabLoad(1, 5000)).toBe(false);
  });

  it("removes the listener after resolving", async () => {
    const tabsMock = setupChromeMock();
    const promise = waitForTabLoad(1, 5000);
    fireTabUpdated(1, { status: "complete" });
    await promise;
    expect(tabsMock.onUpdated.removeListener).toHaveBeenCalledOnce();
  });

  it("removes the listener after timeout", async () => {
    const tabsMock = setupChromeMock();
    const promise = waitForTabLoad(1, 3000);
    await vi.runAllTimersAsync();
    await promise;
    expect(tabsMock.onUpdated.removeListener).toHaveBeenCalledOnce();
  });
});

// ── navigateAndWait ────────────────────────────────────────────────────────────

describe("navigateAndWait", () => {
  it("navigates the tab and waits for load — success path", async () => {
    const tabsMock = setupChromeMock();
    const promise = navigateAndWait(42, "https://example.com", 5000);
    // tabs.update is async — wait for it to resolve so waitForTabLoad registers its listener
    await Promise.resolve();
    fireTabUpdated(42, { status: "complete" });
    expect(await promise).toBe(true);
    expect(tabsMock.update).toHaveBeenCalledWith(42, {
      url: "https://example.com",
    });
  });

  it("returns false when tabs.update throws", async () => {
    setupChromeMock({
      update: vi.fn().mockRejectedValue(new Error("No permission")),
    });
    expect(await navigateAndWait(1, "https://example.com")).toBe(false);
  });

  it("returns false when tab load times out", async () => {
    setupChromeMock();
    const promise = navigateAndWait(1, "https://example.com", 1000);
    // advanceTimersByTimeAsync flushes microtasks before/during timer advancement,
    // allowing tabs.update to resolve and the 1000ms load timer to fire.
    await vi.advanceTimersByTimeAsync(2000);
    expect(await promise).toBe(false);
  });
});

// ── waitForUrlPattern ──────────────────────────────────────────────────────────

describe("waitForUrlPattern", () => {
  it("resolves true when tab URL matches the fragment", async () => {
    setupChromeMock();
    const promise = waitForUrlPattern(5, "/dashboard", 5000);
    fireTabUpdated(
      5,
      { status: "complete" },
      { url: "https://example.com/dashboard" },
    );
    expect(await promise).toBe(true);
  });

  it("ignores complete events where URL does not match", async () => {
    setupChromeMock();
    const promise = waitForUrlPattern(5, "/dashboard", 5000);
    fireTabUpdated(
      5,
      { status: "complete" },
      { url: "https://example.com/home" },
    );
    let resolved = false;
    promise.then(() => {
      resolved = true;
    });
    await Promise.resolve();
    expect(resolved).toBe(false);
    // Now deliver the correct URL
    fireTabUpdated(
      5,
      { status: "complete" },
      { url: "https://example.com/dashboard" },
    );
    expect(await promise).toBe(true);
  });

  it("ignores events from other tabs", async () => {
    setupChromeMock();
    const promise = waitForUrlPattern(5, "/dashboard", 5000);
    fireTabUpdated(
      99,
      { status: "complete" },
      { url: "https://example.com/dashboard" },
    );
    let resolved = false;
    promise.then(() => {
      resolved = true;
    });
    await Promise.resolve();
    expect(resolved).toBe(false);
    fireTabUpdated(
      5,
      { status: "complete" },
      { url: "https://example.com/dashboard" },
    );
    expect(await promise).toBe(true);
  });

  it("resolves false on timeout", async () => {
    setupChromeMock();
    const promise = waitForUrlPattern(5, "/dashboard", 2000);
    await vi.runAllTimersAsync();
    expect(await promise).toBe(false);
  });

  it("ignores complete events where tab has no URL", async () => {
    setupChromeMock();
    const promise = waitForUrlPattern(5, "/dashboard", 5000);
    // Event with no tab.url — should not resolve
    fireTabUpdated(5, { status: "complete" }, {});
    let resolved = false;
    promise.then(() => {
      resolved = true;
    });
    await Promise.resolve();
    expect(resolved).toBe(false);
    fireTabUpdated(
      5,
      { status: "complete" },
      { url: "https://example.com/dashboard" },
    );
    expect(await promise).toBe(true);
  });
});

// ── injectContentScript ────────────────────────────────────────────────────────

describe("injectContentScript", () => {
  it("returns true when content script responds with pong", async () => {
    setupChromeMock({
      sendMessage: vi.fn().mockResolvedValue({ pong: true }),
    });
    const promise = injectContentScript(1);
    await vi.runAllTimersAsync();
    expect(await promise).toBe(true);
  });

  it("returns true after initial failures followed by pong", async () => {
    let attempts = 0;
    setupChromeMock({
      sendMessage: vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) return Promise.reject(new Error("Not ready"));
        return Promise.resolve({ pong: true });
      }),
    });
    const promise = injectContentScript(1);
    await vi.runAllTimersAsync();
    expect(await promise).toBe(true);
    expect(attempts).toBeGreaterThanOrEqual(3);
  });

  it("returns false when content script never responds (all attempts fail)", async () => {
    setupChromeMock({
      sendMessage: vi.fn().mockRejectedValue(new Error("No response")),
    });
    const promise = injectContentScript(1);
    await vi.runAllTimersAsync();
    expect(await promise).toBe(false);
  });

  it("returns false when sendMessage returns non-pong response", async () => {
    setupChromeMock({
      sendMessage: vi.fn().mockResolvedValue(null),
    });
    const promise = injectContentScript(1);
    await vi.runAllTimersAsync();
    expect(await promise).toBe(false);
  });

  it("sends PING message to the given tabId", async () => {
    const tabsMock = setupChromeMock({
      sendMessage: vi.fn().mockResolvedValue({ pong: true }),
    });
    const promise = injectContentScript(7);
    await vi.runAllTimersAsync();
    await promise;
    expect(tabsMock.sendMessage).toHaveBeenCalledWith(7, { type: "PING" });
  });
});
