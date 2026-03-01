/**
 * Context menu setup and click handling.
 */

import { sendToSpecificTab } from "@/lib/chrome/active-tab-messaging";

export function setupContextMenu(): void {
  chrome.contextMenus.create({
    id: "fill-all-fields",
    title: "Fill All - Preencher todos os campos",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "fill-all-save-form",
    title: "Fill All - Salvar dados do formulário",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "fill-all-field-rule",
    title: "Fill All - Criar regra para este campo",
    contexts: ["editable"],
  });

  chrome.contextMenus.create({
    id: "fill-all-toggle-panel",
    title: "Fill All - Abrir/fechar painel flutuante",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "fill-all-export-e2e",
    title: "Fill All - Exportar script E2E (Playwright)",
    contexts: ["page"],
  });
}

export function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab,
): void {
  if (!tab?.id) return;

  switch (info.menuItemId) {
    case "fill-all-fields":
      void sendToSpecificTab(
        tab.id,
        tab.url,
        { type: "FILL_ALL_FIELDS" },
        { injectIfNeeded: true },
      );
      break;
    case "fill-all-save-form":
      void sendToSpecificTab(
        tab.id,
        tab.url,
        { type: "SAVE_FORM" },
        { injectIfNeeded: true },
      );
      break;
    case "fill-all-field-rule":
      void sendToSpecificTab(
        tab.id,
        tab.url,
        { type: "FILL_SINGLE_FIELD" },
        { injectIfNeeded: true },
      );
      break;
    case "fill-all-toggle-panel":
      void sendToSpecificTab(
        tab.id,
        tab.url,
        { type: "TOGGLE_PANEL" },
        { injectIfNeeded: true },
      );
      break;
    case "fill-all-export-e2e":
      void sendToSpecificTab(
        tab.id,
        tab.url,
        { type: "EXPORT_E2E", payload: { framework: "playwright" } },
        { injectIfNeeded: true },
      );
      break;
  }
}
