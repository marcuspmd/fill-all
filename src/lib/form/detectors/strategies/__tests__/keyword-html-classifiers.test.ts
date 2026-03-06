// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { keywordClassifier } from "../keyword-classifier";
import { detectBasicType, htmlTypeDetector } from "../../html-type-detector";
import { htmlFallbackClassifier } from "../html-fallback-classifier";
import { htmlTypeClassifier } from "../html-type-classifier";
import type { FormField } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeField(
  signals: string,
  overrides: Partial<FormField> = {},
): FormField {
  const el = document.createElement("input");
  el.type = "text";
  return {
    element: el,
    selector: "#f",
    category: "unknown",
    fieldType: "unknown",
    label: "",
    name: "",
    id: "",
    placeholder: "",
    required: false,
    contextSignals: signals,
    ...overrides,
  };
}

// ── keywordClassifier ─────────────────────────────────────────────────────────
// keywordClassifier only covers text/description patterns – all other field
// types are handled by the TensorFlow or HTML-type classifiers.

describe("keywordClassifier", () => {
  it("has name keyword", () => {
    expect(keywordClassifier.name).toBe("keyword");
  });

  it("returns null for empty signals", () => {
    expect(keywordClassifier.detect(makeField(""))).toBeNull();
  });

  it("returns null for blank signals", () => {
    expect(keywordClassifier.detect(makeField("   "))).toBeNull();
  });

  it("returns null when no pattern matches", () => {
    expect(
      keywordClassifier.detect(makeField("campo sem padrao xyzw")),
    ).toBeNull();
  });

  // ── text patterns ─────────────────────────────────────────────────────────

  it("matches observacao → text with confidence 1", () => {
    const r = keywordClassifier.detect(makeField("observacao adicional"));
    expect(r?.type).toBe("text");
    expect(r?.confidence).toBe(1.0);
  });

  it("matches observacoes → text", () => {
    const r = keywordClassifier.detect(makeField("observacoes do campo"));
    expect(r?.type).toBe("text");
  });

  it("matches descricao → text", () => {
    const r = keywordClassifier.detect(makeField("descricao do produto"));
    expect(r?.type).toBe("text");
  });

  it("matches mensagem → text", () => {
    const r = keywordClassifier.detect(makeField("mensagem para o cliente"));
    expect(r?.type).toBe("text");
  });

  it("matches message (english) → text", () => {
    const r = keywordClassifier.detect(makeField("message body here"));
    expect(r?.type).toBe("text");
  });

  it("matches comentario → text", () => {
    const r = keywordClassifier.detect(makeField("comentario extra"));
    expect(r?.type).toBe("text");
  });

  it("matches comentarios → text", () => {
    const r = keywordClassifier.detect(makeField("comentarios usuarios"));
    expect(r?.type).toBe("text");
  });

  it("matches anotacao → text", () => {
    const r = keywordClassifier.detect(makeField("anotacao interna"));
    expect(r?.type).toBe("text");
  });

  it("matches anotacoes → text", () => {
    const r = keywordClassifier.detect(makeField("anotacoes gerais"));
    expect(r?.type).toBe("text");
  });

  it("matches notas → text", () => {
    const r = keywordClassifier.detect(makeField("notas do pedido"));
    expect(r?.type).toBe("text");
  });

  it("matches sugestao → text", () => {
    const r = keywordClassifier.detect(makeField("sua sugestao aqui"));
    expect(r?.type).toBe("text");
  });

  it("matches sugestoes → text", () => {
    const r = keywordClassifier.detect(makeField("sugestoes de melhoria"));
    expect(r?.type).toBe("text");
  });

  it("matches feedback → text", () => {
    const r = keywordClassifier.detect(makeField("feedback do usuario"));
    expect(r?.type).toBe("text");
  });

  it("matches detalhe → text", () => {
    const r = keywordClassifier.detect(makeField("detalhe adicional"));
    expect(r?.type).toBe("text");
  });

  it("matches detalhes → text", () => {
    const r = keywordClassifier.detect(makeField("detalhes do contrato"));
    expect(r?.type).toBe("text");
  });

  it("matches historico → text", () => {
    const r = keywordClassifier.detect(makeField("historico de alteracoes"));
    expect(r?.type).toBe("text");
  });

  // ── "obs" whole-word rule ──────────────────────────────────────────────────

  it("matches obs whole word → text", () => {
    const r = keywordClassifier.detect(makeField("obs"));
    expect(r?.type).toBe("text");
  });

  it("matches obs at start of string → text", () => {
    const r = keywordClassifier.detect(makeField("obs importante"));
    expect(r?.type).toBe("text");
  });

  it("matches obs at end of string → text", () => {
    const r = keywordClassifier.detect(makeField("campo obs"));
    expect(r?.type).toBe("text");
  });

  it("does not match obs inside another word (observar)", () => {
    // 'obs' must be a whole word; 'observar' has extra letters after
    const r = keywordClassifier.detect(makeField("observar algo"));
    // observar contains 'observar' not in our pattern list and 'obs' is inside 'observar'
    // The regex uses negative lookahead, so it should NOT match
    expect(r?.type).not.toBe("text");
  });

  // ── Diacritics / separator normalisation ──────────────────────────────────

  it("normalizes diacritics: descrição → descricao → text", () => {
    const r = keywordClassifier.detect(makeField("descrição do produto"));
    expect(r?.type).toBe("text");
  });

  it("normalizes diacritics: observação → observacao → text", () => {
    const r = keywordClassifier.detect(makeField("observação do campo"));
    expect(r?.type).toBe("text");
  });

  it("normalizes separator hyphen in obs-field", () => {
    const r = keywordClassifier.detect(makeField("obs-campo"));
    // 'obs-campo' → 'obs campo' → wholeWord 'obs' matches
    expect(r?.type).toBe("text");
  });

  it("normalizes separator underscore in obs_field", () => {
    const r = keywordClassifier.detect(makeField("obs_campo"));
    // 'obs_campo' → 'obs campo' → wholeWord 'obs' matches
    expect(r?.type).toBe("text");
  });

  it("is case-insensitive (OBSERVACAO)", () => {
    const r = keywordClassifier.detect(makeField("OBSERVACAO"));
    expect(r?.type).toBe("text");
  });

  it("falls back to empty string when contextSignals is undefined", () => {
    // Tests the `??` branch where contextSignals is null/undefined
    const input = document.createElement("input");
    input.type = "text";
    const field = {
      element: input,
      type: "text",
      name: "obs",
      id: "obs",
      label: "obs",
      selector: "#obs",
      contextSignals: undefined,
    } as unknown as import("@/types").FormField;
    // With undefined contextSignals the raw is "" → trimmed is "" → returns null
    expect(keywordClassifier.detect(field)).toBeNull();
  });
});

