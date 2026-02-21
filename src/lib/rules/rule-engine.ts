/**
 * Rule engine — determines which value to use for a given field
 */

import type { FieldRule, FormField, GenerationResult } from "@/types";
import { getRulesForUrl, getSavedFormsForUrl } from "@/lib/storage/storage";
import { generate, generateMoney, generateNumber } from "@/lib/generators";

/**
 * Resolves the value for a single field, using this priority:
 * 1. (optional) AI first — when forceAIFirst is true
 * 2. Saved form with fixed data (exact match)
 * 3. Field-specific rule with fixed value
 * 4. Field-specific rule with generator
 * 5. AI / TensorFlow fallback (all field types, not only "unknown")
 * 6. Default generator based on detected field type
 */
export async function resolveFieldValue(
  field: FormField,
  url: string,
  aiGenerateFn?: (field: FormField) => Promise<string>,
  forceAIFirst = false,
): Promise<GenerationResult> {
  const selector = field.selector;

  const fieldDesc = `selector="${selector}" label="${field.label ?? ""}" type="${field.fieldType}"`;
  console.log(
    `[Fill All / Rule Engine] Resolvendo campo: ${fieldDesc}${forceAIFirst ? " [forceAIFirst=true]" : ""}`,
  );

  // 1. AI first (when flag is enabled)
  if (forceAIFirst && aiGenerateFn) {
    console.log(
      `[Fill All / Rule Engine] Tentando AI primeiro (forceAIFirst)...`,
    );
    try {
      const value = await aiGenerateFn(field);
      if (value) {
        console.log(
          `[Fill All / Rule Engine] AI (forceAIFirst) gerou: "${value}"`,
        );
        return { fieldSelector: selector, value, source: "ai" };
      }
    } catch (err) {
      console.warn(`[Fill All / Rule Engine] AI (forceAIFirst) falhou:`, err);
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
      let value: string;
      if (matchingRule.generator === "money") {
        value = generateMoney(matchingRule.moneyMin, matchingRule.moneyMax);
      } else if (matchingRule.generator === "number") {
        value = generateNumber(matchingRule.numberMin, matchingRule.numberMax);
      } else {
        value = generate(matchingRule.generator);
      }
      return { fieldSelector: selector, value, source: "generator" };
    }

    // If the rule says to use AI
    if (matchingRule.generator === "ai" && aiGenerateFn) {
      const value = await aiGenerateFn(field);
      return { fieldSelector: selector, value, source: "ai" };
    }
  }

  // 5. Try AI generation if available (all field types)
  if (aiGenerateFn) {
    console.log(
      `[Fill All / Rule Engine] Tentando AI como fallback para campo: ${fieldDesc}`,
    );
    try {
      const value = await aiGenerateFn(field);
      if (value) {
        console.log(`[Fill All / Rule Engine] AI fallback gerou: "${value}"`);
        return { fieldSelector: selector, value, source: "ai" };
      }
      console.warn(
        `[Fill All / Rule Engine] AI fallback retornou vazio para: ${fieldDesc}`,
      );
    } catch (err) {
      console.warn(
        `[Fill All / Rule Engine] AI fallback falhou para: ${fieldDesc}`,
        err,
      );
      // Fall through to default generator
    }
  } else {
    console.log(
      `[Fill All / Rule Engine] Sem função de AI disponível para: ${fieldDesc}`,
    );
  }

  // 6. Default generator
  const value = generate(field.fieldType);
  console.log(
    `[Fill All / Rule Engine] Gerador padrão (${field.fieldType}): "${value}"`,
  );
  return { fieldSelector: selector, value, source: "generator" };
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
