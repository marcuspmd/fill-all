import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getDemoFlows,
  getDemoFlowById,
  saveDemoFlow,
  deleteDemoFlow,
  clearDemoFlows,
} from "@/lib/demo/demo-storage";
import { DEFAULT_REPLAY_CONFIG } from "@/lib/demo/demo.types";
import type { FlowScript } from "@/lib/demo/demo.types";

const mockGet = chrome.storage.local.get as ReturnType<typeof vi.fn>;
const mockSet = chrome.storage.local.set as ReturnType<typeof vi.fn>;

const DEMO_KEY = "fill_all_demo_flows";

function makeFlow(id: string, name = "Test"): FlowScript {
  return {
    id,
    metadata: {
      name,
      baseUrl: "https://example.com",
      seed: "abc",
      createdAt: 1000,
      updatedAt: 1000,
      version: 1,
    },
    replayConfig: { ...DEFAULT_REPLAY_CONFIG },
    steps: [],
  };
}

describe("getDemoFlows", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset();
  });

  it("returns empty array when storage is empty", async () => {
    mockGet.mockResolvedValue({});

    const result = await getDemoFlows();

    expect(result).toEqual([]);
  });

  it("returns stored flows", async () => {
    const flows = [makeFlow("f1"), makeFlow("f2")];
    mockGet.mockResolvedValue({ [DEMO_KEY]: flows });

    const result = await getDemoFlows();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("f1");
    expect(result[1].id).toBe("f2");
  });
});

describe("getDemoFlowById", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset();
  });

  it("returns the matching flow", async () => {
    const flows = [makeFlow("f1"), makeFlow("f2", "Second")];
    mockGet.mockResolvedValue({ [DEMO_KEY]: flows });

    const result = await getDemoFlowById("f2");

    expect(result).not.toBeNull();
    expect(result!.metadata.name).toBe("Second");
  });

  it("returns null when flow not found", async () => {
    mockGet.mockResolvedValue({ [DEMO_KEY]: [makeFlow("f1")] });

    const result = await getDemoFlowById("nonexistent");

    expect(result).toBeNull();
  });

  it("returns null when storage is empty", async () => {
    mockGet.mockResolvedValue({});

    const result = await getDemoFlowById("any");

    expect(result).toBeNull();
  });
});

describe("saveDemoFlow", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset().mockResolvedValue(undefined);
  });

  it("appends a new flow to empty storage", async () => {
    mockGet.mockResolvedValue({});

    await saveDemoFlow(makeFlow("new-flow"));

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        [DEMO_KEY]: [expect.objectContaining({ id: "new-flow" })],
      }),
    );
  });

  it("replaces an existing flow with same ID", async () => {
    const existing = makeFlow("f1", "Old Name");
    mockGet.mockResolvedValue({ [DEMO_KEY]: [existing] });

    const updated = makeFlow("f1", "New Name");
    await saveDemoFlow(updated);

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        [DEMO_KEY]: [
          expect.objectContaining({
            id: "f1",
            metadata: expect.objectContaining({ name: "New Name" }),
          }),
        ],
      }),
    );
  });

  it("appends when ID does not exist", async () => {
    const existing = makeFlow("f1");
    mockGet.mockResolvedValue({ [DEMO_KEY]: [existing] });

    await saveDemoFlow(makeFlow("f2"));

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        [DEMO_KEY]: expect.arrayContaining([
          expect.objectContaining({ id: "f1" }),
          expect.objectContaining({ id: "f2" }),
        ]),
      }),
    );
  });
});

describe("deleteDemoFlow", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset().mockResolvedValue(undefined);
  });

  it("removes the matching flow", async () => {
    const flows = [makeFlow("f1"), makeFlow("f2")];
    mockGet.mockResolvedValue({ [DEMO_KEY]: flows });

    await deleteDemoFlow("f1");

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        [DEMO_KEY]: [expect.objectContaining({ id: "f2" })],
      }),
    );
  });

  it("does nothing if flow not found", async () => {
    const flows = [makeFlow("f1")];
    mockGet.mockResolvedValue({ [DEMO_KEY]: flows });

    await deleteDemoFlow("nonexistent");

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        [DEMO_KEY]: [expect.objectContaining({ id: "f1" })],
      }),
    );
  });
});

describe("clearDemoFlows", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset().mockResolvedValue(undefined);
  });

  it("sets empty array to storage", async () => {
    mockGet.mockResolvedValue({ [DEMO_KEY]: [makeFlow("f1"), makeFlow("f2")] });

    await clearDemoFlows();

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        [DEMO_KEY]: [],
      }),
    );
  });
});
