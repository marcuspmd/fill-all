/**
 * E2E tests for floating-panel.ts
 *
 * Verifies that the floating panel is created and removed correctly, that
 * tabs switch, minimise/restore works, and that the TOGGLE_PANEL message
 * creates/destroys the panel.
 */
import { test, expect } from "@/__tests__/e2e/fixtures";
import {
  sendToContentScript,
  waitForContentScript,
} from "@/__tests__/e2e/fixtures/messaging";

const PANEL_ID = "#fill-all-floating-panel";

test.describe("floating-panel — ciclo de vida via TOGGLE_PANEL", () => {
  test("TOGGLE_PANEL cria o painel na primeira chamada", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    // Panel should not exist before toggle
    await expect(page.locator(PANEL_ID)).not.toBeAttached();

    await sendToContentScript(page, { type: "TOGGLE_PANEL" });

    await expect(page.locator(PANEL_ID)).toBeVisible({ timeout: 3000 });
  });

  test("TOGGLE_PANEL remove o painel na segunda chamada", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    await sendToContentScript(page, { type: "TOGGLE_PANEL" });
    await expect(page.locator(PANEL_ID)).toBeVisible({ timeout: 3000 });

    await sendToContentScript(page, { type: "TOGGLE_PANEL" });
    await expect(page.locator(PANEL_ID)).not.toBeAttached({ timeout: 3000 });
  });

  test("painel tem botão de fechar (×)", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    await sendToContentScript(page, { type: "TOGGLE_PANEL" });
    await expect(page.locator(PANEL_ID)).toBeVisible({ timeout: 3000 });

    // Close button
    const closeBtn = page.locator(`${PANEL_ID} [data-action="close"]`);
    await expect(closeBtn).toBeVisible();
  });

  test("fechar pelo botão de close remove o painel", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    await sendToContentScript(page, { type: "TOGGLE_PANEL" });
    await expect(page.locator(PANEL_ID)).toBeVisible({ timeout: 3000 });

    await page.click(`${PANEL_ID} [data-action="close"]`);
    await expect(page.locator(PANEL_ID)).not.toBeAttached({ timeout: 3000 });
  });
});

test.describe("floating-panel — minimizar / restaurar", () => {
  test("botão de minimizar reduz a altura do painel", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    await sendToContentScript(page, { type: "TOGGLE_PANEL" });
    await expect(page.locator(PANEL_ID)).toBeVisible({ timeout: 3000 });

    const fullBox = await page.locator(PANEL_ID).boundingBox();

    const minBtn = page.locator(`${PANEL_ID} [data-action="minimize"]`);
    await expect(minBtn).toBeVisible();
    await minBtn.click();

    await page.waitForTimeout(300);

    const minBox = await page.locator(PANEL_ID).boundingBox();

    expect(minBox!.height).toBeLessThan(fullBox!.height);
  });

  test("clicar novamente em minimizar restaura a altura", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    await sendToContentScript(page, { type: "TOGGLE_PANEL" });
    await expect(page.locator(PANEL_ID)).toBeVisible({ timeout: 3000 });

    const fullBox = await page.locator(PANEL_ID).boundingBox();

    const minBtn = page.locator(`${PANEL_ID} [data-action="minimize"]`);
    await minBtn.click();
    await page.waitForTimeout(200);

    // Restore
    await page.click(`${PANEL_ID} [data-action="minimize"]`);
    await page.waitForTimeout(300);

    const restoredBox = await page.locator(PANEL_ID).boundingBox();

    expect(restoredBox!.height).toBeGreaterThan(50);
    expect(Math.abs(restoredBox!.height - fullBox!.height)).toBeLessThan(10);
  });
});

test.describe("floating-panel — abas", () => {
  test("painel abre com aba 'actions' ativa por padrão", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    await sendToContentScript(page, { type: "TOGGLE_PANEL" });
    await expect(page.locator(PANEL_ID)).toBeVisible({ timeout: 3000 });

    const activeTabEl = page.locator(
      `${PANEL_ID} [data-tab].active, ${PANEL_ID} [data-tab][aria-selected="true"]`,
    );
    const tabName = await activeTabEl.first().getAttribute("data-tab");
    expect(tabName).toBe("actions");
  });

  test("clicar na aba 'fields' muda o conteúdo exibido", async ({ page }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    await sendToContentScript(page, { type: "TOGGLE_PANEL" });
    await expect(page.locator(PANEL_ID)).toBeVisible({ timeout: 3000 });

    const fieldsTab = page.locator(`${PANEL_ID} [data-tab="fields"]`);
    await expect(fieldsTab).toBeVisible();
    await fieldsTab.click();

    await page.waitForTimeout(200);

    const fieldsContent = page.locator(
      `${PANEL_ID} [data-panel="fields"], ${PANEL_ID} #panel-tab-fields`,
    );
    await expect(fieldsContent.first()).toBeVisible();
  });
});

test.describe("floating-panel — preencher via botão no painel", () => {
  test("botão 'Preencher' no painel preenche o formulário", async ({
    page,
  }) => {
    await page.goto("/test-form.html");
    await waitForContentScript(page);

    await sendToContentScript(page, { type: "TOGGLE_PANEL" });
    await expect(page.locator(PANEL_ID)).toBeVisible({ timeout: 3000 });

    // Find the fill-all button inside the panel
    const fillBtn = page
      .locator(`${PANEL_ID} button`)
      .filter({ hasText: /preencher|fill/i })
      .first();
    await expect(fillBtn).toBeVisible();
    await fillBtn.click();

    await page.waitForFunction(
      () => {
        const email = document.querySelector<HTMLInputElement>("#email");
        return email && email.value !== "";
      },
      undefined,
      { timeout: 8000 },
    );

    const emailValue = await page.inputValue("#email");
    expect(emailValue).not.toBe("");
  });
});
