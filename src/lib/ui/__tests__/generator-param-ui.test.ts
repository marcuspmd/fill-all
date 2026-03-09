// @vitest-environment happy-dom
import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  collectGeneratorParams,
  renderGeneratorParamField,
  renderGeneratorParamFields,
} from "../generator-param-ui";
import type { GeneratorParamDef } from "@/types/field-type-definitions";

describe("generator-param-ui", () => {
  beforeEach(() => {
    // Mock chrome.i18n for tests
    const messageMap: Record<string, string> = {
      paramSectionTitle: "Parâmetros do Gerador",
      firstName: "Nome",
      lastName: "Sobrenome",
      customParamLabel: "Parâmetro Customizado",
    };

    vi.stubGlobal("chrome", {
      i18n: {
        getMessage: vi.fn((key: string) => messageMap[key] || key),
      },
    });
  });

  describe("collectGeneratorParams", () => {
    it("collects text input parameters", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <input type="text" data-param-key="firstName" value="João" />
      `;

      const result = collectGeneratorParams(container);
      expect(result).toEqual({ firstName: "João" });
    });

    it("collects number input parameters", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <input type="number" data-param-key="age" value="25" />
      `;

      const result = collectGeneratorParams(container);
      expect(result).toEqual({ age: 25 });
    });

    it("collects checkbox parameters as boolean", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <input type="checkbox" data-param-key="includeSymbols" checked />
      `;

      const result = collectGeneratorParams(container);
      expect(result).toEqual({ includeSymbols: true });
    });

    it("collects checkbox unchecked as false", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <input type="checkbox" data-param-key="includeSymbols" />
      `;

      const result = collectGeneratorParams(container);
      expect(result).toEqual({ includeSymbols: false });
    });

    it("collects select parameters", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <select data-param-key="format">
          <option value="full" selected>Full</option>
          <option value="short">Short</option>
        </select>
      `;

      const result = collectGeneratorParams(container);
      expect(result).toEqual({ format: "full" });
    });

    it("collects multiple parameters together", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <input type="text" data-param-key="firstName" value="Maria" />
        <input type="number" data-param-key="length" value="10" />
        <input type="checkbox" data-param-key="uppercase" checked />
      `;

      const result = collectGeneratorParams(container);
      expect(result).toEqual({
        firstName: "Maria",
        length: 10,
        uppercase: true,
      });
    });

    it("ignores empty text inputs", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <input type="text" data-param-key="firstName" value="" />
        <input type="text" data-param-key="lastName" value="Silva" />
      `;

      const result = collectGeneratorParams(container);
      expect(result).toEqual({ lastName: "Silva" });
    });

    it("ignores NaN number inputs", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <input type="number" data-param-key="length" value="abc" />
      `;

      const result = collectGeneratorParams(container);
      expect(result).toBeUndefined();
    });

    it("returns undefined when no params found", () => {
      const container = document.createElement("div");
      container.innerHTML = `<p>no inputs</p>`;

      const result = collectGeneratorParams(container);
      expect(result).toBeUndefined();
    });

    it("handles empty container gracefully", () => {
      const result = collectGeneratorParams(document.createElement("div"));
      expect(result).toBeUndefined();
    });
  });

  describe("renderGeneratorParamField", () => {
    it("renders text input field", () => {
      const def: GeneratorParamDef = {
        key: "firstName",
        labelKey: "firstName",
        type: "text",
        defaultValue: "João",
      };

      const html = renderGeneratorParamField(def, undefined);
      expect(html).toContain('type="text"');
      expect(html).toContain('data-param-key="firstName"');
      expect(html).toContain('value="João"');
      expect(html).toContain('class="form-group param-field"');
    });

    it("renders number input field with constraints", () => {
      const def: GeneratorParamDef = {
        key: "length",
        labelKey: "length",
        type: "number",
        defaultValue: 10,
        min: 1,
        max: 50,
        step: 1,
      };

      const html = renderGeneratorParamField(def, undefined);
      expect(html).toContain('type="number"');
      expect(html).toContain('min="1"');
      expect(html).toContain('max="50"');
      expect(html).toContain('step="1"');
    });

    it("renders boolean checkbox field", () => {
      const def: GeneratorParamDef = {
        key: "includeSymbols",
        labelKey: "includeSymbols",
        type: "boolean",
        defaultValue: true,
      };

      const html = renderGeneratorParamField(def, undefined);
      expect(html).toContain('type="checkbox"');
      expect(html).toContain("checked");
      expect(html).toContain('class="param-toggle"');
    });

    it("renders boolean checkbox unchecked", () => {
      const def: GeneratorParamDef = {
        key: "includeSymbols",
        labelKey: "includeSymbols",
        type: "boolean",
        defaultValue: false,
      };

      const html = renderGeneratorParamField(def, undefined);
      expect(html).toContain('type="checkbox"');
      expect(html).not.toContain("checked");
    });

    it("renders select field with options", () => {
      const def: GeneratorParamDef = {
        key: "format",
        labelKey: "format",
        type: "select",
        defaultValue: "full",
        selectOptions: [
          { value: "full", labelKey: "format_full" },
          { value: "short", labelKey: "format_short" },
        ],
      };

      const html = renderGeneratorParamField(def, undefined);
      expect(html).toContain('data-param-key="format"');
      expect(html).toContain('<option value="full" selected>');
      expect(html).toContain('<option value="short">');
    });

    it("applies prefix to classes", () => {
      const def: GeneratorParamDef = {
        key: "firstName",
        labelKey: "firstName",
        type: "text",
        defaultValue: "",
      };

      const html = renderGeneratorParamField(def, undefined, {
        prefix: "fa-rp-",
      });
      expect(html).toContain('class="fa-rp-form-group fa-rp-param-field"');
      expect(html).toContain('class="fa-rp-param-label"');
      expect(html).toContain('class="fa-rp-input fa-rp-param-input"');
    });

    it("uses currentValue over defaultValue", () => {
      const def: GeneratorParamDef = {
        key: "firstName",
        labelKey: "firstName",
        type: "text",
        defaultValue: "João",
      };

      const html = renderGeneratorParamField(def, "Maria");
      expect(html).toContain('value="Maria"');
      expect(html).not.toContain('value="João"');
    });

    it("escapes HTML in label and values", () => {
      const def: GeneratorParamDef = {
        key: "firstName",
        labelKey: "firstName",
        type: "text",
        defaultValue: "<script>alert(1)</script>",
      };

      const html = renderGeneratorParamField(def, undefined);
      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
    });
  });

  describe("renderGeneratorParamFields", () => {
    it("renders multiple param fields", () => {
      const defs: GeneratorParamDef[] = [
        {
          key: "firstName",
          labelKey: "firstName",
          type: "text",
          defaultValue: "",
        },
        {
          key: "length",
          labelKey: "length",
          type: "number",
          defaultValue: 10,
        },
      ];

      const html = renderGeneratorParamFields(defs);
      expect(html).toContain('data-param-key="firstName"');
      expect(html).toContain('data-param-key="length"');
    });

    it("includes title when requested", () => {
      const defs: GeneratorParamDef[] = [
        {
          key: "firstName",
          labelKey: "firstName",
          type: "text",
          defaultValue: "",
        },
      ];

      const html = renderGeneratorParamFields(defs, undefined, {
        includeTitle: true,
      });
      expect(html).toContain("param-title");
      expect(html).toContain("Parâmetros do Gerador");
    });

    it("does not include title by default", () => {
      const defs: GeneratorParamDef[] = [
        {
          key: "firstName",
          labelKey: "firstName",
          type: "text",
          defaultValue: "",
        },
      ];

      const html = renderGeneratorParamFields(defs);
      expect(html).not.toContain("param-title");
    });

    it("passes existing params as currentValue", () => {
      const defs: GeneratorParamDef[] = [
        {
          key: "firstName",
          labelKey: "firstName",
          type: "text",
          defaultValue: "João",
        },
      ];
      const existingParams = { firstName: "Maria" };

      const html = renderGeneratorParamFields(defs, existingParams);
      expect(html).toContain('value="Maria"');
      expect(html).not.toContain('value="João"');
    });

    it("applies prefix to all fields", () => {
      const defs: GeneratorParamDef[] = [
        {
          key: "firstName",
          labelKey: "firstName",
          type: "text",
          defaultValue: "",
        },
      ];

      const html = renderGeneratorParamFields(defs, undefined, {
        prefix: "test-",
      });
      expect(html).toContain("test-form-group");
      expect(html).toContain("test-param-field");
    });
  });
});
