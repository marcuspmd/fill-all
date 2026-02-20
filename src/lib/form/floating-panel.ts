/**
 * Floating Panel — draggable widget injected into pages
 * Provides quick access to Fill All controls without opening the popup
 */

import type { ExtensionMessage } from "@/types";
import { fillAllFields, captureFormValues } from "./form-filler";
import { detectFormFields } from "./form-detector";
import { startWatching, stopWatching, isWatcherActive } from "./dom-watcher";
import { saveForm } from "@/lib/storage/storage";

const PANEL_ID = "fill-all-floating-panel";
const STORAGE_KEY = "fill_all_panel_position";

interface PanelPosition {
  x: number;
  y: number;
  collapsed: boolean;
}

let panelElement: HTMLElement | null = null;

/**
 * Creates and injects the floating panel into the page
 */
export function createFloatingPanel(): void {
  if (document.getElementById(PANEL_ID)) return;

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.innerHTML = getPanelHTML();
  applyPanelStyles(panel);

  document.body.appendChild(panel);
  panelElement = panel;

  // Restore saved position
  restorePosition(panel);

  // Setup drag behavior
  setupDrag(panel);

  // Setup button handlers
  setupHandlers(panel);

  // Update watcher status indicator
  updateWatcherStatus(panel);
}

/**
 * Removes the floating panel from the page
 */
export function removeFloatingPanel(): void {
  const panel = document.getElementById(PANEL_ID);
  if (panel) {
    panel.remove();
    panelElement = null;
  }
}

/**
 * Toggles panel visibility
 */
export function toggleFloatingPanel(): void {
  if (document.getElementById(PANEL_ID)) {
    removeFloatingPanel();
  } else {
    createFloatingPanel();
  }
}

function getPanelHTML(): string {
  return `
    <div class="fa-panel-header" id="fa-panel-drag-handle">
      <span class="fa-panel-title">🔧 Fill All</span>
      <div class="fa-panel-header-actions">
        <button class="fa-panel-btn fa-panel-collapse" id="fa-panel-collapse" title="Minimizar">─</button>
        <button class="fa-panel-btn fa-panel-close" id="fa-panel-close" title="Fechar">✕</button>
      </div>
    </div>
    <div class="fa-panel-body" id="fa-panel-body">
      <button class="fa-action-btn fa-btn-primary" id="fa-btn-fill">
        ⚡ Preencher Tudo
      </button>
      <button class="fa-action-btn fa-btn-secondary" id="fa-btn-save">
        💾 Salvar Form
      </button>
      <div class="fa-panel-row">
        <button class="fa-action-btn fa-btn-outline fa-btn-half" id="fa-btn-detect">
          🔍 Detectar
        </button>
        <button class="fa-action-btn fa-btn-outline fa-btn-half" id="fa-btn-watch">
          👁️ Watch
        </button>
      </div>
      <div class="fa-panel-status" id="fa-panel-status"></div>
    </div>
  `;
}

function applyPanelStyles(panel: HTMLElement): void {
  // Create scoped styles
  const styleId = "fill-all-panel-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = getPanelCSS();
    document.head.appendChild(style);
  }

  Object.assign(panel.style, {
    position: "fixed",
    zIndex: "2147483647",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    fontSize: "13px",
    lineHeight: "1.4",
    color: "#1e293b",
    userSelect: "none",
    transition: "box-shadow 0.2s ease",
  });
}

