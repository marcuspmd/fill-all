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

  // 5. Default generator based on detected field type
  const value = generate(field.fieldType);
  if (value) {
    console.log(
      `[Fill All / Rule Engine] Gerador padrão (${field.fieldType}): "${value}"`,
    );
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
      console.log(
        `[Fill All / Rule Engine] Select aleatório: "${random.value}" (${validOptions.length} opções disponíveis)`,
      );
      return {
        fieldSelector: selector,
        value: random.value,
        source: "generator",
      };
    }
    // No valid options — return empty, no point calling AI
    console.warn(
      `[Fill All / Rule Engine] Select sem opções válidas para: ${fieldDesc}`,
    );
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
  if (aiGenerateFn) {
    console.log(
      `[Fill All / Rule Engine] Gerador padrão retornou vazio, tentando AI como último recurso para: ${fieldDesc}`,
    );
    try {
      const aiValue = await aiGenerateFn(field);
      if (aiValue) {
        console.log(
          `[Fill All / Rule Engine] AI (último recurso) gerou: "${aiValue}"`,
        );
        return { fieldSelector: selector, value: aiValue, source: "ai" };
      }
      console.warn(
        `[Fill All / Rule Engine] AI (último recurso) retornou vazio para: ${fieldDesc}`,
      );
    } catch (err) {
      console.warn(
        `[Fill All / Rule Engine] AI (último recurso) falhou para: ${fieldDesc}`,
        err,
      );
    }
  }

  return { fieldSelector: selector, value: value || "", source: "generator" };
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
