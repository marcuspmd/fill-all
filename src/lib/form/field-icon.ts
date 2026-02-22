/**
 * Field Icon — orchestrator module.
 * Shows a small Fill All icon when an input is focused.
 * Delegates to:
 *  - field-icon-styles: CSS injection/removal
 *  - field-icon-utils: shared utilities (selector, label, escHtml, buildFormField)
 *  - field-icon-inspect: inspection modal
 *  - field-icon-rule: rule quick-save popup
 */

import type { FormField } from "@/types";
import { fillSingleField } from "./form-filler";
import { DEFAULT_PIPELINE } from "./detectors/classifiers";
import { buildSignals } from "./detectors/signals-builder";
import {
  ICON_ID,
  RULE_POPUP_ID,
  injectStyles,
  removeStyles,
} from "./field-icon-styles";
import {
  isFillableField,
  getUniqueSelector,
  findLabel,
} from "./field-icon-utils";
import { handleInspectClick, hideInspectModal } from "./field-icon-inspect";
import {
  handleRuleButtonClick,
  hideRulePopup,
  destroyRulePopup,
} from "./field-icon-rule";

// ── Core state ────────────────────────────────────────────────────────────────
let iconElement: HTMLElement | null = null;
let currentTarget: HTMLElement | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;
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
  destroyRulePopup();
  hideInspectModal();
}

// ── Focus handling ────────────────────────────────────────────────────────────

function handleFocusIn(e: FocusEvent): void {
  const target = e.target as HTMLElement;

  if (!isFillableField(target)) return;

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

function handleFocusOut(_e: FocusEvent): void {
  hideTimeout = setTimeout(() => {
    const active = document.activeElement;
    if (
      active &&
      (active.closest(`#${ICON_ID}`) || active.closest(`#${RULE_POPUP_ID}`))
    )
      return;
    removeIcon();
    currentTarget = null;
  }, 200);
}

// ── Icon rendering & positioning ──────────────────────────────────────────────

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
      .addEventListener("mousedown", onInspectClick);

    iconElement
      .querySelector("#fill-all-field-rule-btn")!
      .addEventListener("mousedown", onRuleClick);
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
  const totalWidth = 72;
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
    top = rect.top + (rect.height - iconHeight) / 2 + window.scrollY;
    left = rect.right - totalWidth - gap + window.scrollX;
  }

  const maxLeft = window.innerWidth + window.scrollX - totalWidth - 4;
  const maxTop = window.innerHeight + window.scrollY - iconHeight - 4;
  left = Math.max(window.scrollX + 4, Math.min(left, maxLeft));
  top = Math.max(window.scrollY + 4, Math.min(top, maxTop));

  iconElement.style.top = `${top}px`;
  iconElement.style.left = `${left}px`;
}

function repositionIcon(): void {
  if (currentTarget && iconElement?.style.display === "flex") {
    positionIcon(currentTarget);
  }
}

// ── Click handlers (bridge to sub-modules) ────────────────────────────────────

async function handleIconClick(e: Event): Promise<void> {
  e.preventDefault();
  e.stopPropagation();

  if (!currentTarget) return;

  const el = currentTarget as
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement;

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

  field.contextSignals = buildSignals(field);
  const pipelineResult = await DEFAULT_PIPELINE.runAsync(field);
  field.fieldType = pipelineResult.type;
  field.detectionMethod = pipelineResult.method;
  field.detectionConfidence = pipelineResult.confidence;

  const btn = iconElement?.querySelector(
    "#fill-all-field-icon-btn",
  ) as HTMLElement;
  if (btn) btn.classList.add("loading");

  await fillSingleField(field);

  if (btn) btn.classList.remove("loading");
  el.focus();
}

function onInspectClick(e: Event): void {
  e.preventDefault();
  e.stopPropagation();
  if (!currentTarget) return;
  handleInspectClick(currentTarget);
}

function onRuleClick(e: Event): void {
  e.preventDefault();
  e.stopPropagation();
  if (!currentTarget) return;
  handleRuleButtonClick(currentTarget, () => {
    removeIcon();
    currentTarget = null;
  });
}
