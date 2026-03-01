import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrainingMeta } from "@/lib/ai/runtime-trainer";

// ── Chrome API mock ───────────────────────────────────────────────────────────

const mockStorage: Record<string, unknown> = {};

const chromeMock = {
  storage: {
    local: {
      get: vi.fn(async (keys: string | string[]) => {
        const keyList = Array.isArray(keys) ? keys : [keys];
        const result: Record<string, unknown> = {};
        for (const key of keyList) {
          if (key in mockStorage) result[key] = mockStorage[key];
        }
        return result;
      }),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(mockStorage, items);
      }),
      remove: vi.fn(async (keys: string[]) => {
        for (const key of keys) delete mockStorage[key];
      }),
    },
  },
};

vi.stubGlobal("chrome", chromeMock);

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ── SUT ───────────────────────────────────────────────────────────────────────

import {
  deleteRuntimeModel,
  getRuntimeModelMeta,
  hasRuntimeModel,
  RUNTIME_LABELS_KEY,
  RUNTIME_META_KEY,
  RUNTIME_MODEL_KEY,
  RUNTIME_VOCAB_KEY,
} from "@/lib/ai/runtime-trainer";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("runtime-trainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock storage
    for (const key of Object.keys(mockStorage)) delete mockStorage[key];
  });

  // ── Constants ────────────────────────────────────────────────────────────

  describe("exported constants", () => {
    it("exports correct storage keys", () => {
      expect(RUNTIME_MODEL_KEY).toBe("fill_all_runtime_model");
      expect(RUNTIME_VOCAB_KEY).toBe("fill_all_runtime_vocab");
      expect(RUNTIME_LABELS_KEY).toBe("fill_all_runtime_labels");
      expect(RUNTIME_META_KEY).toBe("fill_all_runtime_meta");
    });
  });

  // ── hasRuntimeModel ───────────────────────────────────────────────────────

  describe("hasRuntimeModel", () => {
    it("returns false when no model is stored", async () => {
      const result = await hasRuntimeModel();

      expect(result).toBe(false);
      expect(chromeMock.storage.local.get).toHaveBeenCalledWith(
        RUNTIME_MODEL_KEY,
      );
    });

    it("returns true when a model artifact exists", async () => {
      mockStorage[RUNTIME_MODEL_KEY] = {
        topology: {},
        weightSpecs: [],
        weightDataB64: "base64==",
      };

      const result = await hasRuntimeModel();

      expect(result).toBe(true);
    });
  });

  // ── getRuntimeModelMeta ───────────────────────────────────────────────────

  describe("getRuntimeModelMeta", () => {
    it("returns null when no meta exists", async () => {
      const result = await getRuntimeModelMeta();

      expect(result).toBeNull();
    });

    it("returns stored meta when it exists", async () => {
      const meta: TrainingMeta = {
        trainedAt: Date.now(),
        epochs: 80,
        finalLoss: 0.12,
        finalAccuracy: 0.95,
        vocabSize: 512,
        numClasses: 42,
        entriesUsed: 200,
        durationMs: 45000,
      };
      mockStorage[RUNTIME_META_KEY] = meta;

      const result = await getRuntimeModelMeta();

      expect(result).toEqual(meta);
      expect(result?.finalAccuracy).toBe(0.95);
    });

    it("reads from correct storage key", async () => {
      await getRuntimeModelMeta();

      expect(chromeMock.storage.local.get).toHaveBeenCalledWith(
        RUNTIME_META_KEY,
      );
    });
  });

  // ── deleteRuntimeModel ────────────────────────────────────────────────────

  describe("deleteRuntimeModel", () => {
    it("removes all model-related keys from storage", async () => {
      mockStorage[RUNTIME_MODEL_KEY] = { topology: {} };
      mockStorage[RUNTIME_VOCAB_KEY] = { word: 1 };
      mockStorage[RUNTIME_LABELS_KEY] = ["email", "cpf"];
      mockStorage[RUNTIME_META_KEY] = { epochs: 80 };

      await deleteRuntimeModel();

      expect(chromeMock.storage.local.remove).toHaveBeenCalledWith([
        RUNTIME_MODEL_KEY,
        RUNTIME_VOCAB_KEY,
        RUNTIME_LABELS_KEY,
        RUNTIME_META_KEY,
      ]);
    });

    it("after delete, hasRuntimeModel returns false", async () => {
      mockStorage[RUNTIME_MODEL_KEY] = { topology: {} };
      mockStorage[RUNTIME_VOCAB_KEY] = {};
      mockStorage[RUNTIME_LABELS_KEY] = [];
      mockStorage[RUNTIME_META_KEY] = {};

      await deleteRuntimeModel();

      // After deleteRuntimeModel cleared mockStorage, hasRuntimeModel should see nothing
      const has = await hasRuntimeModel();
      expect(has).toBe(false);
    });

    it("is safe to call when no model exists", async () => {
      await expect(deleteRuntimeModel()).resolves.not.toThrow();
    });
  });
});
