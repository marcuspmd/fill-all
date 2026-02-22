/**
 * Shared interfaces for standardized patterns across the extension.
 *
 * These interfaces enforce consistency for message handling, storage operations,
 * and UI module lifecycles.
 */

import type { ExtensionMessage, MessageType } from "@/types";

// ── Message Handler Interface ─────────────────────────────────────────────────

/**
 * Contract for background message handlers.
 * Each handler declares which message types it supports and processes them.
 */
export interface MessageHandler {
  /** Message types this handler is responsible for */
  readonly supportedTypes: ReadonlyArray<MessageType>;
  /** Process an incoming message and return the result */
  handle(message: ExtensionMessage): Promise<unknown>;
}

// ── Storage Repository Interface ──────────────────────────────────────────────

/**
 * Base contract for typed storage repositories.
 * Each entity type (rules, forms, settings, etc.) implements this.
 */
export interface StorageRepository<T> {
  /** Retrieve all items */
  getAll(): Promise<T[]>;
  /** Remove an item by its ID */
  remove(id: string): Promise<void>;
}

/**
 * Extended storage repository for entities that can be created/updated.
 */
export interface MutableStorageRepository<T> extends StorageRepository<T> {
  /** Save (create or update) an item */
  save(item: T): Promise<void>;
}

/**
 * Storage repository filtered by URL pattern.
 */
export interface UrlFilterableRepository<T> {
  /** Get items matching a specific URL */
  getForUrl(url: string): Promise<T[]>;
}

// ── UI Module Interface ───────────────────────────────────────────────────────

/**
 * Contract for UI modules (options page tabs, popup sections).
 * Provides a consistent lifecycle for initialization and cleanup.
 */
export interface UIModule {
  /** Initialize the module — bind event listeners, load data */
  init(): void | Promise<void>;
}

/**
 * Extended UI module with cleanup support.
 */
export interface DisposableUIModule extends UIModule {
  /** Destroy the module — remove event listeners, clean up DOM nodes */
  destroy(): void;
}

// ── Field Icon Component Interface ────────────────────────────────────────────

/**
 * Contract for field icon sub-components (inspect modal, rule popup).
 */
export interface FieldIconComponent {
  /** Show the component anchored to a DOM element */
  show(anchor: HTMLElement): void;
  /** Hide and clean up the component */
  hide(): void;
}