function getPanelCSS(): string {
  return `
    #${PANEL_ID} {
      width: 220px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    #${PANEL_ID}:hover {
      box-shadow: 0 12px 40px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.1);
    }
    #${PANEL_ID} .fa-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      color: #fff;
      cursor: grab;
      user-select: none;
    }
    #${PANEL_ID} .fa-panel-header:active {
      cursor: grabbing;
    }
    #${PANEL_ID} .fa-panel-title {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    #${PANEL_ID} .fa-panel-header-actions {
      display: flex;
      gap: 4px;
    }
    #${PANEL_ID} .fa-panel-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      color: #fff;
      width: 22px;
      height: 22px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease;
      padding: 0;
      line-height: 1;
    }
    #${PANEL_ID} .fa-panel-btn:hover {
      background: rgba(255,255,255,0.35);
    }
    #${PANEL_ID} .fa-panel-body {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    #${PANEL_ID} .fa-panel-body.collapsed {
      display: none;
    }
    #${PANEL_ID} .fa-action-btn {
      display: block;
      width: 100%;
      padding: 8px 12px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
      transition: all 0.15s ease;
      text-align: center;
    }
    #${PANEL_ID} .fa-btn-primary {
      background: #4f46e5;
      color: #fff;
    }
    #${PANEL_ID} .fa-btn-primary:hover {
      background: #4338ca;
    }
    #${PANEL_ID} .fa-btn-secondary {
      background: #e0e7ff;
      color: #4f46e5;
    }
    #${PANEL_ID} .fa-btn-secondary:hover {
      background: #c7d2fe;
    }
    #${PANEL_ID} .fa-btn-outline {
      background: transparent;
      color: #4f46e5;
      border: 1px solid #c7d2fe;
    }
    #${PANEL_ID} .fa-btn-outline:hover {
      background: #eef2ff;
    }
    #${PANEL_ID} .fa-btn-outline.active {
      background: #4f46e5;
      color: #fff;
      border-color: #4f46e5;
    }
    #${PANEL_ID} .fa-panel-row {
      display: flex;
      gap: 6px;
    }
    #${PANEL_ID} .fa-btn-half {
      flex: 1;
      padding: 8px 6px;
    }
    #${PANEL_ID} .fa-panel-status {
      font-size: 11px;
      color: #64748b;
      text-align: center;
      min-height: 16px;
      transition: opacity 0.3s ease;
    }
    #${PANEL_ID} .fa-panel-status.success {
      color: #16a34a;
    }
    #${PANEL_ID} .fa-panel-status.info {
      color: #4f46e5;
    }
  `;
}

