/**
 * Demo flow storage — CRUD for persisted FlowScript objects.
 *
 * Uses `chrome.storage.local` under the `fill_all_demo_flows` key.
 * Each flow is identified by `metadata.id`.
 */

import { createLogger } from "@/lib/logger";
import {
  getFromStorage,
  updateStorageAtomically,
  STORAGE_KEYS,
} from "@/lib/storage/core";
import type { FlowScript } from "./demo.types";

const log = createLogger("DemoStorage");

const KEY = STORAGE_KEYS.DEMO_FLOWS;
const MAX_FLOWS = 200;

// ── Read ──────────────────────────────────────────────────────────────────

/** Retrieve all saved demo flows. */
export async function getDemoFlows(): Promise<FlowScript[]> {
  return getFromStorage<FlowScript[]>(KEY, []);
}

/** Retrieve a single flow by ID. Returns `null` if not found. */
export async function getDemoFlowById(
  flowId: string,
): Promise<FlowScript | null> {
  const flows = await getDemoFlows();
  return flows.find((f) => f.id === flowId) ?? null;
}

// ── Write ─────────────────────────────────────────────────────────────────

/** Save (upsert) a demo flow. If ID exists, replaces; otherwise appends. */
export async function saveDemoFlow(flow: FlowScript): Promise<void> {
  await updateStorageAtomically<FlowScript[]>(KEY, [], (current) => {
    const idx = current.findIndex((f) => f.id === flow.id);
    const next = [...current];

    if (idx >= 0) {
      next[idx] = flow;
    } else {
      if (next.length >= MAX_FLOWS) {
        log.warn(`Max flows (${MAX_FLOWS}) reached — oldest flow removed`);
        next.shift();
      }
      next.push(flow);
    }

    return next;
  });
}

// ── Delete ────────────────────────────────────────────────────────────────

/** Delete a demo flow by ID. */
export async function deleteDemoFlow(flowId: string): Promise<void> {
  await updateStorageAtomically<FlowScript[]>(KEY, [], (current) =>
    current.filter((f) => f.id !== flowId),
  );
}

/** Delete all demo flows. */
export async function clearDemoFlows(): Promise<void> {
  await updateStorageAtomically<FlowScript[]>(KEY, [], () => []);
}
