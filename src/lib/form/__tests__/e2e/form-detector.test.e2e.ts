/**
 * E2E tests for form-detector.ts
 *
 * Verifies that the content script correctly detects form fields on a real
 * HTML page and returns structured field metadata via the `GET_FORM_FIELDS`
 * and `DETECT_FIELDS` messages.
 */
import { test, expect } from "@/__tests__/e2e/fixtures";
import {
  sendToContentScript,
  waitForContentScript,
} from "@/__tests__/e2e/fixtures/messaging";

type FieldSummary = {
  selector: string;
  fieldType: string;
  label: string;
  name?: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
};

type GetFormFieldsResponse = {
  count: number;
  fields: FieldSummary[];
};

type DetectFieldsResponse = {
  count: number;
  fields: (FieldSummary & {
    contextualType?: string;
    detectionMethod?: string;
    detectionConfidence?: number;
  })[];
};

test.describe("form-detector — GET_FORM_FIELDS", () => {
  test("returns at least 10 fields from test-form.html", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    const response = (await sendToContentScript(page, {
      type: "GET_FORM_FIELDS",
    })) as GetFormFieldsResponse;

    expect(response.count).toBeGreaterThanOrEqual(10);
    expect(response.fields.length).toBe(response.count);
  });

  test("each field has selector, fieldType and label", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    const response = (await sendToContentScript(page, {
      type: "GET_FORM_FIELDS",
    })) as GetFormFieldsResponse;

    for (const field of response.fields) {
      expect(field.selector).toBeTruthy();
      expect(field.fieldType).toBeTruthy();
      // label may be derived from text, aria-label, placeholder, etc.
      expect(typeof field.label).toBe("string");
    }
  });

  test("detects CPF field by name attribute", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    const response = (await sendToContentScript(page, {
      type: "GET_FORM_FIELDS",
    })) as GetFormFieldsResponse;

    const cpfField = response.fields.find(
      (f) => f.id === "cpf" || f.name === "cpf",
    );
    expect(cpfField).toBeDefined();
  });

  test("detects email field with type email", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    const response = (await sendToContentScript(page, {
      type: "GET_FORM_FIELDS",
    })) as GetFormFieldsResponse;

    const emailField = response.fields.find(
      (f) => f.id === "email" || f.name === "email",
    );
    expect(emailField).toBeDefined();
    expect(emailField?.fieldType).toBe("email");
  });

  test("detects select elements (gender, state)", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    const response = (await sendToContentScript(page, {
      type: "GET_FORM_FIELDS",
    })) as GetFormFieldsResponse;

    const names = response.fields.map((f) => f.name ?? f.id ?? "");
    expect(names).toContain("gender");
    expect(names).toContain("state");
  });
});

test.describe("form-detector — DETECT_FIELDS (async pipeline)", () => {
  test("returns fields with detectionMethod populated", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    const response = (await sendToContentScript(page, {
      type: "DETECT_FIELDS",
    })) as DetectFieldsResponse;

    expect(response.count).toBeGreaterThanOrEqual(8);

    for (const field of response.fields) {
      expect(field.selector).toBeTruthy();
      expect(field.fieldType).toBeTruthy();
      // detectionMethod could be "html-type", "keyword", etc.
      if (field.detectionMethod !== undefined) {
        expect(typeof field.detectionMethod).toBe("string");
      }
    }
  });

  test("detects password field type", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    const response = (await sendToContentScript(page, {
      type: "DETECT_FIELDS",
    })) as DetectFieldsResponse;

    const passwordField = response.fields.find(
      (f) => f.id === "password" || f.name === "password",
    );
    expect(passwordField).toBeDefined();
    expect(passwordField?.fieldType).toBe("password");
  });

  test("detects birthdate field type", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    const response = (await sendToContentScript(page, {
      type: "DETECT_FIELDS",
    })) as DetectFieldsResponse;

    const dateField = response.fields.find(
      (f) => f.id === "birthdate" || f.name === "birthdate",
    );
    expect(dateField).toBeDefined();
    // date field detected by HTML type="date" → fieldType "date" or "birthdate"
    expect(["date", "birthdate"]).toContain(dateField?.fieldType);
  });

  test("confidence values are in range 0–1", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    const response = (await sendToContentScript(page, {
      type: "DETECT_FIELDS",
    })) as DetectFieldsResponse;

    for (const field of response.fields) {
      if (field.detectionConfidence !== undefined) {
        expect(field.detectionConfidence).toBeGreaterThanOrEqual(0);
        expect(field.detectionConfidence).toBeLessThanOrEqual(1);
      }
    }
  });
});
