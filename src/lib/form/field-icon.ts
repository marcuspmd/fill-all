/**
 * Field Icon — shows a small Fill All icon when an input is focused.
 * Clicking the icon fills only that specific field.
 * Also provides:
 *  - Rule quick-save popup (🏷️)
 *  - Field inspection modal (🔍) — shows all detection metadata and allows
 *    the user to override the field type, which feeds the continuous-learning store.
 */

import type { FormField, FieldRule, FieldType } from "@/types";
import { fillSingleField } from "./form-filler";
import { invalidateClassifier } from "@/lib/form/detectors/tensorflow-classifier";
import { storeLearnedEntry } from "@/lib/ai/learning-store";
import { DEFAULT_PIPELINE } from "./detectors/classifiers";
import { createLogger } from "@/lib/logger";

const log = createLogger("FieldIcon");
import { buildSignals } from "./detectors/signals-builder";

const ICON_ID = "fill-all-field-icon";
const RULE_POPUP_ID = "fill-all-rule-popup";
const MODAL_ID = "fill-all-inspect-modal";
const STYLE_ID = "fill-all-field-icon-styles";

/** Selectors whose descendants are custom-select components, not plain inputs */
const CUSTOM_SELECT_ANCESTOR =
  ".ant-select, [class*='react-select'], .MuiSelect-root, [class*='MuiAutocomplete'], [class*='select2']";

// ── Inspection modal state ────────────────────────────────────────────────────
let inspectModalElement: HTMLElement | null = null;
let currentInspectField: FormField | null = null;

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

/** Active position setting, updated via initFieldIcon() */
let _iconPosition: "above" | "inside" | "below" = "inside";

/**
 * Initializes the field icon feature — call once from content script
 */
export function initFieldIcon(
  position: "above" | "inside" | "below" = "inside",
): void {
  _iconPosition = position;
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
      <button id="fill-all-field-inspect-btn" title="Inspecionar campo" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
          <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
          <path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41Z" clip-rule="evenodd"/>
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
      .querySelector("#fill-all-field-inspect-btn")!
      .addEventListener("mousedown", handleInspectClick);

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
  const totalWidth = 72; // three 22px buttons + 3px gaps
  const gap = 4;

  let top: number;
  let left: number;

  if (_iconPosition === "above") {
    top = rect.top - iconHeight - gap + window.scrollY;
    left = rect.right - totalWidth - gap + window.scrollX;
  } else if (_iconPosition === "below") {
    top = rect.bottom + gap + window.scrollY;
    left = rect.right - totalWidth - gap + window.scrollX;
  } else {
    // inside (default)
    top = rect.top + (rect.height - iconHeight) / 2 + window.scrollY;
    left = rect.right - totalWidth - gap + window.scrollX;
  }

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

  // Build signals and classify using the same pipeline as the popup
  field.contextSignals = buildSignals(field);
  const pipelineResult = await DEFAULT_PIPELINE.runAsync(field);
  field.fieldType = pipelineResult.type;
  field.detectionMethod = pipelineResult.method;
  field.detectionConfidence = pipelineResult.confidence;

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

// ── Inspection modal ──────────────────────────────────────────────────────────

function handleInspectClick(e: Event): void {
  e.preventDefault();
  e.stopPropagation();

  if (!currentTarget) return;

  const el = currentTarget as
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement;

  // Show modal immediately with the fast sync result
  const field = buildFormField(el);
  currentInspectField = field;
  showInspectModal(field);
}

function buildFormField(
  el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): FormField {
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
    detectionMethod: "html-type",
    detectionConfidence: 0.5,
  };

  field.contextSignals = [
    field.label?.toLowerCase(),
    field.name?.toLowerCase(),
    field.id?.toLowerCase(),
    field.placeholder?.toLowerCase(),
    field.autocomplete?.toLowerCase(),
  ]
    .filter(Boolean)
    .join(" ");

  // ── Step 0: Custom-select ancestry (overrides all keyword matching) ──────
  // An input[type=search] inside .ant-select, react-select, MUI etc. is always
  // a select component, regardless of what its name/id/label says.
  const isInsideCustomSelect = !!el.closest(CUSTOM_SELECT_ANCESTOR);
  const isCombobox = el.getAttribute("role") === "combobox";
  if (isInsideCustomSelect || isCombobox) {
    field.fieldType = "select";
    field.detectionMethod = "custom-select";
    field.detectionConfidence = 1.0;
    return field;
  }

  // ── Classify using the same pipeline as the popup (sync) ────────────────
  const pipelineResult = DEFAULT_PIPELINE.run(field);
  field.fieldType = pipelineResult.type;
  field.detectionMethod = pipelineResult.method;
  field.detectionConfidence = pipelineResult.confidence;

  return field;
}

