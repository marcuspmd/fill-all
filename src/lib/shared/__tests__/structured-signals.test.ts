import { describe, expect, it } from "vitest";
import {
  buildFeatureText,
  fromFlatSignals,
  inferLanguageFromSignals,
  inferCategoryFromType,
  normalizeStructuredSignals,
  structuredSignalsFromField,
} from "../structured-signals";
import type { StructuredSignals } from "../structured-signals";

describe("structured-signals", () => {
  it("normalizeStructuredSignals dedupes and normalizes", () => {
    const raw: StructuredSignals = {
      primary: ["Email", "E-Mail", "  email  "],
      secondary: ["email"],
      structural: ["text"],
    };

    const norm = normalizeStructuredSignals(raw);
    expect(norm.primary).toEqual(["email", "e mail"]);
    expect(norm.secondary).toEqual(["email"]);
    expect(norm.structural).toEqual(["text"]);
  });

  it("fromFlatSignals converts string to primary array", () => {
    const sigs = fromFlatSignals("name");
    expect(sigs.primary).toEqual(["name"]);
    expect(sigs.secondary).toEqual([]);
    expect(sigs.structural).toEqual([]);
  });

  it("inferLanguageFromSignals correctly identifies language", () => {
    expect(inferLanguageFromSignals("el correo")).toBe("es");
    expect(inferLanguageFromSignals("your email address")).toBe("en");
    expect(inferLanguageFromSignals("endereço de email")).toBe("en"); // "email" is in the EN heuristic
    expect(inferLanguageFromSignals("nome completo")).toBe("pt"); // fallback is PT
  });

  it("inferCategoryFromType maps types to category", () => {
    expect(inferCategoryFromType("email")).toBe("contact");
    expect(inferCategoryFromType("cpf")).toBe("document");
    // "unknown" if not found, since `FieldType` could theoretically be casted
    expect(inferCategoryFromType("super-unknown" as any)).toBe("unknown");
  });

  it("buildFeatureText builds weighted text", () => {
    const raw: StructuredSignals = {
      primary: ["username"],
      secondary: ["nickname"],
      structural: ["text"],
    };

    // Default weights: primary 3, secondary 2, structural 1
    const txt = buildFeatureText(raw);

    // Check it contains 3 "username", 2 "nickname", 1 "text"
    expect(txt.split(" ").filter((w) => w === "username").length).toBe(3);
    expect(txt.split(" ").filter((w) => w === "nickname").length).toBe(2);
    expect(txt.split(" ").filter((w) => w === "text").length).toBe(1);
  });

  it("structuredSignalsFromField extracts from field object", () => {
    const field = {
      label: "First Name",
      name: "fname",
      id: "first-name",
      autocomplete: "given-name",
      inputType: "text",
      category: "personal" as const,
      languageDetected: "en" as const,
      maxLength: 50,
    };

    const { signals, context } = structuredSignalsFromField(field);

    expect(signals.primary).toContain("first name");
    expect(signals.primary).toContain("fname");
    expect(signals.primary).toContain("first name");

    expect(signals.secondary).toContain("given name");
    expect(signals.structural).toContain("text");
    expect(signals.structural).toContain("maxlength 50");

    expect(context.category).toBe("personal");
    expect(context.language).toBe("en");
    expect(context.domFeatures?.inputType).toBe("text");
    expect(context.domFeatures?.maxLength).toBe(50);
  });
});
