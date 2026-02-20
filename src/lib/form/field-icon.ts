/**
 * Field Icon — shows a small Fill All icon when an input is focused.
 * Clicking the icon fills only that specific field.
 */

import type { FormField, FieldRule } from "@/types";
import { fillSingleField } from "./form-filler";
import { classifyField } from "@/lib/ai/tensorflow-generator";
import { saveRule } from "@/lib/storage/storage";

const ICON_ID = "fill-all-field-icon";
const RULE_POPUP_ID = "fill-all-rule-popup";
const STYLE_ID = "fill-all-field-icon-styles";

let iconElement: HTMLElement | null = null;
let rulePopupElement: HTMLElement | null = null;
let currentTarget: HTMLElement | null = null;
let currentRuleField: {
  selector: string;
  label: string;
  name?: string;
  id?: string;
} | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Initializes the field icon feature — call once from content script
 */
export function initFieldIcon(): void {
  injectStyles();

  document.addEventListener("focusin", handleFocusIn, true);
  document.addEventListener("focusout", handleFocusOut, true);
  document.addEventListener("scroll", repositionIcon, true);
  window.addEventListener("resize", repositionIcon);
}

/**
 * Destroys the field icon feature
 */
export function destroyFieldIcon(): void {
  document.removeEventListener("focusin", handleFocusIn, true);
  document.removeEventListener("focusout", handleFocusOut, true);
  document.removeEventListener("scroll", repositionIcon, true);
  window.removeEventListener("resize", repositionIcon);
  removeIcon();
  removeStyles();
  rulePopupElement?.remove();
  rulePopupElement = null;
}

function handleFocusIn(e: FocusEvent): void {
  const target = e.target as HTMLElement;

  if (!isFillableField(target)) return;

  // Don't show icon on our own elements
  if (
    target.closest(
      `#${ICON_ID}, #${RULE_POPUP_ID}, #fill-all-floating-panel, #fill-all-notification`,
    )
  )
    return;

  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  currentTarget = target;
  showIcon(target);
}

function handleFocusOut(e: FocusEvent): void {
  // Delay hiding so clicks on the icon can register
  hideTimeout = setTimeout(() => {
    const active = document.activeElement;
    // Don't hide if focus moved to the icon itself or the rule popup
    if (
      active &&
      (active.closest(`#${ICON_ID}`) || active.closest(`#${RULE_POPUP_ID}`))
    )
      return;
    removeIcon();
    currentTarget = null;
  }, 200);
}

function isFillableField(el: HTMLElement): boolean {
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLInputElement) {
    const skip = ["hidden", "submit", "button", "image", "reset", "file"];
    return !skip.includes(el.type) && !el.disabled;
  }
  return false;
}

function showIcon(target: HTMLElement): void {
  if (!iconElement) {
    iconElement = document.createElement("div");
    iconElement.id = ICON_ID;
    iconElement.innerHTML = `
      <button id="fill-all-field-icon-btn" title="Preencher este campo" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
          <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.183a1 1 0 0 1 .633.633l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.633l.551-.183a1 1 0 0 0 0-1.898l-.551-.184a1 1 0 0 1-.633-.632l-.183-.551Z"/>
        </svg>
      </button>
      <button id="fill-all-field-rule-btn" title="Salvar regra para este campo" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
          <path fill-rule="evenodd" d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
        </svg>
      </button>
    `;
    document.body.appendChild(iconElement);

    iconElement
      .querySelector("#fill-all-field-icon-btn")!
      .addEventListener("mousedown", handleIconClick);

    iconElement
      .querySelector("#fill-all-field-rule-btn")!
      .addEventListener("mousedown", handleRuleButtonClick);
  }

  positionIcon(target);
  iconElement.style.display = "flex";
  requestAnimationFrame(() => {
    if (iconElement) iconElement.classList.add("visible");
  });
}

function removeIcon(): void {
  if (iconElement) {
    iconElement.classList.remove("visible");
    iconElement.style.display = "none";
  }
  hideRulePopup();
}

function positionIcon(target: HTMLElement): void {
  if (!iconElement) return;

  const rect = target.getBoundingClientRect();
  const iconHeight = 24;
  const totalWidth = 47; // two 22px buttons + 3px gap
  const gap = 4;

  // Position inside the input, right-aligned
  let top = rect.top + (rect.height - iconHeight) / 2 + window.scrollY;
  let left = rect.right - totalWidth - gap + window.scrollX;

  // Clamp within viewport
  const maxLeft = window.innerWidth + window.scrollX - totalWidth - 4;
  const maxTop = window.innerHeight + window.scrollY - iconHeight - 4;
  left = Math.max(window.scrollX + 4, Math.min(left, maxLeft));
  top = Math.max(window.scrollY + 4, Math.min(top, maxTop));

  iconElement.style.top = `${top}px`;
  iconElement.style.left = `${left}px`;
}

