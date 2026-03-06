// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  registerAdapter,
  getAdapter,
  detectCustomComponents,
  fillCustomComponent,
  extractCustomComponentValue,
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

// ── extractCustomComponentValue ───────────────────────────────────────────────

describe("extractCustomComponentValue", () => {
  function makeField(
    adapterName?: AdapterName,
    element?: HTMLElement,
  ): FormField {
    return {
      element: element ?? document.createElement("div"),
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

  it("returns null when field has no adapterName", () => {
    expect(extractCustomComponentValue(makeField())).toBeNull();
  });

  it("returns null when adapterName not found in registry", () => {
    const field = makeField("ghost-extractor" as AdapterName);
    expect(extractCustomComponentValue(field)).toBeNull();
  });

  it("returns value from adapter.extractValue when provided and returns a value", () => {
    const adapter = makeAdapter(
      "custom-extractor" as AdapterName,
      ".custom-ex",
    );
    (
      adapter as CustomComponentAdapter & { extractValue: () => string }
    ).extractValue = vi.fn().mockReturnValue("extracted-value");
    registerAdapter(adapter);

    const field = makeField("custom-extractor" as AdapterName);
    expect(extractCustomComponentValue(field)).toBe("extracted-value");
  });

  it("falls through to native when adapter.extractValue returns null", () => {
    const wrapper = document.createElement("div");
    const input = document.createElement("input");
    input.value = "fallback-value";
    wrapper.appendChild(input);

    const adapter = makeAdapter(
      "ex-fallthrough" as AdapterName,
      ".ex-fallthrough",
    );
    (
      adapter as CustomComponentAdapter & {
        extractValue: () => null;
      }
    ).extractValue = vi.fn().mockReturnValue(null);
    registerAdapter(adapter);

    const field = makeField("ex-fallthrough" as AdapterName, wrapper);
    expect(extractCustomComponentValue(field)).toBe("fallback-value");
  });

  it("falls through to native when adapter.extractValue throws", () => {
    const wrapper = document.createElement("div");
    const input = document.createElement("input");
    input.value = "fallback-after-throw";
    wrapper.appendChild(input);

    const adapter = makeAdapter("ex-throw" as AdapterName, ".ex-throw");
    (
      adapter as CustomComponentAdapter & {
        extractValue: () => string | null;
      }
    ).extractValue = vi.fn().mockImplementation(() => {
      throw new Error("extraction failed");
    });
    registerAdapter(adapter);

    const field = makeField("ex-throw" as AdapterName, wrapper);
    expect(extractCustomComponentValue(field)).toBe("fallback-after-throw");
  });

  it("returns native.value for HTMLSelectElement", () => {
    const wrapper = document.createElement("div");
    const select = document.createElement("select");
    const opt = document.createElement("option");
    opt.value = "option-a";
    opt.selected = true;
    select.appendChild(opt);
    wrapper.appendChild(select);

    const adapter = makeAdapter("ex-select" as AdapterName, ".ex-select");
    registerAdapter(adapter);

    const field = makeField("ex-select" as AdapterName, wrapper);
    expect(extractCustomComponentValue(field)).toBe("option-a");
  });

  it("returns 'true' for checked checkbox input", () => {
    const wrapper = document.createElement("div");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = true;
    wrapper.appendChild(input);

    const adapter = makeAdapter("ex-checkbox" as AdapterName, ".ex-chk");
    registerAdapter(adapter);

    const field = makeField("ex-checkbox" as AdapterName, wrapper);
    expect(extractCustomComponentValue(field)).toBe("true");
  });

  it("returns 'false' for unchecked radio input", () => {
    const wrapper = document.createElement("div");
    const input = document.createElement("input");
    input.type = "radio";
    input.checked = false;
    wrapper.appendChild(input);

    const adapter = makeAdapter("ex-radio" as AdapterName, ".ex-radio");
    registerAdapter(adapter);

    const field = makeField("ex-radio" as AdapterName, wrapper);
    expect(extractCustomComponentValue(field)).toBe("false");
  });

  it("returns input.value for text input", () => {
    const wrapper = document.createElement("div");
    const input = document.createElement("input");
    input.type = "text";
    input.value = "text-value";
    wrapper.appendChild(input);

    const adapter = makeAdapter("ex-text" as AdapterName, ".ex-text");
    registerAdapter(adapter);

    const field = makeField("ex-text" as AdapterName, wrapper);
    expect(extractCustomComponentValue(field)).toBe("text-value");
  });

  it("returns textarea.value for textarea", () => {
    const wrapper = document.createElement("div");
    const textarea = document.createElement("textarea");
    textarea.value = "textarea-content";
    wrapper.appendChild(textarea);

    const adapter = makeAdapter("ex-textarea" as AdapterName, ".ex-textarea");
    registerAdapter(adapter);

    const field = makeField("ex-textarea" as AdapterName, wrapper);
    expect(extractCustomComponentValue(field)).toBe("textarea-content");
  });

  it("returns null when no native input found and no extractValue", () => {
    const wrapper = document.createElement("div");
    wrapper.textContent = "no inputs here";

    const adapter = makeAdapter("ex-empty" as AdapterName, ".ex-empty");
    registerAdapter(adapter);

    const field = makeField("ex-empty" as AdapterName, wrapper);
    expect(extractCustomComponentValue(field)).toBeNull();
  });
});
