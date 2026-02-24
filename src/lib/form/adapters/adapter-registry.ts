/**
 * Custom Component Adapter Registry
 *
 * Central registry for all custom component adapters (Select2, Ant Design, etc.).
 * Adapters register here and the registry is consumed by:
 *   - form-detector.ts (page-level detection)
 *   - form-filler.ts (custom fill delegation)
 *
 * The registry provides:
 *   - detectAll()  — scans the page for custom components across all adapters
 *   - getAdapter() — retrieves a specific adapter by name for fill-time delegation
 *
 * To add a new adapter:
 *   1. Implement CustomComponentAdapter
 *   2. Import and add to ADAPTER_REGISTRY array below
 */

import type { FormField } from "@/types";
import type { CustomComponentAdapter, AdapterName } from "./adapter.interface";
import { createLogger } from "@/lib/logger";

// ── Concrete Adapters ─────────────────────────────────────────────────────────
import { select2Adapter } from "./select2";
import {
  antdAutoCompleteAdapter,
  antdCascaderAdapter,
  antdCheckboxAdapter,
  antdDatepickerAdapter,
  antdInputAdapter,
  antdRadioAdapter,
  antdRateAdapter,
  antdSelectAdapter,
  antdSliderAdapter,
  antdSwitchAdapter,
  antdTransferAdapter,
  antdTreeSelectAdapter,
} from "./antd";

const log = createLogger("AdapterRegistry");

// ── Registry ──────────────────────────────────────────────────────────────────

/**
 * All registered adapters — import concrete adapters and add them here.
 * Order matters: first adapter to claim an element wins.
 *
 * Ant Design adapters are ordered from most specific (cascader, tree-select)
 * to most generic (input, auto-complete) to avoid false positives.
 */
const ADAPTER_REGISTRY: CustomComponentAdapter[] = [
  select2Adapter,
  antdCascaderAdapter,
  antdTreeSelectAdapter,
  antdSelectAdapter,
  antdAutoCompleteAdapter,
  antdDatepickerAdapter,
  antdInputAdapter,
  antdRadioAdapter,
  antdCheckboxAdapter,
  antdSwitchAdapter,
  antdSliderAdapter,
  antdRateAdapter,
  antdTransferAdapter,
];

/** Fast lookup by adapter name. Built lazily from ADAPTER_REGISTRY. */
let _adapterMap: Map<AdapterName, CustomComponentAdapter> | null = null;

function getAdapterMap(): Map<AdapterName, CustomComponentAdapter> {
  if (!_adapterMap) {
    _adapterMap = new Map(ADAPTER_REGISTRY.map((a) => [a.name, a]));
  }
  return _adapterMap;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Registers a new adapter at runtime.
 * Useful for lazy-loading or conditionally adding adapters.
 */
export function registerAdapter(adapter: CustomComponentAdapter): void {
  ADAPTER_REGISTRY.push(adapter);
  _adapterMap = null; // invalidate cache
  log.debug(`Adapter registrado: "${adapter.name}"`);
}

/**
 * Returns the adapter matching the given name, or undefined.
 */
export function getAdapter(
  name: AdapterName,
): CustomComponentAdapter | undefined {
  return getAdapterMap().get(name);
}

/**
 * Scans the page for all custom components across registered adapters.
 * Returns FormField stubs (fieldType = "unknown") ready for classification.
 *
 * Each element is claimed by the first matching adapter only (no duplicates).
 */
export function detectCustomComponents(): FormField[] {
  if (ADAPTER_REGISTRY.length === 0) return [];

  const claimed = new WeakSet<HTMLElement>();
  const fields: FormField[] = [];

  for (const adapter of ADAPTER_REGISTRY) {
    const candidates = document.querySelectorAll<HTMLElement>(adapter.selector);

    for (const el of candidates) {
      if (claimed.has(el)) continue;

      if (!adapter.matches(el)) continue;

      claimed.add(el);

      try {
        const field = adapter.buildField(el);
        fields.push(field);
        log.debug(`[${adapter.name}] campo detectado: ${field.selector}`);
      } catch (err) {
        log.warn(`[${adapter.name}] Erro ao construir campo:`, err);
      }
    }
  }

  log.info(`${fields.length} componente(s) customizado(s) detectado(s)`);
  return fields;
}

/**
 * Fills a custom component field using its adapter.
 * Returns true if the adapter handled the fill, false otherwise.
 * Supports both sync and async adapters.
 */
export async function fillCustomComponent(
  field: FormField,
  value: string,
): Promise<boolean> {
  const adapterName = field.adapterName as AdapterName | undefined;
  if (!adapterName) return false;

  const adapter = getAdapter(adapterName);
  if (!adapter) {
    log.warn(`Adapter "${adapterName}" não encontrado para preenchimento`);
    return false;
  }

  try {
    const result = await adapter.fill(field.element as HTMLElement, value);
    if (!result) {
      log.warn(
        `[${adapter.name}] fill() retornou false para: ${field.selector}`,
      );
    }
    return result;
  } catch (err) {
    log.warn(
      `[${adapter.name}] Erro ao preencher campo ${field.selector}:`,
      err,
    );
    return false;
  }
}
