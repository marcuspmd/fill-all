/**
 * Rule engine — determines which value to use for a given field
 */

import type {
  FieldRule,
  FormField,
  GenerationResult,
  FieldType,
} from "@/types";
import { getRulesForUrl, getSavedFormsForUrl } from "@/lib/storage/storage";
import { generate, generateMoney, generateNumber } from "@/lib/generators";
import {
  adaptGeneratedValue,
  generateWithConstraints,
} from "@/lib/generators/adaptive";
import { createLogger } from "@/lib/logger";

const log = createLogger("RuleEngine");

const AI_TIMEOUT_MS = 5_000;

/**
 * Field types that have deterministic, high-quality generators.
 * AI adds no value for these — calling it only wastes time.
 * AI is only useful for `text`, `description`, `notes`, `search`, `unknown`.
 */
const GENERATOR_ONLY_TYPES = new Set<FieldType>([
  "cpf",
  "cnpj",
  "cpf-cnpj",
  "rg",
  "passport",
  "cnh",
  "pis",
  "national-id",
  "tax-id",
  "name",
  "first-name",
  "last-name",
  "full-name",
  "email",
  "phone",
  "mobile",
  "whatsapp",
  "address",
  "street",
  "house-number",
  "complement",
  "neighborhood",
  "city",
  "state",
  "country",
  "cep",
  "zip-code",
  "date",
  "birth-date",
  "start-date",
  "end-date",
  "due-date",
  "money",
  "price",
  "amount",
  "discount",
  "tax",
  "credit-card-number",
  "credit-card-expiration",
  "credit-card-cvv",
  "pix-key",
  "company",
  "supplier",
  "employee-count",
  "job-title",
  "department",
  "username",
  "password",
  "confirm-password",
  "otp",
  "verification-code",
  "product",
  "product-name",
  "sku",
  "quantity",
  "coupon",
  "number",
  "website",
  "url",
  "select",
  "checkbox",
  "radio",
  "file",
]);

/** Wraps an AI call with a hard timeout so it never blocks indefinitely. */
async function callAiWithTimeout(
  fn: (field: FormField) => Promise<string>,
  field: FormField,
  context: string,
): Promise<string> {
  const label = field.label ?? field.id ?? field.selector;
  log.info(
    `🤖 AI gerando valor para: "${label}" (${context}, timeout ${AI_TIMEOUT_MS}ms)...`,
  );
  const start = Date.now();

  const result = await Promise.race([
    fn(field),
    new Promise<string>((_, reject) =>
      setTimeout(
        () => reject(new Error(`AI timeout (${AI_TIMEOUT_MS}ms)`)),
        AI_TIMEOUT_MS,
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

  // 2. Check saved forms
  const savedForms = await getSavedFormsForUrl(url);
  for (const form of savedForms) {
    if (form.fields[selector]) {
      return {
        fieldSelector: selector,
        value: form.fields[selector],
        source: "fixed",
      };
    }
    // Also try matching by field name or id
    if (field.name && form.fields[field.name]) {
      return {
        fieldSelector: selector,
        value: form.fields[field.name],
        source: "fixed",
      };
    }
    if (field.id && form.fields[field.id]) {
      return {
        fieldSelector: selector,
        value: form.fields[field.id],
        source: "fixed",
      };
    }
  }

  // 2 & 3. Check field rules
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
      let value: string;
      if (ruleGenerator === "money") {
        value = generateWithConstraints(
          () => generateMoney(matchingRule.moneyMin, matchingRule.moneyMax),
          { element: field.element, requireValidity: false },
        );
      } else if (ruleGenerator === "number") {
        value = generateWithConstraints(
          () => generateNumber(matchingRule.numberMin, matchingRule.numberMax),
          { element: field.element, requireValidity: false },
        );
      } else {
        value = generateWithConstraints(() => generate(ruleGenerator), {
          element: field.element,
          requireValidity: false,
        });
      }
      return { fieldSelector: selector, value, source: "generator" };
    }

    // If the rule says to use AI
    if (matchingRule.generator === "ai" && aiGenerateFn) {
      try {
        const aiValue = await callAiWithTimeout(aiGenerateFn, field, "rule:ai");
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
  return rules.find((rule) => {
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
