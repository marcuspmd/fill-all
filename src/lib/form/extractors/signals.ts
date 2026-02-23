import { Signal } from "@/types";

export function extractPrimarySignals(el: HTMLElement): Signal[] {
  const signals: Signal[] = [];

  const name = el.getAttribute("name");
  if (name) signals.push({ source: "name", value: name });

  if (el.id) signals.push({ source: "id", value: el.id });

  const placeholder = el.getAttribute("placeholder");
  if (placeholder) signals.push({ source: "placeholder", value: placeholder });

  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) signals.push({ source: "aria-label", value: ariaLabel });

  const autocomplete = el.getAttribute("autocomplete");
  if (autocomplete)
    signals.push({ source: "autocomplete", value: autocomplete });

  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`);
    const labelText = label?.textContent?.trim();
    if (labelText) signals.push({ source: "label", value: labelText });
  }

  return signals;
}

export function extractSecondarySignals(el: HTMLElement): Signal[] {
  const signals: Signal[] = [];
  const parent = el.closest("div, section, fieldset");

  if (!parent) return signals;

  parent.querySelectorAll("small, .hint, .description").forEach((h) => {
    const text = h.textContent?.trim();
    if (text) signals.push({ source: "nearby-text", value: text });
  });

  return signals;
}

export function extractStructuralSignals(el: HTMLElement): Signal[] {
  const signals: Signal[] = [];
  const seen = new Set<string>();
  let current = el.parentElement;

  while (current) {
    const heading = current.querySelector("h1, h2, h3, legend");
    const text = heading?.textContent?.trim();
    if (text && !seen.has(text)) {
      seen.add(text);
      signals.push({ source: "section-title", value: text });
    }
    current = current.parentElement;
  }

  return signals;
}
