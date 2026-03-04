/**
 * Fields Tab — Field detection, filling, ignoring, and inspection UI.
 *
 * Responsibilities:
 * - Streaming field detection (real-time row insertion)
 * - Fill all / fill empty / fill single field
 * - Ignore / un-ignore fields
 * - Inspect element in DevTools
 * - Clear detected fields / clear form
 */

import { h } from "preact";
import type {
  DetectedFieldSummary,
  ExtensionMessage,
  IgnoredField,
  StreamedFieldMessage,
} from "@/types";
import { openAIContextModal } from "@/popup/popup-ai-context-modal";
import { t } from "@/lib/i18n";
import { panelState } from "../panel-state";
import {
  sendToPage,
  sendToBackground,
  getInspectedUrl,
} from "../panel-messaging";
import { addLog, updateStatusBar } from "../panel-utils";
import { renderTo } from "../components";
import { FieldsTabView } from "@/lib/ui/components";

// ── Fill Operations ───────────────────────────────────────────────────────────

export async function fillAll(): Promise<void> {
  addLog(t("logFilling"));
  try {
    const result = (await sendToPage({
      type: "FILL_ALL_FIELDS",
      payload: { fillEmptyOnly: false },
    })) as { filled?: number };
    addLog(`${result?.filled ?? 0} ${t("filled")}`, "success");
  } catch (err) {
    addLog(`Erro ao preencher: ${err}`, "error");
  }
}

export async function fillOnlyEmpty(): Promise<void> {
  addLog(t("logFillingEmpty"));
  try {
    const result = (await sendToPage({
      type: "FILL_ALL_FIELDS",
      payload: { fillEmptyOnly: true },
    })) as { filled?: number };
    addLog(`${result?.filled ?? 0} ${t("filled")}`, "success");
  } catch (err) {
    addLog(`Erro ao preencher: ${err}`, "error");
  }
}

export async function fillContextualAI(): Promise<void> {
  const context = await openAIContextModal();
  if (!context) return;

  addLog(t("fillContextualAI"));
  const btn = document.getElementById("btn-fill-contextual-ai");
  const label = btn?.querySelector(".card-label");
  if (label) label.textContent = "⏳...";
  try {
    const result = (await sendToPage({
      type: "FILL_CONTEXTUAL_AI",
      payload: context,
    })) as { filled?: number };
    addLog(`${result?.filled ?? 0} ${t("filled")}`, "success");
  } catch (err) {
    addLog(`Erro ao preencher com IA: ${err}`, "error");
  } finally {
    if (label) label.textContent = t("fillContextualAI");
  }
}

export async function fillField(selector: string): Promise<void> {
  addLog(`Preenchendo: ${selector}`);
  try {
    const result = (await sendToPage({
      type: "FILL_FIELD_BY_SELECTOR",
      payload: selector,
    })) as { error?: string };
    if (result?.error) {
      addLog(`Erro: ${result.error}`, "error");
    } else {
      addLog(`Campo preenchido: ${selector}`, "success");
    }
  } catch (err) {
    addLog(`Erro: ${err}`, "error");
  }
}

// ── Inspect ───────────────────────────────────────────────────────────────────

export function inspectElement(selector: string): void {
  const escaped = selector.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  chrome.devtools.inspectedWindow.eval(
    `inspect(document.querySelector('${escaped}'))`,
  );
  addLog(`Inspecionando: ${selector}`);
}

// ── Ignored Fields ────────────────────────────────────────────────────────────

export async function loadIgnoredFields(): Promise<void> {
  try {
    const result = (await sendToBackground({
      type: "GET_IGNORED_FIELDS",
    })) as IgnoredField[] | { error?: string };
    if (Array.isArray(result)) {
      panelState.ignoredSelectors = new Set(result.map((f) => f.selector));
    }
  } catch {
    // silent
  }
}

export async function toggleIgnore(
  selector: string,
  label: string,
): Promise<void> {
  const isIgnored = panelState.ignoredSelectors.has(selector);

  try {
    const pageUrl = await getInspectedUrl();
    const origin = new URL(pageUrl).origin;
    const urlPattern = `${origin}/*`;

    if (isIgnored) {
      const allIgnored = (await sendToBackground({
        type: "GET_IGNORED_FIELDS",
      })) as IgnoredField[];
      const entry = Array.isArray(allIgnored)
        ? allIgnored.find((f) => f.selector === selector)
        : null;
      if (entry) {
        await sendToBackground({
          type: "REMOVE_IGNORED_FIELD",
          payload: entry.id,
        });
        panelState.ignoredSelectors.delete(selector);
        addLog(`${t("logFieldReactivated")}: ${label}`, "info");
      }
    } else {
      await sendToBackground({
        type: "ADD_IGNORED_FIELD",
        payload: { urlPattern, selector, label },
      });
      panelState.ignoredSelectors.add(selector);
      addLog(`${t("logFieldIgnored")}: ${label}`, "warn");
    }
  } catch (err) {
    addLog(`Erro ao alternar ignore: ${err}`, "error");
  }

  if (panelState.activeTab === "fields") renderFieldsTab();
}

// ── Clear ─────────────────────────────────────────────────────────────────────

export async function clearDetectedFields(): Promise<void> {
  panelState.detectedFields = [];
  addLog("Campos detectados limpos", "info");
  if (panelState.activeTab === "fields") renderFieldsTab();
  updateStatusBar();
}

