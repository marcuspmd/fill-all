/**
 * ActionCard — Botão de ação do painel de actions do DevTools.
 */

import { h } from "preact";

export interface ActionCardProps {
  icon: string;
  label: string;
  desc: string;
  variant: "primary" | "secondary" | "outline" | "ai";
  id?: string;
  active?: boolean;
  onClick: () => void;
}

export function ActionCard({
  icon,
  label,
  desc,
  variant,
  active = false,
  id,
  onClick,
}: ActionCardProps) {
  return (
    <button
      class={`action-card ${variant}${active ? " active" : ""}`}
      id={id}
      onClick={onClick}
    >
      <span class="card-icon">{icon}</span>
      <span class="card-label">{label}</span>
      <span class="card-desc">{desc}</span>
    </button>
  );
}
