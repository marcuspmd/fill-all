/**
 * src/lib/ui/components/index.tsx — barrel export de todos os componentes Preact de UI.
 */

import { render } from "preact";
import type { VNode } from "preact";

export * from "./badges";
export * from "./app-shell";
export * from "./fields-tab-view";
export * from "./actions-tab-view";
export * from "./forms-tab-view";
export * from "./record-tab-view";
export * from "./log-tab-view";
export * from "./devtools";

/**
 * Monta um componente Preact num elemento do DOM.
 * Se o elemento não existir, não faz nada (safe para chamadas durante transição de abas).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderTo(container: Element | null, vnode: VNode<any>): void {
  if (!container) return;
  render(vnode, container);
}
