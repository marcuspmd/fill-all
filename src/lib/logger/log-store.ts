/**
 * Persistent Log Store
 *
 * Stores log entries in chrome.storage.session so they are accessible
 * across all extension contexts (content script, background, devtools, options, popup).
 *
 * - Entries are buffered in memory and flushed to storage periodically (500ms debounce).
 * - Max 1000 entries with FIFO eviction.
 * - Listeners can subscribe to real-time log updates.
 */

import type { LogLevel } from "./index";

export interface LogEntry {
  /** ISO timestamp */
  ts: string;
  /** Log level */
  level: LogLevel;
  /** Logger namespace (e.g. "FormFiller", "ChromeAI") */
  ns: string;
  /** Formatted message text */
  msg: string;
}

type LogStoreListener = (entries: LogEntry[]) => void;

const STORAGE_KEY = "fill_all_log_entries";
let maxEntries = 1000;
const FLUSH_INTERVAL_MS = 500;

/** In-memory mirror of all entries (local context) */
let localEntries: LogEntry[] = [];

/** Entries pending write to storage */
let pendingEntries: LogEntry[] = [];

/** Debounce timer handle */
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** Subscribers notified on every new batch of entries */
const listeners: Set<LogStoreListener> = new Set();

/** Whether the store has been initialized (loaded from storage) */
let initialized = false;

/** Chrome storage listener reference for cleanup */
let storageListener:
  | ((
      changes: { [key: string]: chrome.storage.StorageChange },
      area: chrome.storage.AreaName,
    ) => void)
  | null = null;

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Initializes the log store by loading existing entries from chrome.storage.session
 * and subscribing to cross-context changes.
 */
export async function initLogStore(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (!hasSessionStorage()) return;

  try {
    const result = await chrome.storage.session.get(STORAGE_KEY);
    const stored = result[STORAGE_KEY] as LogEntry[] | undefined;
    if (Array.isArray(stored)) {
      localEntries = stored.slice(-maxEntries);
    }
  } catch {
    // Storage unavailable — stay with empty local entries
  }

  // Listen for changes from other contexts
  try {
    storageListener = (changes, area) => {
      if (area !== "session" || !changes[STORAGE_KEY]) return;
      const newVal = changes[STORAGE_KEY].newValue as LogEntry[] | undefined;
      if (Array.isArray(newVal)) {
        localEntries = newVal.slice(-maxEntries);
        notifyListeners();
      }
    };
    chrome.storage.onChanged.addListener(storageListener);
  } catch {
    // Listener setup failed — cross-context sync won't work
  }
}

/**
 * Cleans up the log store listeners.
 * Should be called when the context is destroyed (e.g., DevTools panel closed).
 */
export function destroyLogStore(): void {
  if (storageListener) {
    try {
      chrome.storage.onChanged.removeListener(storageListener);
    } catch {
      // Ignore cleanup errors
    }
    storageListener = null;
  }
  listeners.clear();
  initialized = false;
}

/**
 * Adds a log entry to the store.
 * Synchronous — queues an async flush to chrome.storage.session.
 */
export function addLogEntry(entry: LogEntry): void {
  localEntries.push(entry);
  if (localEntries.length > maxEntries) {
    localEntries = localEntries.slice(-maxEntries);
  }

  pendingEntries.push(entry);
  notifyListeners();
  scheduleFlush();
}

/**
 * Returns all log entries currently in memory..
 * Call `initLogStore()` first to ensure cross-context entries are loaded.
 */
export function getLogEntries(): LogEntry[] {
  return localEntries;
}

/**
 * Loads entries from chrome.storage.session (useful for late-opening UIs).
 */
export async function loadLogEntries(): Promise<LogEntry[]> {
  if (!hasSessionStorage()) return localEntries;

  try {
    const result = await chrome.storage.session.get(STORAGE_KEY);
    const stored = result[STORAGE_KEY] as LogEntry[] | undefined;
    if (Array.isArray(stored)) {
      localEntries = stored.slice(-maxEntries);
    }
  } catch {
    // Ignore — use local entries
  }
  return localEntries;
}
/**
 * Configures the log store at runtime.
 * Must be called before entries are added for the limit to take effect.
 */
export function configureLogStore(options: { maxEntries?: number }): void {
  if (options.maxEntries !== undefined) {
    maxEntries = Math.max(50, Math.min(5000, options.maxEntries));
  }
}
/**
 * Clears all log entries from memory and storage.
 */
export async function clearLogEntries(): Promise<void> {
  localEntries = [];
  pendingEntries = [];

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (hasSessionStorage()) {
    try {
      await chrome.storage.session.set({ [STORAGE_KEY]: [] });
    } catch {
      // Ignore
    }
  }

  notifyListeners();
}

/**
 * Returns metrics about the current state of the log store.
 * Useful for diagnosing memory leaks and monitoring subscriber count.
 */
export function getLogStoreMetrics(): {
  totalEntries: number;
  maxEntries: number;
  subscriberCount: number;
} {
  return {
    totalEntries: localEntries.length,
    maxEntries,
    subscriberCount: listeners.size,
  };
}

/**
 * Subscribes to log entry updates.
 * The listener receives all current entries on every change.
 * Warns when too many subscribers are active to surface potential memory leaks.
 * @returns An unsubscribe function.
 */
export function onLogUpdate(listener: LogStoreListener): () => void {
  if (listeners.size >= 20) {
    // eslint-disable-next-line no-console
    console.warn(
      `[LogStore] ${listeners.size + 1} active subscribers — potential memory leak. Always call the returned unsubscribe function.`,
    );
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ── Internals ──────────────────────────────────────────────────────────────────

function hasSessionStorage(): boolean {
  return (
    typeof chrome !== "undefined" &&
    !!chrome.storage &&
    !!chrome.storage.session
  );
}

function notifyListeners(): void {
  for (const fn of listeners) {
    try {
      fn(localEntries);
    } catch {
      // Listener error — ignore
    }
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(flushToStorage, FLUSH_INTERVAL_MS);
}

async function flushToStorage(): Promise<void> {
  flushTimer = null;
  if (pendingEntries.length === 0) return;

  const toFlush = pendingEntries;
  pendingEntries = [];

  if (!hasSessionStorage()) return;

  try {
    const result = await chrome.storage.session.get(STORAGE_KEY);
    let all: LogEntry[] = (result[STORAGE_KEY] as LogEntry[] | undefined) ?? [];
    all.push(...toFlush);
    if (all.length > maxEntries) {
      all = all.slice(-maxEntries);
    }
    await chrome.storage.session.set({ [STORAGE_KEY]: all });
  } catch {
    // Storage write failed — entries remain in local memory only
  }
}
