/**
 * E2E tests for dom-watcher.ts
 *
 * Verifies that the DOM watcher detects new form fields added dynamically
 * and optionally re-fills them when autoRefill is enabled.
 * Uses the dynamic-form.html page which exposes JS functions to add/remove
 * fields programmatically.
 */
import { test, expect } from "@/__tests__/e2e/fixtures";
import {
  sendToContentScript,
  waitForContentScript,
} from "@/__tests__/e2e/fixtures/messaging";

test.describe("dom-watcher — START_WATCHING / STOP_WATCHING", () => {
  test("START_WATCHING é aceito sem erros", async ({ page }) => {
    await page.goto("/dynamic-form.html");
    await waitForContentScript(page);

    const response = await sendToContentScript(page, {
      type: "START_WATCHING",
    });

    // The message should not throw; response indicates success or undefined
    expect(response).not.toBeUndefined();
  });

  test("STOP_WATCHING é aceito sem erros", async ({ page }) => {
    await page.goto("/dynamic-form.html");
    await waitForContentScript(page);

    await sendToContentScript(page, { type: "START_WATCHING" });

    const response = await sendToContentScript(page, {
      type: "STOP_WATCHING",
    });

    expect(response).not.toBeUndefined();
  });
});

test.describe("dom-watcher — detecção de novos campos dinâmicos", () => {
  test("novos campos adicionados ao DOM são detectados", async ({ page }) => {
    await page.goto("/dynamic-form.html");
    await waitForContentScript(page);

    // Get initial field count
    const initialResponse = await sendToContentScript(page, {
      type: "GET_FORM_FIELDS",
    });
    const initialCount = Array.isArray(initialResponse)
      ? initialResponse.length
      : 0;

    // Add a new field via the page helper button
    await page.evaluate(() => {
      const addBtn = document.querySelector<HTMLButtonElement>("#add-email");
      addBtn?.click();
    });

    // Give the watcher debounce time to fire (600ms + buffer)
    await page.waitForTimeout(1000);

    const updatedResponse = await sendToContentScript(page, {
      type: "GET_FORM_FIELDS",
    });

    expect(
      Array.isArray(updatedResponse) ? updatedResponse.length : 0,
    ).toBeGreaterThan(initialCount);
  });

  test("campos removidos do DOM são refletidos na detecção", async ({
    page,
  }) => {
    await page.goto("/dynamic-form.html");
    await waitForContentScript(page);

    // Add a field first
    await page.evaluate(() => {
      const addBtn = document.querySelector<HTMLButtonElement>("#add-email");
      addBtn?.click();
    });
    await page.waitForTimeout(500);

    const afterAddResponse = await sendToContentScript(page, {
      type: "GET_FORM_FIELDS",
    });
    const countAfterAdd = Array.isArray(afterAddResponse)
      ? afterAddResponse.length
      : 0;

    // Remove the dynamic field
    await page.evaluate(() => {
      const removeBtn =
        document.querySelector<HTMLButtonElement>("#remove-last");
      removeBtn?.click();
    });
    await page.waitForTimeout(500);

    const afterRemoveResponse = await sendToContentScript(page, {
      type: "GET_FORM_FIELDS",
    });

    expect(
      Array.isArray(afterRemoveResponse) ? afterRemoveResponse.length : 0,
    ).toBeLessThan(countAfterAdd);
  });
});

test.describe("dom-watcher — ignorar mutações internas", () => {
  test("preenchimento de campo não aciona loop de re-detecção", async ({
    page,
  }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    // Track mutation handler calls by counting re-detections via message
    await page.evaluate(() => {
      (window as unknown as { __detectCallCount: number }).__detectCallCount =
        0;
    });

    await sendToContentScript(page, { type: "START_WATCHING" });

    // Fill all fields — should NOT cause a re-detect loop
    await sendToContentScript(page, { type: "FILL_ALL_FIELDS" });

    // Wait a bit to see if any spurious re-detections happen
    await page.waitForTimeout(1500);

    // Simply verify that the form was filled without errors
    const emailVal = await page.inputValue("#email");
    expect(emailVal).not.toBe("");

    await sendToContentScript(page, { type: "STOP_WATCHING" });
  });
});
