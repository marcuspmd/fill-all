/**
 * Badge components — TypeBadge, MethodBadge, ConfidenceBadge.
 * Replace the HTML-string renderers from renderers.ts for JSX contexts.
 */

import { h, Fragment } from "preact";
import {
  TYPE_COLORS,
  METHOD_COLORS,
  getConfidenceColor,
} from "@/lib/ui/constants";

// ── TypeBadge ────────────────────────────────────────────────────────────────

interface TypeBadgeProps {
  type: string;
  prefix?: string;
}

export function TypeBadge({ type, prefix = "" }: TypeBadgeProps) {
  const color = TYPE_COLORS[type] ?? "#64748b";
  return (
    <span class={`${prefix}type-badge`} style={{ background: color }}>
      {type}
    </span>
  );
}

// ── MethodBadge ──────────────────────────────────────────────────────────────

interface MethodBadgeProps {
  method: string;
  prefix?: string;
}

export function MethodBadge({ method, prefix = "" }: MethodBadgeProps) {
  const color = METHOD_COLORS[method] ?? "#334155";
  return (
    <span
      class={`${prefix}method-badge`}
      style={{ background: color, color: "#fff" }}
    >
      {method}
    </span>
  );
}

// ── ConfidenceBadge ──────────────────────────────────────────────────────────

interface ConfidenceBadgeProps {
  confidence: number | undefined;
  prefix?: string;
}

export function ConfidenceBadge({
  confidence,
  prefix = "",
}: ConfidenceBadgeProps) {
  const conf = confidence ?? 0;
  const percent = Math.round(conf * 100);
  const color = getConfidenceColor(conf);
  return (
    <Fragment>
      <span class={`${prefix}confidence-bar`}>
        <span
          class={`${prefix}confidence-fill`}
          style={{ width: `${percent}%`, background: color }}
        />
      </span>
      <span style={{ fontSize: "10px", color }}>{percent}%</span>
    </Fragment>
  );
}