const ALL_FIELD_TYPES: FieldType[] = [
  "cpf",
  "cnpj",
  "rg",
  "email",
  "phone",
  "full-name",
  "first-name",
  "last-name",
  "name",
  "address",
  "street",
  "city",
  "state",
  "cep",
  "zip-code",
  "date",
  "birth-date",
  "password",
  "username",
  "company",
  "money",
  "number",
  "text",
  "select",
  "checkbox",
  "radio",
  "unknown",
];

function showInspectModal(field: FormField): void {
  hideInspectModal();

  inspectModalElement = document.createElement("div");
  inspectModalElement.id = MODAL_ID;

  const conf =
    field.detectionConfidence !== undefined
      ? `${(field.detectionConfidence * 100).toFixed(0)}%`
      : "—";

  const badge = (method: string) => {
    const colors: Record<string, string> = {
      "html-type": "#f59e0b",
      keyword: "#22c55e",
      tensorflow: "#6366f1",
      "chrome-ai": "#a855f7",
      "html-fallback": "#ef4444",
      "custom-select": "#06b6d4",
      interactive: "#0ea5e9",
      "user-override": "#f97316",
    };
    const bg = colors[method] ?? "#64748b";
    return `<span style="display:inline-block;padding:1px 6px;border-radius:999px;font-size:10px;font-weight:700;background:${bg};color:#fff">${method}</span>`;
  };

  const typeOptions = ALL_FIELD_TYPES.map(
    (t) =>
      `<option value="${t}" ${t === field.fieldType ? "selected" : ""}>${t}</option>`,
  ).join("");

  inspectModalElement.innerHTML = `
    <div id="fa-modal-backdrop"></div>
    <div id="fa-modal-box" role="dialog" aria-modal="true" aria-labelledby="fa-modal-title">
      <div id="fa-modal-header">
        <span id="fa-modal-title">🔍 Inspeção do Campo</span>
        <button id="fa-modal-close" type="button" title="Fechar">✕</button>
      </div>
      <div id="fa-modal-body">
        <table id="fa-modal-table">
          <tbody>
            <tr><th>ID</th><td><code>${escHtml(field.id ?? "—")}</code></td></tr>
            <tr><th>Name</th><td><code>${escHtml(field.name ?? "—")}</code></td></tr>
            <tr><th>Tag</th><td><code>${escHtml(field.element.tagName.toLowerCase())}</code>${field.element instanceof HTMLInputElement ? `&nbsp;<code>type="${escHtml(field.element.type)}"</code>` : ""}</td></tr>
            <tr><th>Label</th><td>${escHtml(field.label ?? "—")}</td></tr>
            <tr><th>Placeholder</th><td>${escHtml(field.placeholder ?? "—")}</td></tr>
            <tr><th>Autocomplete</th><td><code>${escHtml(field.autocomplete ?? "—")}</code></td></tr>
            <tr><th>Obrigatório</th><td>${field.required ? "✅ Sim" : "❌ Não"}</td></tr>
            <tr><th>Sinais</th><td><code>${escHtml(field.contextSignals ?? "—")}</code></td></tr>
            <tr><th>Seletor</th><td><code style="word-break:break-all;font-size:10px">${escHtml(field.selector)}</code></td></tr>
            <tr><th>Método</th><td id="fa-modal-method-td">${badge(field.detectionMethod ?? "—")} <span style="color:#94a3b8;font-size:11px">(confiança ${conf})</span></td></tr>
          </tbody>
        </table>

        <div id="fa-modal-override">
          <label id="fa-modal-type-label">
            Tipo detectado
            <span id="fa-modal-type-badge">${badge(field.detectionMethod ?? "—")}</span>
          </label>
          <select id="fa-modal-type-select">${typeOptions}</select>
          <p id="fa-modal-override-hint">Alterar o tipo salva um override no aprendizado contínuo e melhora detecções futuras.</p>
        </div>
      </div>
      <div id="fa-modal-footer">
        <button id="fa-modal-save" type="button">💾 Salvar override</button>
        <button id="fa-modal-cancel" type="button">Cancelar</button>
      </div>
    </div>
  `;

  document.body.appendChild(inspectModalElement);

  inspectModalElement
    .querySelector("#fa-modal-close")!
    .addEventListener("click", hideInspectModal);

  inspectModalElement
    .querySelector("#fa-modal-backdrop")!
    .addEventListener("click", hideInspectModal);

  inspectModalElement
    .querySelector("#fa-modal-cancel")!
    .addEventListener("click", hideInspectModal);

  inspectModalElement
    .querySelector("#fa-modal-save")!
    .addEventListener("click", () => void saveInspectOverride());

  // Keyboard: Escape closes the modal
  document.addEventListener("keydown", handleModalKeydown, { capture: true });

  // Animate in
  requestAnimationFrame(() => {
    inspectModalElement
      ?.querySelector<HTMLElement>("#fa-modal-box")
      ?.classList.add("fa-modal-visible");
  });
}

