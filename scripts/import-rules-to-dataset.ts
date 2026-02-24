/// <reference types="node" />
/**
 * Import rules exported from the Fill All extension into the training dataset.
 *
 * Usage:
 *   npm run import:rules [path/to/fill-all-rules.json]
 *
 * The JSON file is downloaded from the extension options page:
 *   Cache & Treino → "Exportar Regras para Dataset"
 *
 * After running this script:
 *   npm run train:model
 *   npm run build
 *   → Reload the extension in Chrome
 *   → You can now safely delete the imported rules
 */

import * as fs from "fs";
import * as path from "path";

// ── Types ────────────────────────────────────────────────────────────────────

interface ExportedRule {
  id: string;
  urlPattern: string;
  fieldSelector: string;
  fieldName?: string;
  fieldType: string;
  fixedValue?: string;
  generator?: string;
  priority?: number;
  createdAt?: number;
  updatedAt?: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const USER_SAMPLES_FILE = path.resolve(
  process.cwd(),
  "src/lib/dataset/user-samples.ts",
);

/**
 * Types that are trainable by the TF.js model.
 * Must match the LABELS array in scripts/train-model.ts.
 */
const TRAINABLE_TYPES = new Set([
  "cpf",
  "cnpj",
  "cpf-cnpj",
  "rg",
  "email",
  "phone",
  "name",
  "first-name",
  "last-name",
  "full-name",
  "address",
  "street",
  "city",
  "state",
  "cep",
  "zip-code",
  "date",
  "birth-date",
  "password",
  "username",
  "company",
  "website",
  "product",
  "supplier",
  "employee-count",
  "job-title",
  "money",
  "number",
  "text",
]);

// ── Signal helpers (mirrors learning-store.ts) ───────────────────────────────

function normaliseSignals(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSignalsFromRule(rule: ExportedRule): string {
  const selectorTokens = rule.fieldSelector
    .replace(/[#.[\]=:'"]/g, " ")
    .replace(/>/g, " ")
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const parts = [
    rule.fieldType,
    rule.fieldName,
    selectorTokens,
    rule.fieldSelector,
  ].filter(Boolean) as string[];

  return normaliseSignals(parts.join(" "));
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const jsonPath =
    process.argv[2] ?? path.resolve(process.cwd(), "fill-all-rules.json");

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Arquivo não encontrado: ${jsonPath}`);
    console.error("");
    console.error("   Exporte as regras da página de opções da extensão:");
    console.error("   Cache & Treino → 'Exportar Regras para Dataset'");
    console.error("");
    console.error(
      "   Depois execute: npm run import:rules caminho/para/fill-all-rules.json",
    );
    process.exit(1);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  } catch {
    console.error(`❌ JSON inválido em: ${jsonPath}`);
    process.exit(1);
  }

  if (!Array.isArray(raw)) {
    console.error("❌ Formato inválido — esperado um array de regras");
    process.exit(1);
  }

  const rules = raw as ExportedRule[];
  console.log(`\n📥 ${rules.length} regra(s) encontrada(s) para importar\n`);

  // Read existing user-samples.ts to extract already-stored signals
  const currentContent = fs.readFileSync(USER_SAMPLES_FILE, "utf-8");
  const existingSignals = new Set<string>();
  const sigRegex = /signals:\s*"([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = sigRegex.exec(currentContent)) !== null) {
    existingSignals.add(match[1]);
  }

  const newSamples: Array<{
    signals: string;
    type: string;
    source: string;
    difficulty: string;
  }> = [];
  let skippedDuplicate = 0;
  let skippedNonTrainable = 0;
  let skippedEmpty = 0;

  for (const rule of rules) {
    if (!TRAINABLE_TYPES.has(rule.fieldType)) {
      skippedNonTrainable++;
      continue;
    }

    const signals = buildSignalsFromRule(rule);
    if (!signals) {
      skippedEmpty++;
      continue;
    }

    if (existingSignals.has(signals)) {
      skippedDuplicate++;
      continue;
    }

    newSamples.push({
      signals,
      type: rule.fieldType,
      source: "real-world",
      difficulty: "medium",
    });
    existingSignals.add(signals); // prevent duplicates within the same import
  }

  if (skippedNonTrainable > 0)
    console.log(
      `   ⚠️  ${skippedNonTrainable} ignorada(s) — tipo não treinável (select/checkbox/unknown)`,
    );
  if (skippedDuplicate > 0)
    console.log(
      `   ⏭️  ${skippedDuplicate} ignorada(s) — sinais já existentes`,
    );
  if (skippedEmpty > 0)
    console.log(`   ⏭️  ${skippedEmpty} ignorada(s) — sinais vazios`);

  if (newSamples.length === 0) {
    console.log(
      "\n✅ Nada a adicionar — todas as regras já estão no dataset.\n",
    );
    return;
  }

  // Build TypeScript lines for new samples
  const newLines = newSamples
    .map(
      (s) =>
        `  {\n    signals: "${s.signals}",\n    type: "${s.type}",\n    source: "${s.source}",\n    difficulty: "${s.difficulty}",\n  },`,
    )
    .join("\n");

  // Insert new samples before the closing ]; of USER_SAMPLES
  const updated = currentContent.replace(
    /(\nexport const USER_SAMPLES: TrainingSample\[\] = \[)([\s\S]*?)(\n\];)/,
    (_, open: string, body: string, close: string) => {
      const trimmedBody = body.trimEnd();
      const separator = trimmedBody.length > 0 ? "\n" : "";
      return `${open}${body}${separator}${newLines}${close}`;
    },
  );

  if (updated === currentContent) {
    console.error(
      "\n❌ Não foi possível atualizar user-samples.ts — padrão não encontrado",
    );
    process.exit(1);
  }

  fs.writeFileSync(USER_SAMPLES_FILE, updated, "utf-8");

  console.log(
    `\n✅ ${newSamples.length} nova(s) amostra(s) adicionada(s) em src/lib/dataset/user-samples.ts`,
  );

  console.log("\n📋 Amostras importadas:");
  for (const s of newSamples) {
    console.log(`   [${s.type}]  "${s.signals}"`);
  }

  console.log("\n🏋️  Próximos passos:");
  console.log("   1. npm run train:model");
  console.log("   2. npm run build");
  console.log("   3. Recarregue a extensão no Chrome");
  console.log("   4. Você pode deletar as regras importadas com segurança\n");
}

main().catch((err: unknown) => {
  console.error("Importação falhou:", err);
  process.exit(1);
});