function repositionIcon(): void {
  if (currentTarget && iconElement?.style.display === "block") {
    positionIcon(currentTarget);
  }
}

async function handleIconClick(e: Event): Promise<void> {
  e.preventDefault();
  e.stopPropagation();

  if (!currentTarget) return;

  const target = currentTarget;
  const el = target as
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement;

  // Build a FormField from the current target
  const field: FormField = {
    element: el,
    selector: getUniqueSelector(el),
    fieldType: "unknown",
    label: findLabel(el),
    name: el.name || undefined,
    id: el.id || undefined,
    placeholder:
      ("placeholder" in el ? el.placeholder : undefined) || undefined,
    autocomplete: el.autocomplete || undefined,
    required: el.required,
  };

  // Detect the field type
  field.fieldType = detectFieldType(el);
  if (field.fieldType === "unknown") {
    field.fieldType = classifyField(field);
  }

  // Show loading state
  const btn = iconElement?.querySelector(
    "#fill-all-field-icon-btn",
  ) as HTMLElement;
  if (btn) btn.classList.add("loading");

  await fillSingleField(field);

  if (btn) btn.classList.remove("loading");

  // Re-focus the field after fill
  el.focus();
}

function handleRuleButtonClick(e: Event): void {
  e.preventDefault();
  e.stopPropagation();

  if (!currentTarget) return;

  const el = currentTarget;
  const selector = getUniqueSelector(el);
  const label =
    findLabel(el) ||
    el.getAttribute("name") ||
    el.getAttribute("id") ||
    "campo";
  const name = (el as HTMLInputElement).name || undefined;
  const id = el.id || undefined;

  currentRuleField = { selector, label, name, id };
  showRulePopup(el);
}

function showRulePopup(anchor: HTMLElement): void {
  if (!rulePopupElement) {
    rulePopupElement = document.createElement("div");
    rulePopupElement.id = RULE_POPUP_ID;
    rulePopupElement.innerHTML = getRulePopupHTML();
    document.body.appendChild(rulePopupElement);

    rulePopupElement
      .querySelector("#fa-rp-save")!
      .addEventListener("mousedown", (e) => {
        e.preventDefault();
        saveFieldRule();
      });

    rulePopupElement
      .querySelector("#fa-rp-cancel")!
      .addEventListener("mousedown", (e) => {
        e.preventDefault();
        hideRulePopup();
        removeIcon();
        currentTarget = null;
      });
  }

  // Update field label display
  const nameEl =
    rulePopupElement.querySelector<HTMLElement>("#fa-rp-field-name");
  if (nameEl) nameEl.textContent = currentRuleField?.label || "";

  // Reset inputs
  const fixedInput =
    rulePopupElement.querySelector<HTMLInputElement>("#fa-rp-fixed");
  if (fixedInput) fixedInput.value = "";
  const genSelect =
    rulePopupElement.querySelector<HTMLSelectElement>("#fa-rp-generator");
  if (genSelect) genSelect.value = "auto";

  positionRulePopup(anchor);
  rulePopupElement.style.display = "block";

  // Focus the fixed value input
  rulePopupElement.querySelector<HTMLInputElement>("#fa-rp-fixed")?.focus();
}

function hideRulePopup(): void {
  if (rulePopupElement) {
    rulePopupElement.style.display = "none";
    currentRuleField = null;
  }
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

async function saveFieldRule(): Promise<void> {
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

  await saveRule(rule);

  const saveBtn =
    rulePopupElement?.querySelector<HTMLButtonElement>("#fa-rp-save");
  if (saveBtn) {
    saveBtn.textContent = "✓ Salvo!";
    saveBtn.disabled = true;
    setTimeout(() => {
      hideRulePopup();
      removeIcon();
      currentTarget = null;
    }, 800);
  }
}

function detectFieldType(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): FormField["fieldType"] {
  if (element instanceof HTMLSelectElement) return "select";
  if (element instanceof HTMLTextAreaElement) return "text";

  const type = (element as HTMLInputElement).type?.toLowerCase();
  if (type === "checkbox") return "checkbox";
  if (type === "radio") return "radio";
  if (type === "email") return "email";
  if (type === "tel") return "phone";
  if (type === "password") return "password";
  if (type === "number") return "number";
  if (type === "date") return "date";

  return "unknown";
}

function getUniqueSelector(element: Element): string {
  if (element.id) return `#${CSS.escape(element.id)}`;

  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = `#${CSS.escape(current.id)}`;
      parts.unshift(selector);
      break;
    }

    const parent: Element | null = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c: Element) => c.tagName === current!.tagName,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);
    current = parent;
  }

  return parts.join(" > ");
}

