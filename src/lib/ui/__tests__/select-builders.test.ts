// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import {
  buildFieldTypeOptionsHtml,
  buildGeneratorOptionsHtml,
  buildFieldTypeSelectEntries,
  buildGeneratorSelectEntries,
} from "../select-builders";

describe("select-builders", () => {
  it("buildFieldTypeOptionsHtml returns optgroup HTML", () => {
    const html = buildFieldTypeOptionsHtml();
    expect(html).toContain("<optgroup");
    expect(html).toContain("<option");
  });

  it("buildFieldTypeOptionsHtml marks the selected option when a matching value is passed", () => {
    const html = buildFieldTypeOptionsHtml("email");
    expect(html).toContain('value="email" selected');
  });

  it("buildGeneratorOptionsHtml contains extras and groups", () => {
    const html = buildGeneratorOptionsHtml();
    expect(html).toContain("Automático");
    expect(html).toContain("Chrome AI");
    expect(html).toContain("TensorFlow.js");
    expect(html).toContain("<optgroup");
  });

  it("buildGeneratorOptionsHtml passes selected to field-type groups when not a generator extra", () => {
    // "email" is not in GENERATOR_EXTRA_OPTIONS, so it should be forwarded to buildFieldTypeOptionsHtml
    const html = buildGeneratorOptionsHtml("email");
    expect(html).toContain('value="email" selected');
  });

  it("buildFieldTypeSelectEntries returns an array of groups", () => {
    const entries = buildFieldTypeSelectEntries();
    expect(Array.isArray(entries)).toBe(true);
    expect((entries[0] as any).groupLabel).toBeDefined();
  });

  it("buildGeneratorSelectEntries includes extras at the front", () => {
    const entries = buildGeneratorSelectEntries();
    expect((entries[0] as any).value).toBe("auto");
    expect((entries[1] as any).value).toBe("ai");
  });
});
