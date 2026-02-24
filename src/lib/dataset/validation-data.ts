/**
 * Validation Data — Independent dataset for measuring classifier accuracy
 *
 * These samples are NEVER used during training. They measure how well the
 * classifier generalises to unseen signals. Samples here use different
 * wording, abbreviations, and layouts compared to training-data.ts.
 *
 * Accuracy thresholds (see dataset-config.ts):
 *   • Global ≥ 85%
 *   • Per-type  ≥ 70%
 *
 * ──────────────────────────────────────────────────────────────────────────
 * HOW TO USE:
 *   For each sample, run the classifier → compare predicted type vs .type
 *   Track hits/misses per type for a confusion-matrix view.
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { FieldType } from "@/types";

export interface ValidationSample {
  signals: string;
  expectedType: FieldType;
  /** Short note about why this sample is useful */
  note: string;
}

export const VALIDATION_SAMPLES: ValidationSample[] = [
  // ── CPF ──
  {
    signals: "cpf_usuario cpf informe seu cpf aqui",
    expectedType: "cpf",
    note: "Variação de placeholder",
  },
  {
    signals: "documento_cpf contribuinte cpf-field",
    expectedType: "cpf",
    note: "Contexto de contribuinte",
  },
  {
    signals: "cpf do beneficiario cpf-beneficiario",
    expectedType: "cpf",
    note: "Beneficiário",
  },
  {
    signals: "cpf_socio socio num_cpf",
    expectedType: "cpf",
    note: "Contexto de sócio",
  },

  // ── CNPJ ──
  {
    signals: "cnpj_prestador prestador cnpj",
    expectedType: "cnpj",
    note: "Prestador de serviço",
  },
  {
    signals: "inscricao_cnpj cnpj-empresa razao",
    expectedType: "cnpj",
    note: "Contexto de razão social",
  },
  { signals: "cnpj_filial filial cnpj", expectedType: "cnpj", note: "Filial" },

  // ── RG ──
  {
    signals: "doc_rg rg-documento identidade_num",
    expectedType: "rg",
    note: "Variação de id + doc",
  },
  {
    signals: "numero_identidade rg_number identidade",
    expectedType: "rg",
    note: "Número de identidade",
  },
  {
    signals: "rg_conjuge rg-conjuge rg do conjuge",
    expectedType: "rg",
    note: "RG do cônjuge",
  },

  // ── EMAIL ──
  {
    signals: "email_alternativo alt_email informe outro email",
    expectedType: "email",
    note: "Email alternativo",
  },
  {
    signals: "electronic mail e-mail-input endereço eletronico",
    expectedType: "email",
    note: "Nome antigo",
  },
  {
    signals: "email empresa email_corporativo corporate",
    expectedType: "email",
    note: "Email corporativo",
  },
  {
    signals: "notification_email email notificação",
    expectedType: "email",
    note: "Email de notificação",
  },

  // ── PHONE ──
  {
    signals: "tel_emergencia emergencia telefone-emergencia",
    expectedType: "phone",
    note: "Tel de emergência",
  },
  {
    signals: "phone_secondary segundo_telefone secondary",
    expectedType: "phone",
    note: "Telefone secundário",
  },
  {
    signals: "num_cel celular-input numero-celular",
    expectedType: "mobile",
    note: "Variação celular",
  },
  {
    signals: "contato_tel fone-contato tel",
    expectedType: "phone",
    note: "Contato telefone",
  },

  // ── NAME ──
  {
    signals: "nome_paciente paciente_nome nome",
    expectedType: "name",
    note: "Contexto saúde",
  },
  {
    signals: "name_input your-name nome_field",
    expectedType: "name",
    note: "Misto pt/en",
  },

  // ── FIRST / LAST / FULL NAME ──
  {
    signals: "primeironome nome_primeiro first-name-input",
    expectedType: "first-name",
    note: "Variação primeiro nome",
  },
  {
    signals: "sobrenome_input inp_sobrenome family-name",
    expectedType: "last-name",
    note: "Variação sobrenome",
  },
  {
    signals: "nome-completo full-name-field nomecompleto",
    expectedType: "full-name",
    note: "Nome completo misto",
  },

  // ── ADDRESS ──
  {
    signals: "endereco_entrega delivery_address endereco",
    expectedType: "address",
    note: "Endereço de entrega",
  },
  {
    signals: "address_home home_address residencia",
    expectedType: "address",
    note: "Endereço residencial en",
  },

  // ── STREET / CITY / STATE / CEP / ZIP ──
  {
    signals: "via via_rua logradouro rua",
    expectedType: "street",
    note: "Variação via",
  },
  {
    signals: "city_origin cidade_origem origin",
    expectedType: "city",
    note: "Cidade de origem",
  },
  {
    signals: "uf_nascimento uf-nasc uf",
    expectedType: "state",
    note: "UF de nascimento",
  },
  {
    signals: "cep_entrega delivery_zip cep",
    expectedType: "cep",
    note: "CEP de entrega",
  },
  {
    signals: "zip_code zip-code postal-code",
    expectedType: "zip-code",
    note: "ZIP code en",
  },
  {
    signals: "zipcode_field postal zip",
    expectedType: "zip-code",
    note: "Postal en",
  },

  // ── DATE / BIRTH DATE ──
  {
    signals: "data_evento event_date data",
    expectedType: "date",
    note: "Data de evento",
  },
  {
    signals: "dt_nascimento data-nascimento birthday",
    expectedType: "birth-date",
    note: "Variação data nasc",
  },
  {
    signals: "born born_date nascido_em",
    expectedType: "birth-date",
    note: "Born en",
  },

  // ── AUTH ──
  {
    signals: "new_password nova-senha create_password",
    expectedType: "password",
    note: "Nova senha",
  },
  {
    signals: "login_user username nome_usuario",
    expectedType: "username",
    note: "Login user",
  },
  {
    signals: "nick nickname apelido_user",
    expectedType: "username",
    note: "Nickname",
  },

  // ── COMPANY ──
  {
    signals: "org_name organizacao empresa_nome",
    expectedType: "company",
    note: "Org name en/pt",
  },
  {
    signals: "nome_fantasia fantasia empresa",
    expectedType: "company",
    note: "Nome fantasia",
  },

  // ── MONEY / NUMBER / TEXT ──
  {
    signals: "valor_investimento investimento money amount",
    expectedType: "money",
    note: "Investimento",
  },
  {
    signals: "preco_unitario unit_price price",
    expectedType: "price",
    note: "Preço unitário",
  },
  {
    signals: "qtde qtde_input quantidade items",
    expectedType: "number",
    note: "Quantidade abreviado",
  },
  {
    signals: "num_dependentes dependentes dependents",
    expectedType: "number",
    note: "Núm. dependentes",
  },
  {
    signals: "obs observacao_input remarks",
    expectedType: "text",
    note: "Observação",
  },
  {
    signals: "comentarios comments_field notes",
    expectedType: "notes",
    note: "Comentários",
  },

  // ── CPF-CNPJ ──
  {
    signals: "cpf_ou_cnpj cpf-cnpj documento_fiscal",
    expectedType: "cpf-cnpj",
    note: "CPF ou CNPJ combinado",
  },
  {
    signals: "informe cpf ou cnpj doc_contribuinte",
    expectedType: "cpf-cnpj",
    note: "Instrução de preenchimento",
  },
  {
    signals: "cpf_cnpj_input documento-legal fiscal_doc",
    expectedType: "cpf-cnpj",
    note: "Variação de ID fiscal",
  },

  // ── WEBSITE ──
  {
    signals: "site_empresa url_empresa website",
    expectedType: "website",
    note: "Site da empresa",
  },
  {
    signals: "homepage_url pagina_web endereco_web",
    expectedType: "website",
    note: "Homepage / página web",
  },
  {
    signals: "link_site domain url",
    expectedType: "website",
    note: "Link / domain",
  },

  // ── PRODUCT ──
  {
    signals: "nome_produto produto_input product_name",
    expectedType: "product",
    note: "Nome do produto",
  },
  {
    signals: "item_servico servico-produto product",
    expectedType: "product",
    note: "Serviço / produto",
  },
  {
    signals: "descricao_produto artigo_vendido item",
    expectedType: "product",
    note: "Descrição do produto",
  },

  // ── SUPPLIER ──
  {
    signals: "nome_fornecedor fornecedor_input supplier",
    expectedType: "supplier",
    note: "Nome do fornecedor",
  },
  {
    signals: "empresa_fornecedora parceiro_fornecedor vendor",
    expectedType: "supplier",
    note: "Empresa fornecedora",
  },
  {
    signals: "razao_fornecedor fornecedor parceiro",
    expectedType: "supplier",
    note: "Razão social do fornecedor",
  },

  // ── EMPLOYEE COUNT ──
  {
    signals: "qtd_funcionarios funcionarios_total employees",
    expectedType: "employee-count",
    note: "Quantidade de funcionários",
  },
  {
    signals: "numero_colaboradores headcount workforce",
    expectedType: "employee-count",
    note: "Headcount / workforce",
  },
  {
    signals: "total_empregados staff_count quadro_pessoal",
    expectedType: "employee-count",
    note: "Total de empregados",
  },

  // ── JOB TITLE ──
  {
    signals: "cargo_profissional cargo_input job_title",
    expectedType: "job-title",
    note: "Cargo profissional",
  },
  {
    signals: "funcao_exercida ocupacao profissao",
    expectedType: "job-title",
    note: "Função / ocupação",
  },
  {
    signals: "titulo_profissional position_title role",
    expectedType: "job-title",
    note: "Título / position",
  },

  // ── AMBIGUOUS / HARD ──
  {
    signals: "campo_texto text input_1",
    expectedType: "text",
    note: "Genérico → texto",
  },
  {
    signals: "doc documento id_doc",
    expectedType: "cpf",
    note: "Documento genérico → CPF (mais comum)",
  },
  {
    signals: "dt dt_field data",
    expectedType: "date",
    note: "Abrev. genérica data",
  },

  // ── BANK FIELDS ──
  {
    signals: "agencia_banco banco_agencia bank_agency",
    expectedType: "number",
    note: "Agência bancária",
  },
  {
    signals: "conta_banco conta_corrente bank_account",
    expectedType: "number",
    note: "Conta bancária",
  },
  {
    signals: "dv_agencia digito_agencia bank_agency_digit",
    expectedType: "number",
    note: "DV da agência",
  },
  {
    signals: "dv_conta digito_conta bank_account_digit",
    expectedType: "number",
    note: "DV da conta",
  },
  // ── ADDRESS COMPLEMENT ──
  {
    signals: "complemento_endereco complement_address apto",
    expectedType: "complement",
    note: "Complemento de endereço",
  },
  {
    signals: "complemento apto bloco casa apartamento",
    expectedType: "complement",
    note: "Complemento com contexto",
  },
  // ── ADDRESS NUMBER / GENERIC CODE ──
  {
    signals: "numero_imovel house_number num_address",
    expectedType: "house-number",
    note: "Número do imóvel",
  },
  {
    signals: "codigo_promotora cod_agencia promoter_code",
    expectedType: "number",
    note: "Código numérico genérico",
  },
  {
    signals: "cpf do cliente customer_cpf cpf_id",
    expectedType: "cpf",
    note: "CPF bilíngue claro",
  },
  {
    signals: "documento pessoa fisica cpf_document",
    expectedType: "cpf",
    note: "Documento PF",
  },
  {
    signals: "cnpj empresa contractor_cnpj",
    expectedType: "cnpj",
    note: "CNPJ contratante",
  },
  {
    signals: "city_name municipality city",
    expectedType: "city",
    note: "Cidade em ingles",
  },
  {
    signals: "state_code uf estado",
    expectedType: "state",
    note: "Estado com uf",
  },
  {
    signals: "cep_input buscar cep_code",
    expectedType: "cep",
    note: "CEP com busca",
  },
  {
    signals: "work_email corporate_email e-mail",
    expectedType: "email",
    note: "Email corporativo bilíngue",
  },
  {
    signals: "mobile_contact tel_whatsapp phone",
    expectedType: "phone",
    note: "Telefone contato mobile",
  },
  {
    signals: "employee_total headcount employees_count",
    expectedType: "employee-count",
    note: "Contagem de funcionarios",
  },
  {
    signals: "position_name cargo profissional",
    expectedType: "job-title",
    note: "Cargo bilíngue",
  },
  {
    signals: "house_number number_endereco num_casa",
    expectedType: "house-number",
    note: "Numero de endereco",
  },
  {
    signals: "bank_account_digit dv_conta",
    expectedType: "number",
    note: "Digito conta bancario",
  },
  {
    signals: "product_name nome do produto item",
    expectedType: "product",
    note: "Produto bilíngue",
  },
  {
    signals: "supplier_name fornecedor principal vendor",
    expectedType: "supplier",
    note: "Fornecedor bilíngue",
  },
  {
    signals: "company_website url site empresa",
    expectedType: "website",
    note: "Website corporativo",
  },
];

/** Run validation pass: returns per-type accuracy and global accuracy */
export function evaluateClassifier(
  classifyFn: (signals: string) => FieldType,
): {
  globalAccuracy: number;
  perType: Record<string, { total: number; correct: number; accuracy: number }>;
  misclassified: Array<{
    signals: string;
    expected: FieldType;
    predicted: FieldType;
  }>;
} {
  const perType: Record<
    string,
    { total: number; correct: number; accuracy: number }
  > = {};
  const misclassified: Array<{
    signals: string;
    expected: FieldType;
    predicted: FieldType;
  }> = [];
  let totalCorrect = 0;

  for (const sample of VALIDATION_SAMPLES) {
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
      misclassified.push({
        signals: sample.signals,
        expected: sample.expectedType,
        predicted,
      });
    }
  }

  // Calculate per-type accuracy
  for (const key of Object.keys(perType)) {
    const entry = perType[key];
    entry.accuracy = entry.total > 0 ? entry.correct / entry.total : 0;
  }

  return {
    globalAccuracy:
      VALIDATION_SAMPLES.length > 0
        ? totalCorrect / VALIDATION_SAMPLES.length
        : 0,
    perType,
    misclassified,
  };
}