// ── detectBasicType ───────────────────────────────────────────────────────────

describe("detectBasicType", () => {
  it("maps HTMLSelectElement to select", () => {
    const el = document.createElement("select");
    const r = detectBasicType(el);
    expect(r.type).toBe("select");
    expect(r.method).toBe("html-type");
  });

  it("maps HTMLTextAreaElement to unknown", () => {
    const el = document.createElement("textarea");
    const r = detectBasicType(el);
    expect(r.type).toBe("unknown");
    expect(r.method).toBe("html-type");
  });

  it("maps input[type=checkbox] to checkbox", () => {
    const el = document.createElement("input");
    el.type = "checkbox";
    expect(detectBasicType(el).type).toBe("checkbox");
  });

  it("maps input[type=radio] to radio", () => {
    const el = document.createElement("input");
    el.type = "radio";
    expect(detectBasicType(el).type).toBe("radio");
  });

  it("maps input[type=email] to email", () => {
    const el = document.createElement("input");
    el.type = "email";
    expect(detectBasicType(el).type).toBe("email");
  });

  it("maps input[type=tel] to phone", () => {
    const el = document.createElement("input");
    el.type = "tel";
    expect(detectBasicType(el).type).toBe("phone");
  });

  it("maps input[type=password] to password", () => {
    const el = document.createElement("input");
    el.type = "password";
    expect(detectBasicType(el).type).toBe("password");
  });

  it("maps input[type=number] to number", () => {
    const el = document.createElement("input");
    el.type = "number";
    expect(detectBasicType(el).type).toBe("number");
  });

  it("maps input[type=date] to date", () => {
    const el = document.createElement("input");
    el.type = "date";
    expect(detectBasicType(el).type).toBe("date");
  });

  it("maps input[type=time] to date", () => {
    const el = document.createElement("input");
    el.type = "time";
    expect(detectBasicType(el).type).toBe("date");
  });

  it("maps input[type=datetime-local] to date", () => {
    const el = document.createElement("input");
    el.type = "datetime-local";
    expect(detectBasicType(el).type).toBe("date");
  });

  it("maps input[type=month] to date", () => {
    const el = document.createElement("input");
    el.type = "month";
    expect(detectBasicType(el).type).toBe("date");
  });

  it("maps input[type=week] to date", () => {
    const el = document.createElement("input");
    el.type = "week";
    expect(detectBasicType(el).type).toBe("date");
  });

  it("maps input[type=url] to website", () => {
    const el = document.createElement("input");
    el.type = "url";
    expect(detectBasicType(el).type).toBe("website");
  });

  it("maps input[type=search] to text", () => {
    const el = document.createElement("input");
    el.type = "search";
    expect(detectBasicType(el).type).toBe("text");
  });

  it("maps input[type=range] to number", () => {
    const el = document.createElement("input");
    el.type = "range";
    expect(detectBasicType(el).type).toBe("number");
  });

  it("maps input[type=text] to unknown (ambiguous)", () => {
    const el = document.createElement("input");
    el.type = "text";
    expect(detectBasicType(el).type).toBe("unknown");
  });

  it("maps unknown input type to unknown", () => {
    const el = document.createElement("input");
    (el as HTMLInputElement).type = "color";
    expect(detectBasicType(el).type).toBe("unknown");
  });
});

