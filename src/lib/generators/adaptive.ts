/**
 * Shared generation adaptation helpers.
 * Keeps generated values aligned with native input constraints when available.
 */

/**
 * Constraints extracted from the target HTML element to guide value generation.
 * Used to ensure generated values satisfy native input validation rules.
 */
export interface ValueConstraints {
  element?:
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement
    | HTMLElement;
  maxLength?: number;
  requireValidity?: boolean;
  attempts?: number;
}

const DEFAULT_ATTEMPTS = 12;

/**
 * Repeatedly invokes a generator function until the result satisfies the given
 * constraints (e.g. `maxLength`, native element validity).
 * @param generatorFn - Zero-arg function that produces a random value
 * @param constraints - Optional element/length constraints to satisfy
 * @returns A value that passes validation, or empty string if `requireValidity` is set and no valid value is found
 */
export function generateWithConstraints(
  generatorFn: () => string,
  constraints: ValueConstraints = {},
): string {
  const attempts = constraints.attempts ?? DEFAULT_ATTEMPTS;
  let lastGenerated = "";

  for (let i = 0; i < attempts; i += 1) {
    const raw = generatorFn();
    lastGenerated = raw;
    const adapted = adaptGeneratedValue(raw, {
      ...constraints,
      requireValidity: true,
    });
    if (adapted) return adapted;
  }

  if (constraints.requireValidity) {
    return "";
  }

  return adaptGeneratedValue(lastGenerated, {
    ...constraints,
    requireValidity: false,
  });
}

/**
 * Adapts a generated string value to fit within element constraints.
 * Tries the original value, trimmed, collapsed-whitespace, and digits-only variants.
 * @param value - Raw generated value
 * @param constraints - Optional element/length constraints
 * @returns The first variant that satisfies constraints, or empty string
 */
export function adaptGeneratedValue(
  value: string,
  constraints: ValueConstraints = {},
): string {
  const maxLength = resolveMaxLength(constraints);
  const candidates = buildValueCandidates(value, maxLength);

  for (const candidate of candidates) {
    if (isValueValidForElement(constraints.element, candidate)) {
      return candidate;
    }
  }

  return constraints.requireValidity ? "" : (candidates[0] ?? "");
}

function buildValueCandidates(value: string, maxLength: number): string[] {
  const candidates: string[] = [];

  const pushCandidate = (candidate: string): void => {
    if (!candidate && candidate !== "") return;
    if (!candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  };

  pushCandidate(value);

  const trimmed = value.trim();
  if (trimmed !== value) pushCandidate(trimmed);

  const collapsedWhitespace = value.replace(/\s+/g, " ").trim();
  if (collapsedWhitespace && collapsedWhitespace !== value) {
    pushCandidate(collapsedWhitespace);
  }

  const digitsOnly = value.replace(/\D+/g, "");
  if (digitsOnly && digitsOnly !== value) {
    pushCandidate(digitsOnly);
  }

  if (maxLength > 0) {
    for (const candidate of [...candidates]) {
      if (candidate.length > maxLength) {
        pushCandidate(candidate.slice(0, maxLength));
      }
    }
  }

  return candidates;
}

function resolveMaxLength(constraints: ValueConstraints): number {
  if (typeof constraints.maxLength === "number") {
    return constraints.maxLength;
  }

  const el = constraints.element;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.maxLength;
  }

  return -1;
}

function isValueValidForElement(
  element: ValueConstraints["element"],
  value: string,
): boolean {
  if (!element) return true;

  // Custom component wrappers (div, span, etc.) are not native form elements.
  // Skip the validity probe and trust the adapter to accept any generated value.
  if (
    !(element instanceof HTMLInputElement) &&
    !(element instanceof HTMLTextAreaElement) &&
    !(element instanceof HTMLSelectElement)
  ) {
    return true;
  }

  if (element instanceof HTMLSelectElement) {
    return true;
  }

  if (
    element instanceof HTMLInputElement &&
    (element.type === "checkbox" ||
      element.type === "radio" ||
      element.type === "file")
  ) {
    return true;
  }

  const probe = element.cloneNode(false) as
    | HTMLInputElement
    | HTMLTextAreaElement;

  try {
    probe.value = value;
    return probe.checkValidity();
  } catch {
    return false;
  }
}
