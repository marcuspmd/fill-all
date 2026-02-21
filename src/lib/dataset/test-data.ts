/**
 * Test Data (Control Set) — Final evaluation of classifier performance
 *
 * This dataset is used ONCE after training is complete to produce a final
 * accuracy report. It is never tweaked to improve metrics — it acts as the
 * "ground truth" for release readiness.
 *
 * Most samples are collected from real-world websites or from user-reported
 * misclassifications, making them the hardest and most realistic scenarios.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * RULES:
 *   1. NEVER look at test data during training or hyperparameter tuning
 *   2. Add samples ONLY when new edge cases are discovered in production
 *   3. Keep ≈ equal representation across types (min 2 per type)
 *   4. Mark the `origin` field accurately
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { FieldType } from "@/types";

export interface TestSample {
  /** Normalised signals string */
  signals: string;
  /** Ground truth field type */
  expectedType: FieldType;
  /** Where the sample was captured */
  origin: "real-site" | "user-report" | "synthetic-hard";
  /** Domain or description of origin */
  originDetail: string;
  /** HTML input type when available */
  inputType?: string;
  /** Autocomplete attribute when present */
  autocomplete?: string;
}

export const TEST_SAMPLES: TestSample[] = [
  // ── CPF ──
  {
    signals: "cpf_cadastro cadastro cpf-input 000.000.000-00",
    expectedType: "cpf",
    origin: "real-site",
    originDetail: "Site de cadastro bancário",
    inputType: "text",
  },
  {
    signals: "cpf_comprador buyer_cpf cpf",
    expectedType: "cpf",
    origin: "real-site",
    originDetail: "E-commerce checkout",
    inputType: "text",
  },
  {
    signals: "inp_documento doc pessoa_fisica",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "Genérico sem menção explícita de CPF",
  },

  // ── CNPJ ──
  {
    signals: "cnpj_emissor emissor nota_fiscal cnpj",
    expectedType: "cnpj",
    origin: "real-site",
    originDetail: "Portal NF-e",
    inputType: "text",
  },
  {
    signals: "cnpj_destinatario dest cnpj",
    expectedType: "cnpj",
    origin: "real-site",
    originDetail: "Portal NF-e destinatário",
    inputType: "text",
  },

  // ── RG ──
  {
    signals: "rg_ident identidade_civil rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "Variação com identidade_civil",
    inputType: "text",
  },
  {
    signals: "numero_rg rg num_rg ___.___.___-_",
    expectedType: "rg",
    origin: "real-site",
    originDetail: "Portal gov.br",
    inputType: "text",
  },

  // ── EMAIL ──
  {
    signals: "email_notification notification email alert",
    expectedType: "email",
    origin: "real-site",
    originDetail: "Painel de notificações",
    inputType: "email",
    autocomplete: "email",
  },
  {
    signals: "electronic_mail inp_email email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Nome antigo electronic mail",
    inputType: "email",
  },

  // ── PHONE ──
  {
    signals: "tel_recado recado phone fone",
    expectedType: "phone",
    origin: "real-site",
    originDetail: "Formulário de agendamento médico",
    inputType: "tel",
    autocomplete: "tel",
  },
  {
    signals: "telefone_whats whatsapp phone",
    expectedType: "phone",
    origin: "real-site",
    originDetail: "Chat de atendimento",
    inputType: "tel",
  },

  // ── NAME ──
  {
    signals: "nome_aluno aluno nome student",
    expectedType: "name",
    origin: "real-site",
    originDetail: "Portal escolar",
    inputType: "text",
  },
  {
    signals: "nome_completo completo full-name",
    expectedType: "full-name",
    origin: "real-site",
    originDetail: "Cadastro e-commerce",
    inputType: "text",
    autocomplete: "name",
  },

  // ── FIRST/LAST NAME ──
  {
    signals: "nome_proprio first_name given",
    expectedType: "first-name",
    origin: "synthetic-hard",
    originDetail: "Misto pt/en",
    inputType: "text",
    autocomplete: "given-name",
  },
  {
    signals: "sobrenome_completo surname_field last",
    expectedType: "last-name",
    origin: "synthetic-hard",
    originDetail: "Misto pt/en",
    inputType: "text",
    autocomplete: "family-name",
  },

  // ── ADDRESS ──
  {
    signals: "endereco_correspondencia correspondencia endereco addr",
    expectedType: "address",
    origin: "real-site",
    originDetail: "Portal bancário",
    inputType: "text",
    autocomplete: "street-address",
  },
  {
    signals: "street_name rua_nome nome_rua logradouro",
    expectedType: "street",
    origin: "real-site",
    originDetail: "Cadastro de endereço",
    inputType: "text",
  },

  // ── CITY / STATE ──
  {
    signals: "cidade_residencia town city locality",
    expectedType: "city",
    origin: "real-site",
    originDetail: "Portal de emprego",
    inputType: "text",
    autocomplete: "address-level2",
  },
  {
    signals: "uf_select uf select_estado state",
    expectedType: "state",
    origin: "real-site",
    originDetail: "Checkout com select de UF",
    inputType: "select",
  },

  // ── CEP / ZIP ──
  {
    signals: "cep_destino cep_campo buscar_cep cep",
    expectedType: "cep",
    origin: "real-site",
    originDetail: "Calculadora de frete",
    inputType: "text",
    autocomplete: "postal-code",
  },
  {
    signals: "postal_code zip zipcode campo_zip",
    expectedType: "zip-code",
    origin: "synthetic-hard",
    originDetail: "Variação internacional",
    inputType: "text",
    autocomplete: "postal-code",
  },

  // ── DATE / BIRTH DATE ──
  {
    signals: "data_contratacao contratacao hiring_date date",
    expectedType: "date",
    origin: "real-site",
    originDetail: "RH – data de contratação",
    inputType: "date",
  },
  {
    signals: "data_nascimento nascimento bday birthday",
    expectedType: "birth-date",
    origin: "real-site",
    originDetail: "Cadastro SUS",
    inputType: "date",
    autocomplete: "bday",
  },

  // ── AUTH ──
  {
    signals: "senha_acesso senha_input password access",
    expectedType: "password",
    origin: "real-site",
    originDetail: "Login de portal",
    inputType: "password",
    autocomplete: "current-password",
  },
  {
    signals: "username_login login_id user_name",
    expectedType: "username",
    origin: "real-site",
    originDetail: "Login de portal",
    inputType: "text",
    autocomplete: "username",
  },

  // ── COMPANY ──
  {
    signals: "empresa_empregadora empregador company org",
    expectedType: "company",
    origin: "real-site",
    originDetail: "Portal de emprego",
    inputType: "text",
    autocomplete: "organization",
  },
  {
    signals: "razao_social_empresa razao-social razao",
    expectedType: "company",
    origin: "real-site",
    originDetail: "NF-e razão social",
    inputType: "text",
  },

  // ── MONEY / NUMBER / TEXT ──
  {
    signals: "valor_frete frete shipping_cost money",
    expectedType: "money",
    origin: "real-site",
    originDetail: "Calculadora de frete",
    inputType: "text",
  },
  {
    signals: "numero_casa house_number complemento",
    expectedType: "number",
    origin: "real-site",
    originDetail: "Cadastro endereço",
    inputType: "text",
  },
  {
    signals: "informacoes_adicionais additional details_field",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Campo genérico de informações",
  },

  // ── UNKNOWN / EDGE CASES ──
  {
    signals: "custom_field custom submit btn",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Campo sem sinais claros",
  },
  {
    signals: "field_x x_input inp_x placeholder",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Campo totalmente ambíguo",
  },
];

