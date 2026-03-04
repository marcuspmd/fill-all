/**
 * index.tsx — Barrel de componentes do DevTools Panel.
 *
 * Também exporta `renderTo` — helper para montar componentes Preact
 * em elementos do DOM existentes, sem precisar importar preact/render
 * em cada módulo.
 *
 * Uso:
 *   import { renderTo, ActionCard } from "../components";
 *   renderTo(document.getElementById("content"), <ActionCard ... />);
 */

import { render, h } from "preact";
import type { VNode } from "preact";

export { ActionCard } from "./action-card";
export type { ActionCardProps } from "./action-card";

export { StatusBar } from "./status-bar";
export type { StatusBarProps } from "./status-bar";

/**
 * Monta um componente Preact num elemento do DOM.
 * Se o elemento não existir, não faz nada (safe para chamadas durante transição de abas).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderTo(container: Element | null, vnode: VNode<any>): void {
  if (!container) return;
  render(vnode, container);
}
