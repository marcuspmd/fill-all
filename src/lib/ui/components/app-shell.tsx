/**
 * AppShell — Preact component for the DevTools panel top-level shell.
 *
 * Renders the toolbar (title + tabs + options button) and a content slot.
 * Tab switching is driven by state in the parent (panelState) so no local
 * state is needed here.
 */

import { h, type ComponentChildren } from "preact";
import type { TabId } from "@/devtools/panel-state";
import type { PanelTheme } from "@/devtools/panel-state";
import { t } from "@/lib/i18n";

export interface AppShellProps {
  activeTab: TabId;
  onTabSwitch: (tab: TabId) => void;
  onOptions: () => void;
  theme: PanelTheme;
  onThemeToggle: () => void;
  children?: ComponentChildren;
}

type TabDef = { id: TabId; icon: string; label: () => string };

const TABS: TabDef[] = [
  { id: "actions", icon: "bolt", label: () => t("tabActions") },
  { id: "fields", icon: "search", label: () => t("tabFields") },
  { id: "forms", icon: "description", label: () => t("tabForms") },
  { id: "record", icon: "fiber_manual_record", label: () => t("tabRecord") },
  { id: "demo", icon: "smart_display", label: () => t("tabDemo") },
  { id: "log", icon: "assignment", label: () => t("tabLog") },
];

const THEME_ICONS: Record<PanelTheme, string> = {
  dark: "dark_mode",
  light: "light_mode",
  system: "brightness_auto",
};

const THEME_TITLES: Record<PanelTheme, string> = {
  dark: "Tema: Escuro — clicar para Claro",
  light: "Tema: Claro — clicar para Sistema",
  system: "Tema: Sistema — clicar para Escuro",
};

export function AppShell({
  activeTab,
  onTabSwitch,
  onOptions,
  theme,
  onThemeToggle,
  children,
}: AppShellProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">Fill All</span>
          <div class="tabs">
            {TABS.map(({ id, icon, label }) => (
              <button
                key={id}
                class={`tab${activeTab === id ? " active" : ""}`}
                data-tab={id}
                onClick={() => onTabSwitch(id)}
              >
                <span class="material-icons-round">{icon}</span>
                {label()}
              </button>
            ))}
          </div>
        </div>
        <div class="toolbar-right">
          <button
            class="toolbar-btn"
            id="btn-theme"
            title={THEME_TITLES[theme]}
            onClick={onThemeToggle}
          >
            <span class="material-icons-round">{THEME_ICONS[theme]}</span>
          </button>
          <button
            class="toolbar-btn"
            id="btn-options"
            title={t("fpOpenOptions")}
            onClick={onOptions}
          >
            <span class="material-icons-round">settings</span>
          </button>
        </div>
      </div>
      <div class="content" id="content">
        {children}
      </div>
    </div>
  );
}