export async function clearForm(): Promise<void> {
  addLog("Limpando formulário...", "info");
  try {
    await sendToPage({ type: "CLEAR_FORM", payload: undefined });
    addLog("✓ Formulário limpo com sucesso", "success");
  } catch (err) {
    addLog(`✗ Erro ao limpar formulário: ${err}`, "error");
  }
}

// ── Detect (Streaming) ────────────────────────────────────────────────────────

async function detectFieldsStreaming(): Promise<void> {
  panelState.detectedFields = [];
  panelState.isDetecting = true;
  addLog(t("logDetecting"));

  if (panelState.activeTab === "fields") renderFieldsTab();

  try {
    const STREAM_IDLE_TIMEOUT_MS = 4000;

    let detectionComplete = false;
    let receivedAnyMessage = false;
    let streamIdleTimeoutId: number | null = null;

    const clearStreamIdleTimeout = (): void => {
      if (streamIdleTimeoutId !== null) {
        window.clearTimeout(streamIdleTimeoutId);
        streamIdleTimeoutId = null;
      }
    };

    const fallbackDetectOnce = async (): Promise<void> => {
      const result = (await sendToPage({ type: "DETECT_FIELDS" })) as {
        fields?: DetectedFieldSummary[];
        error?: string;
      };

      if (result?.error) {
        addLog(`Erro ao detectar: ${result.error}`, "error");
        return;
      }

      panelState.detectedFields = Array.isArray(result?.fields)
        ? result.fields
        : [];
      addLog(
        `${panelState.detectedFields.length} ${t("fieldsDetected")}`,
        "success",
      );
    };

    const finalizeDetection = (
      port: chrome.runtime.Port,
      options?: { warning?: string },
    ): void => {
      if (detectionComplete) return;
      detectionComplete = true;
      clearStreamIdleTimeout();
      panelState.isDetecting = false;

      if (options?.warning) addLog(options.warning, "warn");

      if (panelState.activeTab === "fields") renderFieldsTab();

      try {
        port.disconnect();
      } catch {
        // no-op
      }
    };

    const scheduleStreamIdleFinalization = (
      port: chrome.runtime.Port,
    ): void => {
      clearStreamIdleTimeout();
      streamIdleTimeoutId = window.setTimeout(() => {
        if (!detectionComplete && receivedAnyMessage) {
          finalizeDetection(port, {
            warning: "Detecção finalizada por inatividade do stream",
          });
          addLog(
            `${panelState.detectedFields.length} ${t("fieldsDetected")}`,
            "success",
          );
        }
      }, STREAM_IDLE_TIMEOUT_MS);
    };

    const port = chrome.tabs.connect(panelState.inspectedTabId, {
      name: "field-detection-stream",
    });

    scheduleStreamIdleFinalization(port);

    port.onMessage.addListener((message: StreamedFieldMessage) => {
      receivedAnyMessage = true;
      scheduleStreamIdleFinalization(port);

      if (message.type === "field" && message.field) {
        panelState.detectedFields.push(message.field);
        if (panelState.activeTab === "fields") renderFieldsTab();
      } else if (message.type === "complete") {
        addLog(
          `${panelState.detectedFields.length} ${t("fieldsDetected")}`,
          "success",
        );
        finalizeDetection(port);
      } else if (message.type === "error") {
        addLog(`Erro ao detectar: ${message.error}`, "error");
        finalizeDetection(port);
      }
    });

    port.onDisconnect.addListener(() => {
      clearStreamIdleTimeout();
      if (!detectionComplete) {
        const reason = chrome.runtime.lastError?.message;
        addLog(
          reason
            ? `Conexão perdida durante detecção: ${reason}`
            : "Conexão perdida durante detecção",
          "warn",
        );
        if (!receivedAnyMessage) {
          void fallbackDetectOnce().finally(() => {
            detectionComplete = true;
            panelState.isDetecting = false;
            if (panelState.activeTab === "fields") renderFieldsTab();
          });
          return;
        }
        detectionComplete = true;
        panelState.isDetecting = false;
        if (panelState.activeTab === "fields") renderFieldsTab();
      }
    });
  } catch (err) {
    addLog(`Erro ao detectar: ${err}`, "error");
    panelState.detectedFields = [];
    panelState.isDetecting = false;
    if (panelState.activeTab === "fields") renderFieldsTab();
  }

  await loadIgnoredFields();
  updateStatusBar();
}

export async function detectFields(): Promise<void> {
  await detectFieldsStreaming();
}

// ── Render ────────────────────────────────────────────────────────────────────

export function renderFieldsTab(): void {
  const content = document.getElementById("content");
  renderTo(
    content,
    <FieldsTabView
      fields={panelState.detectedFields}
      ignoredSelectors={panelState.ignoredSelectors}
      detecting={panelState.isDetecting}
      onDetect={() => void detectFields()}
      onFillAll={() => void fillAll()}
      onFillEmpty={() => void fillOnlyEmpty()}
      onClearDetected={() => void clearDetectedFields()}
      onClearForm={() => void clearForm()}
      onFillField={(sel) => void fillField(sel)}
      onInspectField={(sel) => inspectElement(sel)}
      onToggleIgnore={(sel, label) => void toggleIgnore(sel, label)}
    />,
  );
}
