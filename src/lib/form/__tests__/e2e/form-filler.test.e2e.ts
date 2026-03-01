/**
 * E2E tests for form-filler.ts
 *
 * Verifies that `FILL_ALL_FIELDS` and related messages correctly populate
 * inputs, selects, textareas and checkboxes on a real HTML page served by
 * the E2E server (http://localhost:8765/test-form.html).
 */
import { test, expect } from "@/__tests__/e2e/fixtures";
import {
  sendToContentScript,
  waitForContentScript,
} from "@/__tests__/e2e/fixtures/messaging";

test.describe("form-filler — FILL_ALL_FIELDS", () => {
  test("fills text, email, tel and date inputs", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    const response = await sendToContentScript(page, {
      type: "FILL_ALL_FIELDS",
    });

    expect(response).toMatchObject({ success: true });

    await expect(page.locator("#name")).not.toHaveValue("");
    await expect(page.locator("#email")).not.toHaveValue("");
    await expect(page.locator("#phone")).not.toHaveValue("");
    await expect(page.locator("#birthdate")).not.toHaveValue("");
  });

  test("fills address fields (cep, city, state)", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    await sendToContentScript(page, { type: "FILL_ALL_FIELDS" });

    await expect(page.locator("#address")).not.toHaveValue("");
    await expect(page.locator("#cep")).not.toHaveValue("");
    await expect(page.locator("#city")).not.toHaveValue("");
  });

  test("fills password and textarea", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    await sendToContentScript(page, { type: "FILL_ALL_FIELDS" });

    await expect(page.locator("#password")).not.toHaveValue("");
    await expect(page.locator("#message")).not.toHaveValue("");
  });

  test("selects a non-empty option in <select> fields", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    await sendToContentScript(page, { type: "FILL_ALL_FIELDS" });

    const genderValue = await page.locator("#gender").inputValue();
    expect(genderValue).toBeTruthy();
    expect(genderValue).not.toBe("");

    const stateValue = await page.locator("#state").inputValue();
    expect(stateValue).toBeTruthy();
    expect(stateValue).not.toBe("");
  });

  test("returns the count of filled fields", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    const response = (await sendToContentScript(page, {
      type: "FILL_ALL_FIELDS",
    })) as { success: boolean; filled: number };

    expect(response.success).toBe(true);
    // test-form.html has at least 8 visible fields
    expect(response.filled).toBeGreaterThanOrEqual(8);
  });

  test("respects fillEmptyOnly — skips already-filled fields", async ({
    page,
  }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    const existingName = "Nome Existente Teste";
    await page.locator("#name").fill(existingName);

    await sendToContentScript(page, {
      type: "FILL_ALL_FIELDS",
      payload: { fillEmptyOnly: true },
    });

    // Name was pre-filled — should remain unchanged
    await expect(page.locator("#name")).toHaveValue(existingName);

    // Email was empty — should have been filled
    await expect(page.locator("#email")).not.toHaveValue("");
  });

  test("shows a notification div in the page after fill", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    await sendToContentScript(page, { type: "FILL_ALL_FIELDS" });

    const notification = page.locator("#fill-all-notification");
    await expect(notification).toBeVisible({ timeout: 2_000 });
    await expect(notification).toContainText("campos preenchidos");
  });

  test("dispatches input and change events so reactive frameworks detect the change", async ({
    page,
  }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    // Set up event listeners before fill
    await page.evaluate(() => {
      (window as unknown as { __changeCount: number }).__changeCount = 0;
      const emailInput = document.querySelector<HTMLInputElement>("#email");
      emailInput?.addEventListener("input", () => {
        (window as unknown as { __changeCount: number }).__changeCount += 1;
      });
    });

    await sendToContentScript(page, { type: "FILL_ALL_FIELDS" });

    const changeCount = await page.evaluate(
      () => (window as unknown as { __changeCount: number }).__changeCount,
    );
    expect(changeCount).toBeGreaterThanOrEqual(1);
  });
});

test.describe("form-filler — FILL_SINGLE_FIELD", () => {
  test("fills only the focused field when no context-menu target", async ({
    page,
  }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    // Focus the email field so it becomes the single target
    await page.locator("#email").focus();

    const response = await sendToContentScript(page, {
      type: "FILL_SINGLE_FIELD",
    });

    expect(response).toMatchObject({ success: true });

    // Email should be filled
    await expect(page.locator("#email")).not.toHaveValue("");

    // Name (not focused, not targeted) should remain empty
    const nameValue = await page.locator("#name").inputValue();
    expect(nameValue).toBe("");
  });
});
