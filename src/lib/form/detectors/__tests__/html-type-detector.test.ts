// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { detectBasicType, htmlTypeDetector } from "../html-type-detector";

function makeInput(type: string): HTMLInputElement {
  const el = document.createElement("input");
  el.type = type;
  return el;
}

describe("detectBasicType", () => {
  it("select → 'select'", () => {
    const el = document.createElement("select");
    expect(detectBasicType(el)).toEqual({
      type: "select",
      method: "html-type",
    });
  });

  it("textarea → 'unknown'", () => {
    const el = document.createElement("textarea");
    expect(detectBasicType(el)).toEqual({
      type: "unknown",
      method: "html-type",
    });
  });

  it("type='checkbox' → 'checkbox'", () => {
    expect(detectBasicType(makeInput("checkbox"))).toEqual({
      type: "checkbox",
      method: "html-type",
    });
  });

  it("type='radio' → 'radio'", () => {
    expect(detectBasicType(makeInput("radio"))).toEqual({
      type: "radio",
      method: "html-type",
    });
  });

  it("type='email' → 'email'", () => {
    expect(detectBasicType(makeInput("email"))).toEqual({
      type: "email",
      method: "html-type",
    });
  });

  it("type='tel' → 'phone'", () => {
    expect(detectBasicType(makeInput("tel"))).toEqual({
      type: "phone",
      method: "html-type",
    });
  });

  it("type='password' → 'password'", () => {
    expect(detectBasicType(makeInput("password"))).toEqual({
      type: "password",
      method: "html-type",
    });
  });

  it("type='number' → 'number'", () => {
    expect(detectBasicType(makeInput("number"))).toEqual({
      type: "number",
      method: "html-type",
    });
  });

  it("type='date' → 'date'", () => {
    expect(detectBasicType(makeInput("date"))).toEqual({
      type: "date",
      method: "html-type",
    });
  });

  it("type='time' → 'date'", () => {
    expect(detectBasicType(makeInput("time"))).toEqual({
      type: "date",
      method: "html-type",
    });
  });

  it("type='datetime-local' → 'date'", () => {
    expect(detectBasicType(makeInput("datetime-local"))).toEqual({
      type: "date",
      method: "html-type",
    });
  });

  it("type='url' → 'website'", () => {
    expect(detectBasicType(makeInput("url"))).toEqual({
      type: "website",
      method: "html-type",
    });
  });

  it("type='search' → 'text'", () => {
    expect(detectBasicType(makeInput("search"))).toEqual({
      type: "text",
      method: "html-type",
    });
  });

  it("type='range' → 'number'", () => {
    expect(detectBasicType(makeInput("range"))).toEqual({
      type: "number",
      method: "html-type",
    });
  });

  it("type='text' → 'unknown' (ambiguous)", () => {
    expect(detectBasicType(makeInput("text"))).toEqual({
      type: "unknown",
      method: "html-type",
    });
  });
});

describe("htmlTypeDetector", () => {
  it("name é 'html-type'", () => {
    expect(htmlTypeDetector.name).toBe("html-type");
  });

  it("detect delega para detectBasicType", () => {
    const el = makeInput("url");
    expect(htmlTypeDetector.detect(el)).toEqual({
      type: "website",
      method: "html-type",
    });
  });
});
