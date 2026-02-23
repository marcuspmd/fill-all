/**
 * Field Icon — inspection modal for field detection metadata and user overrides
 */

import type { FormField, FieldType } from "@/types";
import { invalidateClassifier } from "@/lib/form/detectors/strategies";
import { storeLearnedEntry } from "@/lib/ai/learning-store";
import { createLogger } from "@/lib/logger";
import { getFieldTypeLabel } from "@/lib/shared/field-type-catalog";
import { MODAL_ID } from "./field-icon-styles";
import { ALL_FIELD_TYPES, escHtml, buildFormField } from "./field-icon-utils";

const log = createLogger("FieldIcon:Inspect");

let inspectModalElement: HTMLElement | null = null;
let currentInspectField: FormField | null = null;

export function handleInspectClick(target: HTMLElement): void {
  const el = target as
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement;

  const field = buildFormField(el);
  currentInspectField = field;
  showInspectModal(field);
}

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
      `<option value="${t}" ${t === field.fieldType ? "selected" : ""}>${getFieldTypeLabel(t)}</option>`,
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

  document.addEventListener("keydown", handleModalKeydown, { capture: true });

  requestAnimationFrame(() => {
    inspectModalElement
      ?.querySelector<HTMLElement>("#fa-modal-box")
      ?.classList.add("fa-modal-visible");
  });
}

export function hideInspectModal(): void {
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
    invalidateClassifier();

    log.info(`🎓 Override do usuário: "${signals}" → "${newType}"`);
  }

  if (saveBtn) {
    saveBtn.textContent = "✓ Salvo!";
    saveBtn.style.background = "#16a34a";
  }

  setTimeout(hideInspectModal, 800);
}
