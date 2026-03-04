/**
 * StatusBar — Barra de status do painel, exibe contagem de campos detectados.
 */

import { h } from "preact";

export interface StatusBarProps {
  count: number;
  label: string;
  emptyLabel: string;
}

export function StatusBar({ count, label, emptyLabel }: StatusBarProps) {
  return (
    <div class="status-bar" id="status-bar">
      {count > 0 ? `${count} ${label}` : emptyLabel}
    </div>
  );
}