// ── htmlTypeDetector object ───────────────────────────────────────────────────

describe("htmlTypeDetector", () => {
  it("has name html-type", () => {
    expect(htmlTypeDetector.name).toBe("html-type");
  });

  it("detects email input", () => {
    const el = document.createElement("input");
    el.type = "email";
    const r = htmlTypeDetector.detect(el);
    expect(r.type).toBe("email");
  });
});

// ── htmlTypeClassifier ────────────────────────────────────────────────────────

describe("htmlTypeClassifier", () => {
  it("has name html-type", () => {
    expect(htmlTypeClassifier.name).toBe("html-type");
  });

  it("returns null for a non-native element (div)", () => {
    const el = document.createElement("div");
    const field = makeField("", { element: el });
    expect(htmlTypeClassifier.detect(field)).toBeNull();
  });

  it("returns null for input[type=text] (ambiguous / unknown)", () => {
    const field = makeField("");
    expect(htmlTypeClassifier.detect(field)).toBeNull();
  });

  it("returns confidence 1 for input[type=email]", () => {
    const el = document.createElement("input");
    el.type = "email";
    const field = makeField("", { element: el });
    const result = htmlTypeClassifier.detect(field);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("email");
    expect(result!.confidence).toBe(1.0);
  });
});

// ── htmlFallbackClassifier ────────────────────────────────────────────────────

describe("htmlFallbackClassifier", () => {
  it("has name html-fallback", () => {
    expect(htmlFallbackClassifier.name).toBe("html-fallback");
  });

  it("maps input[type=email] to email", () => {
    const el = document.createElement("input");
    el.type = "email";
    const field = makeField("", { element: el });
    const result = htmlFallbackClassifier.detect(field)!;
    expect(result.type).toBe("email");
  });

  it("returns unknown for input[type=text] (not in fallback map)", () => {
    const field = makeField("");
    const result = htmlFallbackClassifier.detect(field)!;
    expect(result.type).toBe("unknown");
  });

  it("returns unknown for a non-input element (no type attribute)", () => {
    const el = document.createElement("div");
    const field = makeField("", { element: el });
    const result = htmlFallbackClassifier.detect(field)!;
    expect(result.type).toBe("unknown");
  });
});
