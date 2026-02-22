/**
 * Field Icon — rule quick-save popup for field-specific rules
 */

import type { FieldRule } from "@/types";
import { RULE_POPUP_ID } from "./field-icon-styles";
import { getUniqueSelector, findLabel } from "./field-icon-utils";

let rulePopupElement: HTMLElement | null = null;
let currentRuleField: {
  selector: string;
  label: string;
  name?: string;
  id?: string;
} | null = null;

export function handleRuleButtonClick(
  target: HTMLElement,
  onDismiss: () => void,
): void {
  const selector = getUniqueSelector(target);
  const label =
    findLabel(target) ||
    target.getAttribute("name") ||
    target.getAttribute("id") ||
    "campo";
  const name = (target as HTMLInputElement).name || undefined;
  const id = target.id || undefined;

  currentRuleField = { selector, label, name, id };
  showRulePopup(target, onDismiss);
}

function showRulePopup(anchor: HTMLElement, onDismiss: () => void): void {
  if (!rulePopupElement) {
    rulePopupElement = document.createElement("div");
    rulePopupElement.id = RULE_POPUP_ID;
    rulePopupElement.innerHTML = getRulePopupHTML();
    document.body.appendChild(rulePopupElement);

    rulePopupElement
      .querySelector("#fa-rp-save")!
      .addEventListener("mousedown", (e) => {
        e.preventDefault();
        void saveFieldRule(onDismiss);
      });

    rulePopupElement
      .querySelector("#fa-rp-cancel")!
      .addEventListener("mousedown", (e) => {
        e.preventDefault();
        hideRulePopup();
        onDismiss();
      });
  }

  const nameEl =
    rulePopupElement.querySelector<HTMLElement>("#fa-rp-field-name");
  if (nameEl) nameEl.textContent = currentRuleField?.label || "";

  const fixedInput =
    rulePopupElement.querySelector<HTMLInputElement>("#fa-rp-fixed");
  if (fixedInput) fixedInput.value = "";
  const genSelect =
    rulePopupElement.querySelector<HTMLSelectElement>("#fa-rp-generator");
  if (genSelect) genSelect.value = "auto";

  positionRulePopup(anchor);
  rulePopupElement.style.display = "block";

  rulePopupElement.querySelector<HTMLInputElement>("#fa-rp-fixed")?.focus();
}

export function hideRulePopup(): void {
  if (rulePopupElement) {
    rulePopupElement.style.display = "none";
    currentRuleField = null;
  }
}

export function destroyRulePopup(): void {
  rulePopupElement?.remove();
  rulePopupElement = null;
  currentRuleField = null;
}

function positionRulePopup(anchor: HTMLElement): void {
  if (!rulePopupElement) return;

  const rect = anchor.getBoundingClientRect();
  const popupWidth = 264;
  const popupHeight = 195;

  let top = rect.bottom + window.scrollY + 4;
  let left = rect.left + window.scrollX;

  if (left + popupWidth > window.innerWidth + window.scrollX - 8) {
    left = window.innerWidth + window.scrollX - popupWidth - 8;
  }
  left = Math.max(window.scrollX + 8, left);

  if (top + popupHeight > window.innerHeight + window.scrollY) {
    top = rect.top + window.scrollY - popupHeight - 4;
  }

  rulePopupElement.style.top = `${top}px`;
  rulePopupElement.style.left = `${left}px`;
}

function getRulePopupHTML(): string {
  return `
    <div class="fa-rp-header">📌 Regra — <span id="fa-rp-field-name"></span></div>
    <div class="fa-rp-body">
      <div class="fa-rp-group">
        <label class="fa-rp-label">Valor fixo</label>
        <input type="text" id="fa-rp-fixed" class="fa-rp-input" placeholder="Deixe vazio para gerador automático" />
      </div>
      <div class="fa-rp-group">
        <label class="fa-rp-label">Gerador automático</label>
        <select id="fa-rp-generator" class="fa-rp-select">
          <option value="auto">Auto (detectar)</option>
          <option value="cpf">CPF</option>
          <option value="cnpj">CNPJ</option>
          <option value="email">E-mail</option>
          <option value="name">Nome completo</option>
          <option value="first-name">Primeiro nome</option>
          <option value="last-name">Sobrenome</option>
          <option value="phone">Telefone</option>
          <option value="date">Data</option>
          <option value="birth-date">Data de nascimento</option>
          <option value="address">Endereço</option>
          <option value="cep">CEP</option>
          <option value="city">Cidade</option>
          <option value="state">Estado</option>
          <option value="rg">RG</option>
          <option value="password">Senha</option>
          <option value="username">Username</option>
          <option value="company">Empresa</option>
          <option value="number">Número</option>
          <option value="text">Texto livre</option>
        </select>
      </div>
      <div class="fa-rp-actions">
        <button id="fa-rp-save" class="fa-rp-btn-primary" type="button">💾 Salvar</button>
        <button id="fa-rp-cancel" class="fa-rp-btn-cancel" type="button">Cancelar</button>
      </div>
    </div>
  `;
}

async function saveFieldRule(onDismiss: () => void): Promise<void> {
  if (!currentRuleField) return;

  const fixedInput =
    rulePopupElement?.querySelector<HTMLInputElement>("#fa-rp-fixed");
  const genSelect =
    rulePopupElement?.querySelector<HTMLSelectElement>("#fa-rp-generator");
  const fixedValue = fixedInput?.value.trim() || undefined;
  const generator = (genSelect?.value || "auto") as FieldRule["generator"];

  const rule: FieldRule = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    urlPattern: `${window.location.origin}${window.location.pathname}*`,
    fieldSelector: currentRuleField.selector,
    fieldName: currentRuleField.name || currentRuleField.id || undefined,
    fieldType: "unknown",
    fixedValue,
    generator: fixedValue ? "auto" : generator,
    priority: 10,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await chrome.runtime.sendMessage({ type: "SAVE_RULE", payload: rule });

  const saveBtn =
    rulePopupElement?.querySelector<HTMLButtonElement>("#fa-rp-save");
  if (saveBtn) {
    saveBtn.textContent = "✓ Salvo!";
    saveBtn.disabled = true;
    setTimeout(() => {
      hideRulePopup();
      onDismiss();
    }, 800);
  }
}
