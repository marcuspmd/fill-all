import { describe, expect, it } from "vitest";
import {
  parseIncomingMessage,
  parseStringPayload,
  parseStartWatchingPayload,
  parseSavedFormPayload,
  parseApplyTemplatePayload,
} from "@/lib/messaging/light-validators";

const validForm = {
  id: "form-1",
  name: "Test Form",
  urlPattern: "*example.com*",
  fields: { email: "user@example.com" },
  createdAt: 1000,
  updatedAt: 2000,
};

describe("parseIncomingMessage (light)", () => {
  it("returns parsed message for valid input", () => {
    const result = parseIncomingMessage({ type: "FILL_ALL_FIELDS" });
    expect(result).toEqual({ type: "FILL_ALL_FIELDS" });
  });

  it("includes payload when present", () => {
    const result = parseIncomingMessage({ type: "GET_RULES", payload: {} });
    expect(result?.type).toBe("GET_RULES");
    expect(result?.payload).toEqual({});
  });

  it("returns null for non-objects", () => {
    expect(parseIncomingMessage(null)).toBeNull();
    expect(parseIncomingMessage("string")).toBeNull();
    expect(parseIncomingMessage(42)).toBeNull();
  });

  it("returns null when type is missing", () => {
    expect(parseIncomingMessage({ payload: {} })).toBeNull();
  });

  it("returns null when type is empty string", () => {
    expect(parseIncomingMessage({ type: "" })).toBeNull();
  });
});

describe("parseStringPayload (light)", () => {
  it("returns string for valid non-empty input", () => {
    expect(parseStringPayload("hello")).toBe("hello");
  });

  it("returns null for empty string", () => {
    expect(parseStringPayload("")).toBeNull();
  });

  it("returns null for non-string types", () => {
    expect(parseStringPayload(null)).toBeNull();
    expect(parseStringPayload(undefined)).toBeNull();
    expect(parseStringPayload(123)).toBeNull();
    expect(parseStringPayload({})).toBeNull();
  });
});

describe("parseStartWatchingPayload (light)", () => {
  it("returns {} when input is undefined", () => {
    expect(parseStartWatchingPayload(undefined)).toEqual({});
  });

  it("returns object with autoRefill=true", () => {
    expect(parseStartWatchingPayload({ autoRefill: true })).toEqual({
      autoRefill: true,
    });
  });

  it("returns object with autoRefill=false", () => {
    expect(parseStartWatchingPayload({ autoRefill: false })).toEqual({
      autoRefill: false,
    });
  });

  it("returns {} when autoRefill is undefined", () => {
    expect(parseStartWatchingPayload({})).toEqual({});
  });

  it("returns null for non-object input", () => {
    expect(parseStartWatchingPayload("invalid")).toBeNull();
    expect(parseStartWatchingPayload(42)).toBeNull();
  });

  it("returns null when autoRefill is not a boolean", () => {
    expect(parseStartWatchingPayload({ autoRefill: "yes" })).toBeNull();
  });
});

describe("parseSavedFormPayload (light)", () => {
  it("returns SavedForm for valid input", () => {
    const result = parseSavedFormPayload(validForm);
    expect(result?.id).toBe("form-1");
    expect(result?.fields.email).toBe("user@example.com");
  });

  it("returns null for non-object input", () => {
    expect(parseSavedFormPayload(null)).toBeNull();
    expect(parseSavedFormPayload("string")).toBeNull();
  });

  it("returns null when id is missing", () => {
    const { id: _id, ...withoutId } = validForm;
    expect(parseSavedFormPayload(withoutId)).toBeNull();
  });

  it("returns null when name is missing", () => {
    const { name: _name, ...withoutName } = validForm;
    expect(parseSavedFormPayload(withoutName)).toBeNull();
  });

  it("returns null when fields has non-string values", () => {
    expect(
      parseSavedFormPayload({ ...validForm, fields: { email: 42 } }),
    ).toBeNull();
  });

  it("returns null when fields is not an object", () => {
    expect(
      parseSavedFormPayload({ ...validForm, fields: "invalid" }),
    ).toBeNull();
  });

  it("preserves optional templateFields array", () => {
    const withTemplate = {
      ...validForm,
      templateFields: [
        { key: "email", label: "Email", mode: "fixed", fixedValue: "a@b.com" },
      ],
    };
    const result = parseSavedFormPayload(withTemplate);
    expect(result?.templateFields).toHaveLength(1);
  });

  it("sets templateFields to undefined when not an array", () => {
    const result = parseSavedFormPayload({
      ...validForm,
      templateFields: "not-array",
    });
    expect(result?.templateFields).toBeUndefined();
  });
});

describe("parseApplyTemplatePayload (light)", () => {
  it("delegates to parseSavedFormPayload — valid input", () => {
    const result = parseApplyTemplatePayload(validForm);
    expect(result?.id).toBe("form-1");
  });

  it("delegates to parseSavedFormPayload — invalid input returns null", () => {
    expect(parseApplyTemplatePayload(null)).toBeNull();
  });
});