function setupDrag(panel: HTMLElement): void {
  const handle = panel.querySelector("#fa-panel-drag-handle") as HTMLElement;
  if (!handle) return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  handle.addEventListener("mousedown", (e: MouseEvent) => {
    // Ignore clicks on buttons
    if ((e.target as HTMLElement).closest("button")) return;

    isDragging = true;
    offsetX = e.clientX - panel.getBoundingClientRect().left;
    offsetY = e.clientY - panel.getBoundingClientRect().top;

    e.preventDefault();
  });

  document.addEventListener("mousemove", (e: MouseEvent) => {
    if (!isDragging) return;

    const x = Math.max(
      0,
      Math.min(e.clientX - offsetX, window.innerWidth - panel.offsetWidth),
    );
    const y = Math.max(
      0,
      Math.min(e.clientY - offsetY, window.innerHeight - panel.offsetHeight),
    );

    panel.style.left = `${x}px`;
    panel.style.top = `${y}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      savePosition(panel);
    }
  });
}

function setupHandlers(panel: HTMLElement): void {
  // Fill All
  panel.querySelector("#fa-btn-fill")?.addEventListener("click", async () => {
    const btn = panel.querySelector("#fa-btn-fill") as HTMLButtonElement;
    btn.textContent = "⏳ Preenchendo...";
    btn.disabled = true;

    try {
      const results = await fillAllFields();
      setStatus(panel, `✓ ${results.length} campos preenchidos`, "success");
      btn.textContent = "⚡ Preencher Tudo";
    } catch (e) {
      setStatus(panel, "Erro ao preencher", "");
      btn.textContent = "⚡ Preencher Tudo";
    }

    btn.disabled = false;

    // Auto-start watcher
    if (!isWatcherActive()) {
      startWatcherWithUI(panel);
    }
  });

  // Save Form
  panel.querySelector("#fa-btn-save")?.addEventListener("click", async () => {
    const values = captureFormValues();
    const formData = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: `Form - ${new URL(window.location.href).hostname} - ${new Date().toLocaleDateString("pt-BR")}`,
      urlPattern: `${window.location.origin}${window.location.pathname}*`,
      fields: values,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveForm(formData);
    setStatus(
      panel,
      `💾 Salvo (${Object.keys(values).length} campos)`,
      "success",
    );
  });

  // Detect
  panel.querySelector("#fa-btn-detect")?.addEventListener("click", () => {
    const fields = detectFormFields();
    setStatus(panel, `🔍 ${fields.length} campos encontrados`, "info");
  });

  // Watch toggle
  panel.querySelector("#fa-btn-watch")?.addEventListener("click", () => {
    const btn = panel.querySelector("#fa-btn-watch") as HTMLButtonElement;
    if (isWatcherActive()) {
      stopWatching();
      btn.classList.remove("active");
      btn.textContent = "👁️ Watch";
      setStatus(panel, "Watch: desativado", "");
    } else {
      startWatcherWithUI(panel);
    }
  });

  // Collapse
  panel.querySelector("#fa-panel-collapse")?.addEventListener("click", () => {
    const body = panel.querySelector("#fa-panel-body") as HTMLElement;
    const btn = panel.querySelector("#fa-panel-collapse") as HTMLButtonElement;
    const isCollapsed = body.classList.toggle("collapsed");
    btn.textContent = isCollapsed ? "□" : "─";
    savePosition(panel);
  });

  // Close
  panel.querySelector("#fa-panel-close")?.addEventListener("click", () => {
    removeFloatingPanel();
  });
}

function startWatcherWithUI(panel: HTMLElement): void {
  startWatching((newFieldsCount) => {
    if (newFieldsCount > 0 && panelElement) {
      setStatus(
        panelElement,
        `🔄 ${newFieldsCount} campo(s) novo(s) — re-preenchendo...`,
        "info",
      );
    }
  }, true);

  const btn = panel.querySelector("#fa-btn-watch") as HTMLButtonElement;
  if (btn) {
    btn.classList.add("active");
    btn.textContent = "👁️ Ativo";
  }
  setStatus(panel, "Watch: ativado", "info");
}

function updateWatcherStatus(panel: HTMLElement): void {
  const btn = panel.querySelector("#fa-btn-watch") as HTMLButtonElement;
  if (btn && isWatcherActive()) {
    btn.classList.add("active");
    btn.textContent = "👁️ Ativo";
  }
}

function setStatus(panel: HTMLElement, text: string, className: string): void {
  const status = panel.querySelector("#fa-panel-status") as HTMLElement;
  if (status) {
    status.textContent = text;
    status.className = `fa-panel-status ${className}`;

    // Auto-clear after 4 seconds (except for watch status)
    if (!text.includes("Watch:")) {
      setTimeout(() => {
        if (status.textContent === text) {
          status.textContent = "";
          status.className = "fa-panel-status";
        }
      }, 4000);
    }
  }
}

function savePosition(panel: HTMLElement): void {
  const body = panel.querySelector("#fa-panel-body") as HTMLElement;
  const position: PanelPosition = {
    x: panel.offsetLeft,
    y: panel.offsetTop,
    collapsed: body?.classList.contains("collapsed") || false,
  };

  try {
    chrome.storage.local.set({ [STORAGE_KEY]: position });
  } catch {
    // Silently fail if storage is not available
  }
}

function restorePosition(panel: HTMLElement): void {
  try {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const pos = result[STORAGE_KEY] as PanelPosition | undefined;
      if (pos) {
        // Ensure the position is within viewport bounds
        const x = Math.max(
          0,
          Math.min(pos.x, window.innerWidth - panel.offsetWidth),
        );
        const y = Math.max(
          0,
          Math.min(pos.y, window.innerHeight - panel.offsetHeight),
        );

        panel.style.left = `${x}px`;
        panel.style.top = `${y}px`;
        panel.style.right = "auto";
        panel.style.bottom = "auto";

        if (pos.collapsed) {
          const body = panel.querySelector("#fa-panel-body") as HTMLElement;
          const btn = panel.querySelector(
            "#fa-panel-collapse",
          ) as HTMLButtonElement;
          if (body) body.classList.add("collapsed");
          if (btn) btn.textContent = "□";
        }
      } else {
        // Default position: bottom-right corner
        panel.style.right = "20px";
        panel.style.bottom = "20px";
      }
    });
  } catch {
    panel.style.right = "20px";
    panel.style.bottom = "20px";
  }
}