function findLabel(element: HTMLElement): string | undefined {
  if (element.id) {
    const label = document.querySelector(
      `label[for="${CSS.escape(element.id)}"]`,
    );
    if (label?.textContent) return label.textContent.trim();
  }

  const parentLabel = element.closest("label");
  if (parentLabel?.textContent) return parentLabel.textContent.trim();

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  return undefined;
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${ICON_ID} {
      position: absolute;
      z-index: 2147483646;
      display: none;
      align-items: center;
      gap: 3px;
      opacity: 0;
      transform: scale(0.8);
      transition: opacity 0.15s ease, transform 0.15s ease;
      pointer-events: auto;
    }
    #${ICON_ID}.visible {
      opacity: 1;
      transform: scale(1);
    }
    #fill-all-field-icon-btn,
    #fill-all-field-rule-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      padding: 0;
      margin: 0;
      border: none;
      border-radius: 4px;
      color: #fff;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(79, 70, 229, 0.4);
      transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
      line-height: 1;
    }
    #fill-all-field-icon-btn {
      background: #4f46e5;
    }
    #fill-all-field-icon-btn:hover {
      background: #4338ca;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.5);
      transform: scale(1.1);
    }
    #fill-all-field-icon-btn:active {
      transform: scale(0.95);
    }
    #fill-all-field-icon-btn.loading {
      pointer-events: none;
      animation: fill-all-icon-spin 0.6s linear infinite;
    }
    #fill-all-field-rule-btn {
      background: #7c3aed;
    }
    #fill-all-field-rule-btn:hover {
      background: #6d28d9;
      box-shadow: 0 2px 8px rgba(124, 58, 237, 0.5);
      transform: scale(1.1);
    }
    #fill-all-field-rule-btn:active {
      transform: scale(0.95);
    }
    @keyframes fill-all-icon-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    #${RULE_POPUP_ID} {
      position: absolute;
      z-index: 2147483646;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
      width: 264px;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 12px;
      overflow: hidden;
      display: none;
    }
    #${RULE_POPUP_ID} .fa-rp-header {
      padding: 8px 12px;
      background: linear-gradient(135deg, #7c3aed, #6366f1);
      color: #fff;
      font-weight: 700;
      font-size: 11px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #${RULE_POPUP_ID} .fa-rp-body {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    #${RULE_POPUP_ID} .fa-rp-group {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    #${RULE_POPUP_ID} .fa-rp-label {
      font-size: 10px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    #${RULE_POPUP_ID} .fa-rp-input,
    #${RULE_POPUP_ID} .fa-rp-select {
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 12px;
      font-family: inherit;
      color: #1e293b;
      background: #f8fafc;
      outline: none;
      width: 100%;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }
    #${RULE_POPUP_ID} .fa-rp-input:focus,
    #${RULE_POPUP_ID} .fa-rp-select:focus {
      border-color: #6366f1;
      background: #fff;
    }
    #${RULE_POPUP_ID} .fa-rp-actions {
      display: flex;
      gap: 6px;
      margin-top: 2px;
    }
    #${RULE_POPUP_ID} .fa-rp-btn-primary {
      flex: 1;
      padding: 6px 10px;
      background: #4f46e5;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
      transition: background 0.15s;
    }
    #${RULE_POPUP_ID} .fa-rp-btn-primary:hover {
      background: #4338ca;
    }
    #${RULE_POPUP_ID} .fa-rp-btn-primary:disabled {
      background: #16a34a;
      cursor: default;
    }
    #${RULE_POPUP_ID} .fa-rp-btn-cancel {
      padding: 6px 12px;
      background: transparent;
      color: #64748b;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-family: inherit;
      transition: background 0.15s;
    }
    #${RULE_POPUP_ID} .fa-rp-btn-cancel:hover {
      background: #f1f5f9;
    }
  `;
  document.head.appendChild(style);
}

function removeStyles(): void {
  document.getElementById(STYLE_ID)?.remove();
}
