/**
 * Handler registry — maps message types to their handlers using the MessageHandler interface.
 */

import type { MessageHandler } from "@/types/interfaces";
import type { ExtensionMessage, MessageType } from "@/types";
import {
  rulesHandler,
  storageHandler,
  cacheHandler,
  learningHandler,
  datasetHandler,
  aiHandler,
} from "./handlers";

const ALL_HANDLERS: ReadonlyArray<MessageHandler> = [
  rulesHandler,
  storageHandler,
  cacheHandler,
  learningHandler,
  datasetHandler,
  aiHandler,
];

/** Pre-built map: MessageType → MessageHandler for O(1) dispatch */
const handlerMap = new Map<MessageType, MessageHandler>();
for (const handler of ALL_HANDLERS) {
  for (const type of handler.supportedTypes) {
    handlerMap.set(type, handler);
  }
}

export function getHandlerForType(type: MessageType): MessageHandler | null {
  return handlerMap.get(type) ?? null;
}

export async function dispatchMessage(
  message: ExtensionMessage,
): Promise<unknown> {
  const handler = getHandlerForType(message.type);
  if (!handler) return null;
  return handler.handle(message);
}
