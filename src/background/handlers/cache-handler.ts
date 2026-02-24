/**
 * Cache message handler — Field Detection Cache CRUD.
 */

import type { MessageHandler } from "@/types/interfaces";
import type { ExtensionMessage, MessageType } from "@/types";
import {
  getFieldDetectionCache,
  getFieldDetectionCacheForUrl,
  saveFieldDetectionCacheForUrl,
  deleteFieldDetectionCacheForUrl,
  clearFieldDetectionCache,
} from "@/lib/storage/cache-storage";
import { getSettings } from "@/lib/storage/settings-storage";
import {
  parseSaveFieldCachePayload,
  parseStringPayload,
} from "@/lib/messaging/validators";

const SUPPORTED: ReadonlyArray<MessageType> = [
  "GET_FIELD_CACHE",
  "SAVE_FIELD_CACHE",
  "DELETE_FIELD_CACHE",
  "CLEAR_FIELD_CACHE",
];

async function handle(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case "GET_FIELD_CACHE": {
      const payload = message.payload as { url?: string } | undefined;
      if (payload?.url) {
        return getFieldDetectionCacheForUrl(payload.url);
      }
      return getFieldDetectionCache();
    }

    case "SAVE_FIELD_CACHE": {
      const payload = parseSaveFieldCachePayload(message.payload);
      if (!payload) return { error: "Invalid payload for SAVE_FIELD_CACHE" };
      const cacheSettings = await getSettings();
      if (cacheSettings.cacheEnabled === false) {
        return { success: true, skipped: true };
      }
      return saveFieldDetectionCacheForUrl(payload.url, payload.fields);
    }

    case "DELETE_FIELD_CACHE": {
      const url = parseStringPayload(message.payload);
      if (!url) return { error: "Invalid payload for DELETE_FIELD_CACHE" };
      await deleteFieldDetectionCacheForUrl(url);
      return { success: true };
    }

    case "CLEAR_FIELD_CACHE":
      await clearFieldDetectionCache();
      return { success: true };

    default:
      return { error: `Unhandled type in cacheHandler: ${message.type}` };
  }
}

export const cacheHandler: MessageHandler = {
  supportedTypes: SUPPORTED,
  handle,
};
