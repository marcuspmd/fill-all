// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  registerAdapter,
  getAdapter,
  detectCustomComponents,
  fillCustomComponent,
} from "../adapter-registry";
import type { CustomComponentAdapter, AdapterName } from "../adapter.interface";
import type { FormField } from "@/types";

// ── Stub adapter factory ──────────────────────────────────────────────────────

function makeAdapter(
  name: AdapterName,
  selector: string,
  opts: {
    matches?: boolean;
    fillResult?: boolean;
    fillThrows?: boolean;
    field?: Partial<FormField>;
  } = {},
): CustomComponentAdapter {
  const el = document.createElement("div");
  const field: FormField = {
    element: el,
    selector: `[data-${name}]`,
    category: "unknown",
    fieldType: "unknown",
    label: name,
    name: "",
    id: "",
    placeholder: "",
    required: false,
    contextSignals: "",
    adapterName: name,
    ...(opts.field ?? {}),
  };

  return {
    name,
    selector,
    matches: vi.fn().mockReturnValue(opts.matches ?? true),
    buildField: vi.fn().mockReturnValue(field),
    fill: opts.fillThrows
      ? vi.fn().mockRejectedValue(new Error("fill error"))
      : vi.fn().mockResolvedValue(opts.fillResult ?? true),
  };
}

// ── getAdapter ────────────────────────────────────────────────────────────────

describe("getAdapter", () => {
  it("returns undefined for unknown adapter name", () => {
    expect(getAdapter("nonexistent-adapter" as AdapterName)).toBeUndefined();
  });

  it("returns adapter after registerAdapter", () => {
    const adapter = makeAdapter("select2" as AdapterName, ".select2-container");
    registerAdapter(adapter);
    expect(getAdapter("select2" as AdapterName)).toBe(adapter);
  });
});

// ── registerAdapter ───────────────────────────────────────────────────────────

describe("registerAdapter", () => {
  it("makes the adapter retrievable by name", () => {
    const adapter = makeAdapter(
      "ant-input" as AdapterName,
      ".ant-input-affix-wrapper",
    );
    registerAdapter(adapter);
    expect(getAdapter("ant-input" as AdapterName)).toBeDefined();
  });

  it("overwrites previous adapter with same name on next lookup", () => {
    const a1 = makeAdapter("ant-select" as AdapterName, ".ant-select-v1");
    const a2 = makeAdapter("ant-select" as AdapterName, ".ant-select-v2");
    registerAdapter(a1);
    registerAdapter(a2);
    // Map rebuild: last registered wins
    const result = getAdapter("ant-select" as AdapterName);
    expect(result?.selector).toBe(".ant-select-v2");
  });
});

// ── detectCustomComponents ────────────────────────────────────────────────────

describe("detectCustomComponents", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns empty array when no matching elements in the DOM", () => {
    const fields = detectCustomComponents();
    expect(Array.isArray(fields)).toBe(true);
  });

  it("detects elements matching adapter selector when matches() is true", () => {
    const adapter = makeAdapter("detect-ok" as AdapterName, ".detect-ok");
    registerAdapter(adapter);

    document.body.innerHTML = `<div class="detect-ok"></div>`;
    const fields = detectCustomComponents();

    expect(adapter.matches).toHaveBeenCalled();
    expect(adapter.buildField).toHaveBeenCalled();
    expect(fields.some((f) => f.adapterName === "detect-ok")).toBe(true);
  });

  it("skips elements where matches() returns false", () => {
    const adapter = makeAdapter("detect-skip" as AdapterName, ".detect-skip", {
      matches: false,
    });
    registerAdapter(adapter);

    document.body.innerHTML = `<div class="detect-skip"></div>`;
    const fields = detectCustomComponents();

    expect(adapter.matches).toHaveBeenCalled();
    expect(adapter.buildField).not.toHaveBeenCalled();
    expect(fields.some((f) => f.adapterName === "detect-skip")).toBe(false);
  });

  it("does not claim same element twice (WeakSet deduplication)", () => {
    const adapter1 = makeAdapter("dup-1" as AdapterName, ".dup-target");
    const adapter2 = makeAdapter("dup-2" as AdapterName, ".dup-target");
    registerAdapter(adapter1);
    registerAdapter(adapter2);

    document.body.innerHTML = `<div class="dup-target"></div>`;
    const fields = detectCustomComponents();

    // Only the first adapter should claim the element
    const dupFields = fields.filter(
      (f) => f.adapterName === "dup-1" || f.adapterName === "dup-2",
    );
    expect(dupFields.length).toBe(1);
    expect(dupFields[0].adapterName).toBe("dup-1");
  });

  it("handles buildField errors gracefully", () => {
    const adapter = makeAdapter(
      "build-err" as AdapterName,
      ".build-err-target",
    );
    adapter.buildField = vi.fn().mockImplementation(() => {
      throw new Error("buildField exploded");
    });
    registerAdapter(adapter);

    document.body.innerHTML = `<div class="build-err-target"></div>`;
    const fields = detectCustomComponents();

    // Should not throw, error is caught internally
    expect(adapter.buildField).toHaveBeenCalled();
    expect(fields.some((f) => f.adapterName === "build-err")).toBe(false);
  });
});

// ── fillCustomComponent ───────────────────────────────────────────────────────

describe("fillCustomComponent", () => {
  function makeField(adapterName?: AdapterName): FormField {
    return {
      element: document.createElement("div"),
      selector: "#x",
      category: "unknown",
      fieldType: "unknown",
      label: "x",
      name: "",
      id: "",
      placeholder: "",
      required: false,
      contextSignals: "",
      adapterName,
    };
  }

  it("returns false when field has no adapterName", async () => {
    const result = await fillCustomComponent(makeField(), "value");
    expect(result).toBe(false);
  });

  it("returns false when adapterName not found in registry", async () => {
    const result = await fillCustomComponent(
      makeField("ghost-adapter" as AdapterName),
      "value",
    );
    expect(result).toBe(false);
  });

  it("calls adapter.fill and returns true on success", async () => {
    const adapter = makeAdapter("fill-ok" as AdapterName, ".fill-ok", {
      fillResult: true,
    });
    registerAdapter(adapter);

    const field = makeField("fill-ok" as AdapterName);
    const result = await fillCustomComponent(field, "hello");
    expect(result).toBe(true);
    expect(adapter.fill).toHaveBeenCalledWith(field.element, "hello");
  });

  it("returns false when adapter.fill returns false", async () => {
    const adapter = makeAdapter("fill-false" as AdapterName, ".fill-false", {
      fillResult: false,
    });
    registerAdapter(adapter);

    const field = makeField("fill-false" as AdapterName);
    const result = await fillCustomComponent(field, "v");
    expect(result).toBe(false);
  });

  it("returns false (does not throw) when adapter.fill throws", async () => {
    const adapter = makeAdapter("fill-throw" as AdapterName, ".fill-throw", {
      fillThrows: true,
    });
    registerAdapter(adapter);

    const field = makeField("fill-throw" as AdapterName);
    const result = await fillCustomComponent(field, "v");
    expect(result).toBe(false);
  });
});