function hideInspectModal(): void {
  inspectModalElement?.remove();
  inspectModalElement = null;
  currentInspectField = null;
  document.removeEventListener("keydown", handleModalKeydown, true);
}

function handleModalKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape") hideInspectModal();
}

async function saveInspectOverride(): Promise<void> {
  if (!currentInspectField) return;

  const select = inspectModalElement?.querySelector<HTMLSelectElement>(
    "#fa-modal-type-select",
  );
  const newType = (select?.value ?? "unknown") as FieldType;
  const signals = currentInspectField.contextSignals ?? "";

  const saveBtn =
    inspectModalElement?.querySelector<HTMLButtonElement>("#fa-modal-save");

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "⏳ Salvando…";
  }

  if (signals) {
    await storeLearnedEntry(signals, newType);
    invalidateClassifier(); // dispara reload dos vetores já com a nova entrada

    log.info(`🎓 Override do usuário: "${signals}" → "${newType}"`);
  }

  if (saveBtn) {
    saveBtn.textContent = "✓ Salvo!";
    saveBtn.style.background = "#16a34a";
  }

  setTimeout(hideInspectModal, 800);
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

  await chrome.runtime.sendMessage({ type: "SAVE_RULE", payload: rule });

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
    #fill-all-field-inspect-btn {
      background: #0ea5e9;
    }
    #fill-all-field-inspect-btn:hover {
      background: #0284c7;
      box-shadow: 0 2px 8px rgba(14, 165, 233, 0.5);
      transform: scale(1.1);
    }
    #fill-all-field-inspect-btn:active {
      transform: scale(0.95);
    }
    /* ── Inspection Modal ────────────────────────────────────────────────── */
    #${MODAL_ID} {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #fa-modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(2px);
    }
    #fa-modal-box {
      position: relative;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.22);
      width: min(480px, calc(100vw - 32px));
      max-height: calc(100vh - 64px);
      display: flex;
      flex-direction: column;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 13px;
      color: #1e293b;
      opacity: 0;
      transform: scale(0.94) translateY(8px);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    #fa-modal-box.fa-modal-visible {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    #fa-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 12px;
      border-bottom: 1px solid #e2e8f0;
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      border-radius: 14px 14px 0 0;
    }
    #fa-modal-title {
      color: #fff;
      font-weight: 700;
      font-size: 14px;
    }
    #fa-modal-close {
      background: rgba(255,255,255,0.2);
      border: none;
      color: #fff;
      border-radius: 6px;
      width: 24px;
      height: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      transition: background 0.15s;
    }
    #fa-modal-close:hover { background: rgba(255,255,255,0.35); }
    #fa-modal-body {
      padding: 14px 16px;
      overflow-y: auto;
      flex: 1;
    }
    #fa-modal-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 12px;
    }
    #fa-modal-table th,
    #fa-modal-table td {
      padding: 5px 8px;
      vertical-align: top;
      border-bottom: 1px solid #f1f5f9;
    }
    #fa-modal-table th {
      width: 110px;
      color: #64748b;
      font-weight: 700;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      white-space: nowrap;
    }
    #fa-modal-table td code {
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 4px;
      font-size: 11px;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
    }
    #fa-modal-override {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
    }
    #fa-modal-type-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 8px;
    }
    #fa-modal-type-select {
      width: 100%;
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 13px;
      font-family: inherit;
      color: #1e293b;
      background: #fff;
      outline: none;
      cursor: pointer;
      transition: border-color 0.15s;
      box-sizing: border-box;
    }
    #fa-modal-type-select:focus { border-color: #6366f1; }
    #fa-modal-override-hint {
      margin: 8px 0 0;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.5;
    }
    #fa-modal-footer {
      padding: 10px 16px 14px;
      display: flex;
      gap: 8px;
      border-top: 1px solid #f1f5f9;
    }
    #fa-modal-save {
      flex: 1;
      padding: 8px 14px;
      background: #4f46e5;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      transition: background 0.15s;
    }
    #fa-modal-save:hover { background: #4338ca; }
    #fa-modal-save:disabled { cursor: default; }
    #fa-modal-cancel {
      padding: 8px 14px;
      background: transparent;
      color: #64748b;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-family: inherit;
      transition: background 0.15s;
    }
    #fa-modal-cancel:hover { background: #f1f5f9; }
    #${RULE_POPUP_ID} {
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