/** Run final test evaluation — should only be called once after all tuning */
export function runTestEvaluation(classifyFn: (signals: string) => FieldType): {
  globalAccuracy: number;
  perType: Record<string, { total: number; correct: number; accuracy: number }>;
  failures: Array<{
    signals: string;
    expected: FieldType;
    predicted: FieldType;
    origin: TestSample["origin"];
    originDetail: string;
  }>;
} {
  const perType: Record<
    string,
    { total: number; correct: number; accuracy: number }
  > = {};
  const failures: Array<{
    signals: string;
    expected: FieldType;
    predicted: FieldType;
    origin: TestSample["origin"];
    originDetail: string;
  }> = [];
  let totalCorrect = 0;

  for (const sample of TEST_SAMPLES) {
    const predicted = classifyFn(sample.signals);
    const isCorrect = predicted === sample.expectedType;

    if (!perType[sample.expectedType]) {
      perType[sample.expectedType] = { total: 0, correct: 0, accuracy: 0 };
    }
    perType[sample.expectedType].total++;
    if (isCorrect) {
      perType[sample.expectedType].correct++;
      totalCorrect++;
    } else {
      failures.push({
        signals: sample.signals,
        expected: sample.expectedType,
        predicted,
        origin: sample.origin,
        originDetail: sample.originDetail,
      });
    }
  }

  for (const key of Object.keys(perType)) {
    const entry = perType[key];
    entry.accuracy = entry.total > 0 ? entry.correct / entry.total : 0;
  }

  return {
    globalAccuracy:
      TEST_SAMPLES.length > 0 ? totalCorrect / TEST_SAMPLES.length : 0,
    perType,
    failures,
  };
}
