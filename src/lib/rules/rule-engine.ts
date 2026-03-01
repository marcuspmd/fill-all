/**
 * Rule engine — determines which value to use for a given field
 */

import type {
  FieldRule,
  FormField,
  GenerationResult,
  FieldType,
} from "@/types";
import { FIELD_TYPE_DEFINITIONS } from "@/types";
import { getRulesForUrl } from "@/lib/storage/storage";
import { generate } from "@/lib/generators";
import {
  adaptGeneratedValue,
  generateWithConstraints,
} from "@/lib/generators/adaptive";
import { detectDateFormat, reformatDate } from "@/lib/generators/date";
import { createLogger } from "@/lib/logger";

const log = createLogger("RuleEngine");

const DEFAULT_AI_TIMEOUT_MS = 5000;

/**
 * Generator keys where AI genuinely adds value (free-text / open-ended).
 * Every other type has a deterministic generator — calling AI wastes time.
 */
const AI_USEFUL_GENERATORS = new Set([
  "text",
  "description",
  "notes",
  "search-text",
  "fallback-text",
]);

/**
 * Field types that have deterministic, high-quality generators.
 * Derived from FIELD_TYPE_DEFINITIONS: any type whose generator is NOT
 * in the AI_USEFUL_GENERATORS set is considered generator-only.
 */
const GENERATOR_ONLY_TYPES = new Set<FieldType>(
  FIELD_TYPE_DEFINITIONS.filter(
    (d) => d.generator && !AI_USEFUL_GENERATORS.has(d.generator),
  ).map((d) => d.type),
);

/**
 * Field types that produce date-like values (ISO strings).
 * For these, we detect the display format expected by the field and reformat
 * the generated ISO string accordingly before returning it.
 */
const DATE_FIELD_TYPES = new Set<FieldType>([
  "date",
  "birth-date",
  "start-date",
  "end-date",
  "due-date",
]);

/**
 * Generates a date value for a field, formatted according to the field's
 * detected expected format (ISO, BR, or US).
 */
function generateDateForField(fieldType: FieldType, field: FormField): string {
  const isoDate = generate(fieldType);
  const format = detectDateFormat({
    inputType: field.inputType,
    placeholder: field.placeholder,
    pattern: field.pattern,
  });
  return reformatDate(isoDate, format);
}

/** Wraps an AI call with a hard timeout so it never blocks indefinitely. */
async function callAiWithTimeout(
  fn: (field: FormField) => Promise<string>,
  field: FormField,
  context: string,
  timeoutMs = DEFAULT_AI_TIMEOUT_MS,
): Promise<string> {
  const label = field.label ?? field.id ?? field.selector;
  log.info(
    `🤖 AI gerando valor para: "${label}" (${context}, timeout ${timeoutMs}ms)...`,
  );
  const start = Date.now();

  const result = await Promise.race([
    fn(field),
    new Promise<string>((_, reject) =>
      setTimeout(
        () => reject(new Error(`AI timeout (${timeoutMs}ms)`)),
        timeoutMs,
      ),
    ),
  ]);

  log.info(
    `✅ AI concluiu em ${Date.now() - start}ms: "${result.slice(0, 60)}"`,
  );
  return result;
}

/**
 * Resolves the value for a single field, using this priority:
 * 1. (optional) AI first — when forceAIFirst is true
 * 2. Saved form with fixed data (exact match)
 * 3. Field-specific rule with fixed value
 * 4. Field-specific rule with generator
 * 5. Default generator based on detected field type
 * 6. AI as last resort (only when default generator returns empty, e.g. select fields)
 */
