/** @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/form/extractors", () => ({
  getUniqueSelector: vi.fn((el: HTMLElement) => el.id || el.className || "sel"),
  buildSignals: vi.fn(() => "mock signals"),
  findLabelWithStrategy: vi.fn(() => null),
}));

import { select2Adapter } from "@/lib/form/adapters/select2/select2-adapter";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeSelect2Container(
  opts: Array<{ value: string; text: string }> = [],
): {
  container: HTMLElement;
  select: HTMLSelectElement;
} {
  const wrapper = document.createElement("div");
  wrapper.className = "some-field-wrapper";

  const select = document.createElement("select");
  select.className = "select2-hidden-accessible";
  select.name = "myField";
  select.id = "field-id";

  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "Choose…";
  select.appendChild(empty);

  for (const o of opts) {
    const opt = document.createElement("option");
    opt.value = o.value;
    opt.textContent = o.text;
    select.appendChild(opt);
  }

  const container = document.createElement("span");
  container.className = "select2 select2-container";

  const selection = document.createElement("span");
  selection.className = "select2-selection";

  const rendered = document.createElement("span");
  rendered.className = "select2-selection__rendered";
  rendered.textContent = "Choose…";

  selection.appendChild(rendered);
  container.appendChild(selection);

  wrapper.appendChild(select);
  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  return { container, select };
}

function makeSelect2ContainerWithPlaceholder(): HTMLElement {
  const { container } = makeSelect2Container();
  const placeholder = document.createElement("span");
  placeholder.className = "select2-selection__placeholder";
  placeholder.textContent = "Select an option";
  container.querySelector(".select2-selection")!.appendChild(placeholder);
  return container;
}

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("select2Adapter", () => {
  it("name e selector corretos", () => {
    expect(select2Adapter.name).toBe("select2");
    expect(select2Adapter.selector).toContain("select2-container");
  });

  describe("matches()", () => {
    it("retorna true para .select2-container", () => {
      const el = document.createElement("span");
      el.className = "select2-container";
      expect(select2Adapter.matches(el)).toBe(true);
    });

    it("retorna true para span.select2", () => {
      const el = document.createElement("span");
      el.className = "select2";
      expect(select2Adapter.matches(el)).toBe(true);
    });

    it("retorna false para outros elementos", () => {
      const el = document.createElement("div");
      el.className = "some-class";
      expect(select2Adapter.matches(el)).toBe(false);
    });
  });

  describe("buildField()", () => {
    it("retorna FormField com adapterName select2", () => {
      const { container } = makeSelect2Container([
        { value: "a", text: "Option A" },
      ]);
      const field = select2Adapter.buildField(container);
      expect(field.adapterName).toBe("select2");
    });

    it("fieldType é select", () => {
      const { container } = makeSelect2Container([{ value: "x", text: "X" }]);
      const field = select2Adapter.buildField(container);
      expect(field.fieldType).toBe("select");
    });

    it("extrai name e id do select original", () => {
      const { container } = makeSelect2Container([]);
      const field = select2Adapter.buildField(container);
      expect(field.name).toBe("myField");
      expect(field.id).toBe("field-id");
    });

    it("extrai opções do select original", () => {
      const { container } = makeSelect2Container([
        { value: "a", text: "Apple" },
        { value: "b", text: "Banana" },
      ]);
      const field = select2Adapter.buildField(container);
      expect(field.options).toBeDefined();
      expect(field.options!.length).toBe(2);
      expect(field.options![0].value).toBe("a");
    });

    it("retorna undefined para options se select não tem opções", () => {
      const { container } = makeSelect2Container([]);
      const field = select2Adapter.buildField(container);
      expect(field.options).toBeUndefined();
    });

    it("extrai placeholder se existe", () => {
      const container = makeSelect2ContainerWithPlaceholder();
      const field = select2Adapter.buildField(container);
      expect(field.placeholder).toBe("Select an option");
    });

    it("contextSignals está definido", () => {
      const { container } = makeSelect2Container([]);
      const field = select2Adapter.buildField(container);
      expect(field.contextSignals).toBeDefined();
    });

    it("retorna fieldType select mesmo sem hidden select", () => {
      const container = document.createElement("span");
      container.className = "select2 select2-container";
      document.body.appendChild(container);
      const field = select2Adapter.buildField(container);
      expect(field.fieldType).toBe("select");
    });
  });

  describe("fill()", () => {
    it("retorna false se select original não encontrado", () => {
      const container = document.createElement("span");
      container.className = "select2 select2-container";
      document.body.appendChild(container);
      const result = select2Adapter.fill(container, "value");
      expect(result).toBe(false);
    });

    it("preenche por valor exato e retorna true", () => {
      const { container, select } = makeSelect2Container([
        { value: "br", text: "Brasil" },
        { value: "us", text: "United States" },
      ]);

      const result = select2Adapter.fill(container, "br");
      expect(result).toBe(true);
      expect(select.value).toBe("br");
    });

    it("preenche por texto parcial (case insensitive) e retorna true", () => {
      const { container, select } = makeSelect2Container([
        { value: "br", text: "Brasil" },
        { value: "us", text: "United States" },
      ]);

      const result = select2Adapter.fill(container, "brasil");
      expect(result).toBe(true);
      expect(select.value).toBe("br");
    });

    it("fallback: preenche com opção aleatória se valor não encontrado", () => {
      const { container, select } = makeSelect2Container([
        { value: "a", text: "Alpha" },
        { value: "b", text: "Beta" },
      ]);

      const result = select2Adapter.fill(container, "xyz-not-found");
      expect(result).toBe(true);
      expect(["a", "b"]).toContain(select.value);
    });

    it("retorna false se não há opções válidas no select", () => {
      const { container } = makeSelect2Container([]);
      // Select has only the empty option
      const result = select2Adapter.fill(container, "any");
      expect(result).toBe(false);
    });

    it("dispara evento change no select ao preencher", () => {
      const { container, select } = makeSelect2Container([
        { value: "opt1", text: "Option 1" },
      ]);

      const events: string[] = [];
      select.addEventListener("change", () => events.push("change"));

      select2Adapter.fill(container, "opt1");
      expect(events).toContain("change");
    });

    it("funciona corretamente quando jQuery não está disponível", () => {
      const { container, select } = makeSelect2Container([
        { value: "x", text: "X" },
      ]);

      // Ensure no jQuery
      const win = window as unknown as Record<string, unknown>;
      delete win.jQuery;

      const result = select2Adapter.fill(container, "x");
      expect(result).toBe(true);
      expect(select.value).toBe("x");
    });

    it("usa jQuery.trigger quando disponível", () => {
      const { container } = makeSelect2Container([{ value: "y", text: "Y" }]);

      const triggerMock = vi.fn();
      const win = window as unknown as Record<string, unknown>;
      win.jQuery = vi.fn(() => ({ trigger: triggerMock }));

      select2Adapter.fill(container, "y");
      expect(triggerMock).toHaveBeenCalledWith("change.select2");

      delete win.jQuery;
    });
  });
});
