import { describe, expect, it } from "vitest";
import {
  parseIncomingMessage,
  parseRulePayload,
  parseSettingsPayload,
  parseIgnoredFieldPayload,
  parseSaveFieldCachePayload,
  parseSavedFormPayload,
  parseStringPayload,
  parseStartWatchingPayload,
} from "@/lib/messaging/validators";

const validRule = {
  id: "rule-1",
  urlPattern: "*example.com*",
  fieldSelector: "#email",
  fieldType: "email",
  generator: "auto",
  priority: 50,
  createdAt: 1000,
  updatedAt: 2000,
};

describe("parseIncomingMessage", () => {
  it("returns parsed object for valid message", () => {
    const result = parseIncomingMessage({ type: "FILL_ALL_FIELDS" });
    expect(result).toEqual({ type: "FILL_ALL_FIELDS" });
  });

  it("includes optional payload when present", () => {
    const result = parseIncomingMessage({
      type: "SAVE_RULE",
      payload: validRule,
    });
    expect(result?.type).toBe("SAVE_RULE");
    expect(result?.payload).toEqual(validRule);
  });

  it("returns null for missing type", () => {
    expect(parseIncomingMessage({ payload: {} })).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(parseIncomingMessage("not-an-object")).toBeNull();
    expect(parseIncomingMessage(null)).toBeNull();
    expect(parseIncomingMessage(42)).toBeNull();
  });

  it("returns null for empty-string type", () => {
    expect(parseIncomingMessage({ type: "" })).toBeNull();
  });
});

describe("parseRulePayload", () => {
  it("returns FieldRule for a valid payload", () => {
    const result = parseRulePayload(validRule);
    expect(result?.id).toBe("rule-1");
    expect(result?.fieldType).toBe("email");
  });

  it("returns null when required fields are missing", () => {
    expect(parseRulePayload({ id: "rule-1" })).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(parseRulePayload(null)).toBeNull();
    expect(parseRulePayload("string")).toBeNull();
  });

  it("returns null for unknown extra fields (strict schema)", () => {
    expect(parseRulePayload({ ...validRule, unknownField: "oops" })).toBeNull();
  });

  it("returns null for invalid fieldType", () => {
    expect(
      parseRulePayload({ ...validRule, fieldType: "not-a-valid-type" }),
    ).toBeNull();
  });
});

describe("parseSettingsPayload", () => {
  it("accepts a partial valid settings object", () => {
    const result = parseSettingsPayload({ autoFillOnLoad: true });
    expect(result?.autoFillOnLoad).toBe(true);
  });

  it("accepts an empty object (all partial)", () => {
    expect(parseSettingsPayload({})).toEqual({});
  });

  it("returns null for extra/unknown fields (strict)", () => {
    expect(parseSettingsPayload({ unknownKey: "value" })).toBeNull();
  });

  it("returns null for invalid enum value", () => {
    expect(
      parseSettingsPayload({ defaultStrategy: "not-valid-enum" }),
    ).toBeNull();
  });
});

describe("parseIgnoredFieldPayload", () => {
  const valid = {
    urlPattern: "*example.com*",
    selector: "#field",
    label: "Email",
  };

  it("returns parsed object for valid payload", () => {
    expect(parseIgnoredFieldPayload(valid)).toEqual(valid);
  });

  it("returns null when selector is missing", () => {
    expect(parseIgnoredFieldPayload({ urlPattern: "*", label: "" })).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(parseIgnoredFieldPayload(null)).toBeNull();
  });
});

describe("parseSaveFieldCachePayload", () => {
  const validCache = {
    url: "https://example.com",
    fields: [
      {
        selector: "#email",
        fieldType: "email",
        label: "Email",
      },
    ],
  };

  it("returns payload for valid input", () => {
    const result = parseSaveFieldCachePayload(validCache);
    expect(result?.url).toBe("https://example.com");
    expect(result?.fields).toHaveLength(1);
  });

  it("returns null when url is missing", () => {
    expect(parseSaveFieldCachePayload({ fields: [] })).toBeNull();
  });

  it("returns null for invalid field structure", () => {
    expect(
      parseSaveFieldCachePayload({
        url: "https://example.com",
        fields: [{ selector: false }],
      }),
    ).toBeNull();
  });
});

describe("parseSavedFormPayload", () => {
  const validForm = {
    id: "form-1",
    name: "Test Form",
    urlPattern: "*example.com*",
    fields: { email: "user@example.com" },
    createdAt: 1000,
    updatedAt: 2000,
  };

  it("returns SavedForm for valid payload", () => {
    const result = parseSavedFormPayload(validForm);
    expect(result?.id).toBe("form-1");
    expect(result?.fields.email).toBe("user@example.com");
  });

  it("returns null for missing required fields", () => {
    expect(parseSavedFormPayload({ id: "form-1" })).toBeNull();
  });

  it("returns null for extra fields (strict schema)", () => {
    expect(parseSavedFormPayload({ ...validForm, extra: "field" })).toBeNull();
  });
});

describe("parseStringPayload", () => {
  it("returns the string for a non-empty input", () => {
    expect(parseStringPayload("hello")).toBe("hello");
  });

  it("returns null for empty string", () => {
    expect(parseStringPayload("")).toBeNull();
  });

  it("returns null for non-string inputs", () => {
    expect(parseStringPayload(42)).toBeNull();
    expect(parseStringPayload(null)).toBeNull();
    expect(parseStringPayload({})).toBeNull();
  });
});

describe("parseStartWatchingPayload", () => {
  it("returns {} when input is undefined", () => {
    expect(parseStartWatchingPayload(undefined)).toEqual({});
  });

  it("returns object with autoRefill=true", () => {
    expect(parseStartWatchingPayload({ autoRefill: true })).toEqual({
      autoRefill: true,
    });
  });

  it("returns object with all optional fields", () => {
    const input = { autoRefill: true, debounceMs: 300, shadowDOM: true };
    expect(parseStartWatchingPayload(input)).toEqual(input);
  });

  it("returns object with debounceMs only", () => {
    expect(parseStartWatchingPayload({ debounceMs: 1000 })).toEqual({
      debounceMs: 1000,
    });
  });

  it("returns null for debounceMs below 100", () => {
    expect(parseStartWatchingPayload({ debounceMs: 50 })).toBeNull();
  });

  it("returns null for debounceMs above 5000", () => {
    expect(parseStartWatchingPayload({ debounceMs: 10000 })).toBeNull();
  });

  it("returns null for non-integer debounceMs", () => {
    expect(parseStartWatchingPayload({ debounceMs: 100.5 })).toBeNull();
  });

  it("returns null for invalid input", () => {
    expect(parseStartWatchingPayload("invalid")).toBeNull();
  });

  it("returns null for extra fields (strict schema)", () => {
    expect(
      parseStartWatchingPayload({ autoRefill: true, extra: "field" }),
    ).toBeNull();
  });
});