export async function resolveFieldValue(
  field: FormField,
  url: string,
  aiGenerateFn?: (field: FormField) => Promise<string>,
  forceAIFirst = false,
  aiTimeoutMs = DEFAULT_AI_TIMEOUT_MS,
): Promise<GenerationResult> {
  const selector = field.selector;

  const fieldDesc = `selector="${selector}" label="${field.label ?? ""}" type="${field.fieldType}"`;
  log.debug(
    `Resolvendo campo: ${fieldDesc}${forceAIFirst ? " [forceAIFirst=true]" : ""}`,
  );

  // 1. AI first (when flag is enabled) — only for fields where AI genuinely helps
  if (
    forceAIFirst &&
    aiGenerateFn &&
    !GENERATOR_ONLY_TYPES.has(field.fieldType)
  ) {
    try {
      const aiValue = await callAiWithTimeout(
        aiGenerateFn,
        field,
        "forceAIFirst",
        aiTimeoutMs,
      );
      const value = adaptGeneratedValue(aiValue, {
        element: field.element,
        requireValidity: true,
      });
      if (value) {
        return { fieldSelector: selector, value, source: "ai" };
      }
    } catch (err) {
      log.warn(`AI (forceAIFirst) falhou:`, err);
      // Fall through to normal priority order
    }
  }

  // 2. Check field rules (saved forms are only applied manually via APPLY_TEMPLATE)
  const rules = await getRulesForUrl(url);
  const matchingRule = findMatchingRule(rules, field);

  if (matchingRule) {
    if (matchingRule.fixedValue) {
      return {
        fieldSelector: selector,
        value: matchingRule.fixedValue,
        source: "rule",
      };
    }

    // Handle select fields with explicit option index
    if (
      field.element instanceof HTMLSelectElement &&
      matchingRule.selectOptionIndex !== undefined
    ) {
      const options = Array.from(field.element.options).filter((o) => o.value);
      if (matchingRule.selectOptionIndex === 0) {
        // auto — pick random non-empty option
        if (options.length > 0) {
          const random = options[Math.floor(Math.random() * options.length)];
          return {
            fieldSelector: selector,
            value: random.value,
            source: "rule",
          };
        }
      } else {
        // pick by 1-based index
        const opt = field.element.options[matchingRule.selectOptionIndex - 1];
        if (opt) {
          return { fieldSelector: selector, value: opt.value, source: "rule" };
        }
      }
    }

    // If the rule specifies a generator type
    if (
      matchingRule.generator !== "auto" &&
      matchingRule.generator !== "ai" &&
      matchingRule.generator !== "tensorflow"
    ) {
      const ruleGenerator = matchingRule.generator as FieldType;
      if (DATE_FIELD_TYPES.has(ruleGenerator)) {
        const value = generateDateForField(ruleGenerator, field);
        return { fieldSelector: selector, value, source: "generator" };
      }
      const value = generateWithConstraints(() => generate(ruleGenerator), {
        element: field.element,
        requireValidity: false,
      });
      return { fieldSelector: selector, value, source: "generator" };
    }

    // If the rule says to use AI
    if (matchingRule.generator === "ai" && aiGenerateFn) {
      try {
        const aiValue = await callAiWithTimeout(
          aiGenerateFn,
          field,
          "rule:ai",
          aiTimeoutMs,
        );
        const value = adaptGeneratedValue(aiValue, {
          element: field.element,
          requireValidity: false,
        });
        return { fieldSelector: selector, value, source: "ai" };
      } catch (err) {
        log.warn(`AI (rule) falhou:`, err);
      }
    }
  }

  // 5. Default generator based on detected field type
  const effectiveType = getEffectiveFieldType(field);
  if (DATE_FIELD_TYPES.has(effectiveType)) {
    const value = generateDateForField(effectiveType, field);
    log.debug(`Gerador de data (${effectiveType}, detectado): "${value}"`);
    return { fieldSelector: selector, value, source: "generator" };
  }
  const value = generateWithConstraints(() => generate(effectiveType), {
    element: field.element,
    requireValidity: true,
  });
  if (value) {
    log.debug(`Gerador padrão (${effectiveType}): "${value}"`);
    return { fieldSelector: selector, value, source: "generator" };
  }

  // 5.5 For <select> elements: pick a random valid option directly.
  // AI cannot know which options are available in the DOM, so we must handle this ourselves.
  if (field.element instanceof HTMLSelectElement) {
    const validOptions = Array.from(field.element.options).filter(
      (opt) => opt.value,
    );
    if (validOptions.length > 0) {
      const random =
        validOptions[Math.floor(Math.random() * validOptions.length)];
      log.debug(
        `Select aleatório: "${random.value}" (${validOptions.length} opções disponíveis)`,
      );
      return {
        fieldSelector: selector,
        value: random.value,
        source: "generator",
      };
    }
    // No valid options — return empty, no point calling AI
    log.warn(`Select sem opções válidas para: ${fieldDesc}`);
    return { fieldSelector: selector, value: "", source: "generator" };
  }

  // 5.6 For checkbox/radio: the value is fixed (true/false), AI adds no value here.
  if (
    field.element instanceof HTMLInputElement &&
    (field.element.type === "checkbox" || field.element.type === "radio")
  ) {
    return { fieldSelector: selector, value: "true", source: "generator" };
  }

  // 6. AI as last resort — only for free-text fields where the generator returned empty
  if (aiGenerateFn && !GENERATOR_ONLY_TYPES.has(field.fieldType)) {
    log.info(
      `Gerador padrão vazio — tentando AI como último recurso para: ${fieldDesc}`,
    );
    try {
      const aiValue = await callAiWithTimeout(
        aiGenerateFn,
        field,
        "último recurso",
        aiTimeoutMs,
      );
      const adaptedAiValue = adaptGeneratedValue(aiValue, {
        element: field.element,
        requireValidity: true,
      });
      if (adaptedAiValue) {
        return { fieldSelector: selector, value: adaptedAiValue, source: "ai" };
      }
      log.warn(`AI (último recurso) retornou vazio para: ${fieldDesc}`);
    } catch (err) {
      log.warn(`AI (último recurso) falhou para: ${fieldDesc}`, err);
    }
  }

  return { fieldSelector: selector, value: value || "", source: "generator" };
}

function getEffectiveFieldType(field: FormField): FieldType {
  if (
    (field.fieldType === "unknown" || field.fieldType === "select") &&
    field.contextualType &&
    field.contextualType !== "unknown" &&
    field.contextualType !== "select"
  ) {
    return field.contextualType;
  }
  return field.fieldType;
}

function findMatchingRule(
  rules: FieldRule[],
  field: FormField,
): FieldRule | undefined {
  // Sort by priority (descending) so higher priority rules take precedence
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);

  return sorted.find((rule) => {
    // Match by CSS selector
    if (rule.fieldSelector && field.element.matches(rule.fieldSelector)) {
      return true;
    }
    // Match by field name
    if (
      rule.fieldName &&
      (field.name === rule.fieldName || field.id === rule.fieldName)
    ) {
      return true;
    }
    return false;
  });
}
