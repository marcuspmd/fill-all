/**
 * AppShell — Preact component for the DevTools panel top-level shell.
 *
 * Renders the toolbar (title + tabs + options button) and a content slot.
 * Tab switching is driven by state in the parent (panelState) so no local
 * state is needed here.
 */

import { h, type ComponentChildren } from "preact";
import type { TabId } from "@/devtools/panel-state";
import { t } from "@/lib/i18n";

export interface AppShellProps {
  activeTab: TabId;
  onTabSwitch: (tab: TabId) => void;
  onOptions: () => void;
  children?: ComponentChildren;
}

type TabDef = { id: TabId; icon: string; label: () => string };

const TABS: TabDef[] = [
  { id: "actions", icon: "⚡", label: () => t("tabActions") },
  { id: "fields", icon: "🔍", label: () => t("tabFields") },
  { id: "forms", icon: "📄", label: () => t("tabForms") },
  { id: "record", icon: "🔴", label: () => t("tabRecord") },
  { id: "log", icon: "📋", label: () => t("tabLog") },
];

export function AppShell({
  activeTab,
  onTabSwitch,
  onOptions,
  children,
}: AppShellProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">🔧 Fill All</span>
          <div class="tabs">
            {TABS.map(({ id, icon, label }) => (
              <button
                key={id}
                class={`tab${activeTab === id ? " active" : ""}`}
                data-tab={id}
                onClick={() => onTabSwitch(id)}
              >
                {icon} {label()}
              </button>
            ))}
          </div>
        </div>
        <div class="toolbar-right">
          <button
            class="toolbar-btn"
            id="btn-options"
            title={t("fpOpenOptions")}
            onClick={onOptions}
          >
            ⚙️
          </button>
        </div>
      </div>
      <div class="content" id="content">
        {children}
      </div>
    </div>
  );
}
