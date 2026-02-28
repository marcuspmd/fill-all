/**
 * E2E tests for field-icon.ts
 *
 * Verifies that the field icon component is rendered in the DOM when the
 * content script initialises, that it follows focused fields, and that
 * clicking the button triggers a single-field fill.
 */
import { test, expect } from "@/__tests__/e2e/fixtures";
import {
  sendToContentScript,
  waitForContentScript,
} from "@/__tests__/e2e/fixtures/messaging";

const ICON_BTN_ID = "#fill-all-field-icon-btn";
const ICON_CONTAINER_ID = "#fill-all-field-icon";

test.describe("field-icon — renderização", () => {
  test("ícone é injetado no DOM ao focar um campo", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    // Focus a text input — should trigger icon injection
    await page.focus("#name");

    // Wait for the icon to be injected (the content script handles focus async)
    await expect(page.locator(ICON_CONTAINER_ID)).toBeVisible({
      timeout: 5000,
    });
  });

  test("ícone possui botão de preenchimento acessível", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    await page.focus("#email");

    await expect(page.locator(ICON_BTN_ID)).toBeVisible();
    const title = await page.locator(ICON_BTN_ID).getAttribute("title");
    // Should have a meaningful title/tooltip
    expect(title).toBeTruthy();
  });

  test("ícone muda de campo ao re-focar", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    await page.focus("#name");
    await expect(page.locator(ICON_CONTAINER_ID)).toBeVisible({
      timeout: 5000,
    });
    const rect1 = await page.locator(ICON_CONTAINER_ID).boundingBox();

    await page.focus("#email");
    const rect2 = await page.locator(ICON_CONTAINER_ID).boundingBox();

    // Icon should have repositioned
    expect(rect1).not.toEqual(rect2);
  });

  test("ícone é removido ao sair de todos os campos (blur)", async ({
    page,
  }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    await page.focus("#name");
    await expect(page.locator(ICON_CONTAINER_ID)).toBeVisible();

    // Click somewhere outside any input
    await page.click("h1");
    // Give the DOM time to remove the icon
    await page.waitForTimeout(200);

    const visible = await page.locator(ICON_CONTAINER_ID).isVisible();
    // May be hidden or removed entirely
    expect(visible).toBe(false);
  });
});

test.describe("field-icon — preenchimento via botão", () => {
  test("clique no ícone preenche o campo focado", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    await page.focus("#email");
    await expect(page.locator(ICON_BTN_ID)).toBeVisible();

    const valueBefore = await page.inputValue("#email");
    expect(valueBefore).toBe("");

    await page.click(ICON_BTN_ID);

    // Wait for the fill to complete (async message round-trip)
    await page.waitForFunction(
      () =>
        (document.querySelector("#email") as HTMLInputElement)?.value !== "",
      undefined,
      { timeout: 5000 },
    );

    const valueAfter = await page.inputValue("#email");
    expect(valueAfter).not.toBe("");
    // Must look like an email address
    expect(valueAfter).toMatch(/@/);
  });

  test("após preenchimento via ícone, campo dispara evento input", async ({
    page,
  }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    await page.evaluate(() => {
      (window as unknown as { __iconFired: boolean }).__iconFired = false;
      document.querySelector("#cpf")?.addEventListener("input", () => {
        (window as unknown as { __iconFired: boolean }).__iconFired = true;
      });
    });

    await page.focus("#cpf");
    await expect(page.locator(ICON_BTN_ID)).toBeVisible();
    await page.click(ICON_BTN_ID);

    await page.waitForFunction(
      () => (window as unknown as { __iconFired: boolean }).__iconFired,
      undefined,
      { timeout: 5000 },
    );

    const fired = await page.evaluate(
      () => (window as unknown as { __iconFired: boolean }).__iconFired,
    );
    expect(fired).toBe(true);
  });
});

test.describe("field-icon — FILL_SINGLE_FIELD mensagem", () => {
  test("FILL_SINGLE_FIELD preenche o campo correto via seletor", async ({
    page,
  }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    // FILL_SINGLE_FIELD uses the active/focused element — focus #phone first
    await page.focus("#phone");

    await sendToContentScript(page, { type: "FILL_SINGLE_FIELD" });

    await page.waitForFunction(
      () =>
        (document.querySelector("#phone") as HTMLInputElement)?.value !== "",
      undefined,
      { timeout: 5000 },
    );

    const val = await page.inputValue("#phone");
    expect(val).not.toBe("");
    // Phone should contain digits
    expect(val).toMatch(/\d/);
  });
});
