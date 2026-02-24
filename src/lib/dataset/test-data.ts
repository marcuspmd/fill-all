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

/** Test samples for final accuracy evaluation (used only once after training). */
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

  // ── BANK FIELDS ──
  {
    signals: "agencia bank_agency agencia banco",
    expectedType: "number",
    origin: "real-site",
    originDetail: "Formulário de dados bancários",
    inputType: "text",
  },
  {
    signals: "conta bank_account conta bancaria",
    expectedType: "number",
    origin: "real-site",
    originDetail: "Formulário de dados bancários",
    inputType: "text",
  },
  {
    signals: "dv agencia bank_agency_digit",
    expectedType: "number",
    origin: "real-site",
    originDetail: "DV da agência bancária",
    inputType: "text",
  },
  {
    signals: "dv conta bank_account_digit",
    expectedType: "number",
    origin: "real-site",
    originDetail: "DV da conta bancária",
    inputType: "text",
  },
  // ── ADDRESS COMPLEMENT ──
  {
    signals: "complemento complement_address complemento",
    expectedType: "text",
    origin: "real-site",
    originDetail: "Complemento de endereço (Apto, Bloco, etc.)",
    inputType: "text",
  },
  // ── ADDRESS NUMBER ──
  {
    signals: "numero number numero campo_numero",
    expectedType: "number",
    origin: "real-site",
    originDetail: "Número do endereço",
    inputType: "text",
  },
  // ── GENERIC CODE ──
  {
    signals: "codigo da promotora code codigo da promotora",
    expectedType: "number",
    origin: "real-site",
    originDetail: "Código numérico da promotora (campo code)",
    inputType: "text",
  },

  // ── MORE CPF ──
  {
    signals: "cpf document_cpf nr_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "Simple CPF",
  },
  {
    signals: "id_cpf user_cpf cpf_number",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "English/PT mixed CPF",
  },
  {
    signals: "nu_cpf num_cpf numero_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "Variations of CPF number",
  },
  {
    signals: "txt_cpf input_cpf cpf_cliente",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF with prefixes/suffixes",
  },

  // ── MORE CNPJ ──
  {
    signals: "cnpj document_cnpj nr_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "Simple CNPJ",
  },
  {
    signals: "id_cnpj company_cnpj cnpj_number",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "English/PT mixed CNPJ",
  },
  {
    signals: "nu_cnpj num_cnpj numero_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "Variations of CNPJ number",
  },
  {
    signals: "txt_cnpj input_cnpj cnpj_empresa",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ with prefixes/suffixes",
  },

  // ── MORE RG ──
  {
    signals: "rg document_rg nr_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "Simple RG",
  },
  {
    signals: "id_rg user_rg rg_number",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "English/PT mixed RG",
  },
  {
    signals: "identidade registro_geral id_number",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG synonyms",
  },
  {
    signals: "txt_rg input_rg rg_cliente",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG with prefixes/suffixes",
  },

  // ── MORE EMAIL ──
  {
    signals: "email mail e-mail",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Simple Email",
  },
  {
    signals: "user_email email_address correio_eletronico",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email variations",
  },
  {
    signals: "contato_email email_contato",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Contact email",
  },
  {
    signals: "txt_email input_email email_cliente",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email with prefixes/suffixes",
  },

  // ── MORE PHONE ──
  {
    signals: "telefone tel phone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Simple Phone",
  },
  {
    signals: "celular cell cellphone mobile",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Mobile phone",
  },
  {
    signals: "telefone_celular mobile_phone tel_cel",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Mobile phone variations",
  },
  {
    signals: "telefone_residencial home_phone tel_res",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Home phone",
  },
  {
    signals: "telefone_comercial work_phone tel_com",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Work phone",
  },
  {
    signals: "txt_telefone input_telefone telefone_cliente",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Phone with prefixes/suffixes",
  },

  // ── MORE NAME ──
  {
    signals: "nome name",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Simple Name",
  },
  {
    signals: "nome_usuario user_name nome_cliente",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "User name",
  },
  {
    signals: "txt_nome input_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Name with prefixes/suffixes",
  },

  // ── MORE FIRST/LAST NAME ──
  {
    signals: "primeiro_nome first_name fname",
    expectedType: "first-name",
    origin: "synthetic-hard",
    originDetail: "First name",
  },
  {
    signals: "ultimo_nome last_name lname",
    expectedType: "last-name",
    origin: "synthetic-hard",
    originDetail: "Last name",
  },
  {
    signals: "sobrenome surname",
    expectedType: "last-name",
    origin: "synthetic-hard",
    originDetail: "Surname",
  },

  // ── MORE ADDRESS ──
  {
    signals: "endereco address",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Simple Address",
  },
  {
    signals: "logradouro street rua avenida",
    expectedType: "street",
    origin: "synthetic-hard",
    originDetail: "Street",
  },
  {
    signals: "bairro neighborhood district",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Neighborhood",
  },
  {
    signals: "complemento complement address2",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Address complement",
  },
  {
    signals: "numero_endereco address_number num",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Address number",
  },
  {
    signals: "txt_endereco input_endereco endereco_cliente",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Address with prefixes/suffixes",
  },

  // ── MORE CITY / STATE ──
  {
    signals: "cidade city municipio",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "City",
  },
  {
    signals: "estado state uf provincia",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "State",
  },
  {
    signals: "txt_cidade input_cidade cidade_cliente",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "City with prefixes/suffixes",
  },
  {
    signals: "txt_estado input_estado estado_cliente",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "State with prefixes/suffixes",
  },

  // ── MORE CEP / ZIP ──
  {
    signals: "cep postal_code zip_code",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP/ZIP",
  },
  {
    signals: "codigo_postal zipcode",
    expectedType: "zip-code",
    origin: "synthetic-hard",
    originDetail: "Postal code",
  },
  {
    signals: "txt_cep input_cep cep_cliente",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP with prefixes/suffixes",
  },

  // ── MORE DATE / BIRTH DATE ──
  {
    signals: "data date",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Simple Date",
  },
  {
    signals: "data_nascimento birth_date dob",
    expectedType: "birth-date",
    origin: "synthetic-hard",
    originDetail: "Birth date",
  },
  {
    signals: "nascimento birthday",
    expectedType: "birth-date",
    origin: "synthetic-hard",
    originDetail: "Birthday",
  },
  {
    signals: "data_inicio start_date",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Start date",
  },
  {
    signals: "data_fim end_date",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "End date",
  },
  {
    signals: "txt_data input_data data_cliente",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Date with prefixes/suffixes",
  },

  // ── MORE AUTH ──
  {
    signals: "senha password pass pwd",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Simple Password",
  },
  {
    signals: "confirmar_senha confirm_password",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Confirm password",
  },
  {
    signals: "usuario username login",
    expectedType: "username",
    origin: "synthetic-hard",
    originDetail: "Username",
  },
  {
    signals: "txt_senha input_senha senha_cliente",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Password with prefixes/suffixes",
  },

  // ── MORE COMPANY ──
  {
    signals: "empresa company organization",
    expectedType: "company",
    origin: "synthetic-hard",
    originDetail: "Company",
  },
  {
    signals: "nome_empresa company_name",
    expectedType: "company",
    origin: "synthetic-hard",
    originDetail: "Company name",
  },
  {
    signals: "nome_fantasia trade_name",
    expectedType: "company",
    origin: "synthetic-hard",
    originDetail: "Trade name",
  },
  {
    signals: "razao_social legal_name",
    expectedType: "company",
    origin: "synthetic-hard",
    originDetail: "Legal name",
  },
  {
    signals: "txt_empresa input_empresa empresa_cliente",
    expectedType: "company",
    origin: "synthetic-hard",
    originDetail: "Company with prefixes/suffixes",
  },

  // ── MORE MONEY / NUMBER / TEXT ──
  {
    signals: "valor amount price preco",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Money amount",
  },
  {
    signals: "quantidade quantity qtd",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Quantity",
  },
  {
    signals: "idade age",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Age",
  },
  {
    signals: "descricao description observacao notes",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Text description",
  },
  {
    signals: "mensagem message msg",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Text message",
  },
  {
    signals: "assunto subject",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Text subject",
  },
  {
    signals: "txt_valor input_valor valor_cliente",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Money with prefixes/suffixes",
  },
  {
    signals: "txt_quantidade input_quantidade quantidade_cliente",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Number with prefixes/suffixes",
  },
  {
    signals: "txt_descricao input_descricao descricao_cliente",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Text with prefixes/suffixes",
  },

  // ── MORE UNKNOWN / EDGE CASES ──
  {
    signals: "campo1 field1 input1",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Generic field 1",
  },
  {
    signals: "teste test",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Test field",
  },
  {
    signals: "outro other",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Other field",
  },
  {
    signals: "opcional optional",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Optional field",
  },
  {
    signals: "hidden_field token csrf",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Hidden token field",
  },
  {
    signals: "search busca pesquisar",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Search field",
  },
  {
    signals: "txt_campo input_campo campo_cliente",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Unknown with prefixes/suffixes",
  },

  // ── MASSIVE TEST DATA EXPANSION ──
  // ── CPF VARIATIONS ──
  {
    signals: "cpf_titular titular_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do titular",
  },
  {
    signals: "cpf_conjuge conjuge_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do cônjuge",
  },
  {
    signals: "cpf_dependente dependente_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do dependente",
  },
  {
    signals: "cpf_socio socio_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do sócio",
  },
  {
    signals: "cpf_fiador fiador_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do fiador",
  },
  {
    signals: "cpf_avalista avalista_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do avalista",
  },
  {
    signals: "cpf_comprador comprador_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do comprador",
  },
  {
    signals: "cpf_vendedor vendedor_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do vendedor",
  },
  {
    signals: "cpf_paciente paciente_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do paciente",
  },
  {
    signals: "cpf_medico medico_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do médico",
  },
  {
    signals: "cpf_aluno aluno_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do aluno",
  },
  {
    signals: "cpf_professor professor_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do professor",
  },
  {
    signals: "cpf_funcionario funcionario_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do funcionário",
  },
  {
    signals: "cpf_empregador empregador_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do empregador",
  },
  {
    signals: "cpf_cliente cliente_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do cliente",
  },
  {
    signals: "cpf_consumidor consumidor_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do consumidor",
  },
  {
    signals: "cpf_usuario usuario_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do usuário",
  },
  {
    signals: "cpf_visitante visitante_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do visitante",
  },
  {
    signals: "cpf_candidato candidato_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do candidato",
  },
  {
    signals: "cpf_eleitor eleitor_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do eleitor",
  },
  {
    signals: "cpf_contribuinte contribuinte_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do contribuinte",
  },
  {
    signals: "cpf_pagador pagador_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do pagador",
  },
  {
    signals: "cpf_beneficiario beneficiario_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do beneficiário",
  },
  {
    signals: "cpf_segurado segurado_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do segurado",
  },
  {
    signals: "cpf_autor autor_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do autor",
  },
  {
    signals: "cpf_reu reu_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do réu",
  },
  {
    signals: "cpf_requerente requerente_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do requerente",
  },
  {
    signals: "cpf_representante representante_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do representante",
  },
  {
    signals: "cpf_procurador procurador_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do procurador",
  },
  {
    signals: "cpf_locador locador_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do locador",
  },
  {
    signals: "cpf_locatario locatario_cpf",
    expectedType: "cpf",
    origin: "synthetic-hard",
    originDetail: "CPF do locatário",
  },

  // ── CNPJ VARIATIONS ──
  {
    signals: "cnpj_empresa empresa_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ da empresa",
  },
  {
    signals: "cnpj_filial filial_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ da filial",
  },
  {
    signals: "cnpj_matriz matriz_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ da matriz",
  },
  {
    signals: "cnpj_fornecedor fornecedor_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ do fornecedor",
  },
  {
    signals: "cnpj_cliente cliente_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ do cliente",
  },
  {
    signals: "cnpj_transportadora transportadora_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ da transportadora",
  },
  {
    signals: "cnpj_faturamento faturamento_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ de faturamento",
  },
  {
    signals: "cnpj_pagamento pagamento_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ de pagamento",
  },
  {
    signals: "cnpj_emitente emissor_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ do emitente",
  },
  {
    signals: "cnpj_destinatario destinatario_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ do destinatário",
  },
  {
    signals: "cnpj_tomador tomador_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ do tomador",
  },
  {
    signals: "cnpj_prestador prestador_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ do prestador",
  },
  {
    signals: "cnpj_instituicao instituicao_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ da instituição",
  },
  {
    signals: "cnpj_organizacao organizacao_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ da organização",
  },
  {
    signals: "cnpj_associacao associacao_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ da associação",
  },
  {
    signals: "cnpj_sindicato sindicato_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ do sindicato",
  },
  {
    signals: "cnpj_cooperativa cooperativa_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ da cooperativa",
  },
  {
    signals: "cnpj_condominio condominio_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ do condomínio",
  },
  {
    signals: "cnpj_igreja igreja_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ da igreja",
  },
  {
    signals: "cnpj_escola escola_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ da escola",
  },
  {
    signals: "cnpj_faculdade faculdade_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ da faculdade",
  },
  {
    signals: "cnpj_universidade universidade_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ da universidade",
  },
  {
    signals: "cnpj_hospital hospital_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ do hospital",
  },
  {
    signals: "cnpj_clinica clinica_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ da clínica",
  },
  {
    signals: "cnpj_laboratorio laboratorio_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ do laboratório",
  },
  {
    signals: "cnpj_farmacia farmacia_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ da farmácia",
  },
  {
    signals: "cnpj_supermercado supermercado_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ do supermercado",
  },
  {
    signals: "cnpj_padaria padaria_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ da padaria",
  },
  {
    signals: "cnpj_restaurante restaurante_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ do restaurante",
  },
  {
    signals: "cnpj_lanchonete lanchonete_cnpj",
    expectedType: "cnpj",
    origin: "synthetic-hard",
    originDetail: "CNPJ da lanchonete",
  },

  // ── RG VARIATIONS ──
  {
    signals: "rg_titular titular_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do titular",
  },
  {
    signals: "rg_conjuge conjuge_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do cônjuge",
  },
  {
    signals: "rg_dependente dependente_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do dependente",
  },
  {
    signals: "rg_socio socio_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do sócio",
  },
  {
    signals: "rg_fiador fiador_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do fiador",
  },
  {
    signals: "rg_avalista avalista_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do avalista",
  },
  {
    signals: "rg_comprador comprador_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do comprador",
  },
  {
    signals: "rg_vendedor vendedor_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do vendedor",
  },
  {
    signals: "rg_paciente paciente_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do paciente",
  },
  {
    signals: "rg_medico medico_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do médico",
  },
  {
    signals: "rg_aluno aluno_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do aluno",
  },
  {
    signals: "rg_professor professor_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do professor",
  },
  {
    signals: "rg_funcionario funcionario_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do funcionário",
  },
  {
    signals: "rg_empregador empregador_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do empregador",
  },
  {
    signals: "rg_cliente cliente_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do cliente",
  },
  {
    signals: "rg_consumidor consumidor_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do consumidor",
  },
  {
    signals: "rg_usuario usuario_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do usuário",
  },
  {
    signals: "rg_visitante visitante_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do visitante",
  },
  {
    signals: "rg_candidato candidato_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do candidato",
  },
  {
    signals: "rg_eleitor eleitor_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do eleitor",
  },
  {
    signals: "rg_contribuinte contribuinte_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do contribuinte",
  },
  {
    signals: "rg_pagador pagador_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do pagador",
  },
  {
    signals: "rg_beneficiario beneficiario_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do beneficiário",
  },
  {
    signals: "rg_segurado segurado_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do segurado",
  },
  {
    signals: "rg_autor autor_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do autor",
  },
  {
    signals: "rg_reu reu_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do réu",
  },
  {
    signals: "rg_requerente requerente_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do requerente",
  },
  {
    signals: "rg_representante representante_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do representante",
  },
  {
    signals: "rg_procurador procurador_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do procurador",
  },
  {
    signals: "rg_locador locador_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do locador",
  },
  {
    signals: "rg_locatario locatario_rg",
    expectedType: "rg",
    origin: "synthetic-hard",
    originDetail: "RG do locatário",
  },

  // ── EMAIL VARIATIONS ──
  {
    signals: "email_titular titular_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email do titular",
  },
  {
    signals: "email_responsavel responsavel_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email do responsável",
  },
  {
    signals: "email_socio socio_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email do sócio",
  },
  {
    signals: "email_dependente dependente_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email do dependente",
  },
  {
    signals: "email_conjuge conjuge_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email do cônjuge",
  },
  {
    signals: "email_avalista avalista_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email do avalista",
  },
  {
    signals: "email_fiador fiador_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email do fiador",
  },
  {
    signals: "email_testemunha testemunha_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email da testemunha",
  },
  {
    signals: "email_corporativo corporativo_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email corporativo",
  },
  {
    signals: "email_pessoal pessoal_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email pessoal",
  },
  {
    signals: "email_trabalho trabalho_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email de trabalho",
  },
  {
    signals: "email_secundario secundario_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email secundário",
  },
  {
    signals: "email_alternativo alternativo_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email alternativo",
  },
  {
    signals: "email_recuperacao recuperacao_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email de recuperação",
  },
  {
    signals: "email_cobranca cobranca_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email de cobrança",
  },
  {
    signals: "email_faturamento faturamento_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email de faturamento",
  },
  {
    signals: "email_pagamento pagamento_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email de pagamento",
  },
  {
    signals: "email_nfe nfe_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email para NFe",
  },
  {
    signals: "email_xml xml_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email para XML",
  },
  {
    signals: "email_boleto boleto_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email para boleto",
  },
  {
    signals: "email_comercial comercial_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email comercial",
  },
  {
    signals: "email_financeiro financeiro_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email financeiro",
  },
  {
    signals: "email_rh rh_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email do RH",
  },
  {
    signals: "email_suporte suporte_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email de suporte",
  },
  {
    signals: "email_vendas vendas_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email de vendas",
  },
  {
    signals: "email_marketing marketing_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email de marketing",
  },
  {
    signals: "email_diretoria diretoria_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email da diretoria",
  },
  {
    signals: "email_gerencia gerencia_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email da gerência",
  },
  {
    signals: "email_coordenacao coordenacao_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email da coordenação",
  },
  {
    signals: "email_supervisao supervisao_email",
    expectedType: "email",
    origin: "synthetic-hard",
    originDetail: "Email da supervisão",
  },

  // ── PHONE VARIATIONS ──
  {
    signals: "telefone_titular titular_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone do titular",
  },
  {
    signals: "telefone_responsavel responsavel_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone do responsável",
  },
  {
    signals: "telefone_socio socio_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone do sócio",
  },
  {
    signals: "telefone_dependente dependente_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone do dependente",
  },
  {
    signals: "telefone_conjuge conjuge_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone do cônjuge",
  },
  {
    signals: "telefone_avalista avalista_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone do avalista",
  },
  {
    signals: "telefone_fiador fiador_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone do fiador",
  },
  {
    signals: "telefone_testemunha testemunha_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone da testemunha",
  },
  {
    signals: "telefone_corporativo corporativo_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone corporativo",
  },
  {
    signals: "telefone_pessoal pessoal_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone pessoal",
  },
  {
    signals: "telefone_trabalho trabalho_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone de trabalho",
  },
  {
    signals: "telefone_secundario secundario_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone secundário",
  },
  {
    signals: "telefone_alternativo alternativo_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone alternativo",
  },
  {
    signals: "telefone_recuperacao recuperacao_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone de recuperação",
  },
  {
    signals: "telefone_cobranca cobranca_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone de cobrança",
  },
  {
    signals: "telefone_faturamento faturamento_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone de faturamento",
  },
  {
    signals: "telefone_pagamento pagamento_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone de pagamento",
  },
  {
    signals: "telefone_nfe nfe_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone para NFe",
  },
  {
    signals: "telefone_xml xml_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone para XML",
  },
  {
    signals: "telefone_boleto boleto_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone para boleto",
  },
  {
    signals: "telefone_fixo fixo_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone fixo",
  },
  {
    signals: "telefone_celular celular_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone celular",
  },
  {
    signals: "telefone_whatsapp whatsapp_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone WhatsApp",
  },
  {
    signals: "telefone_recado recado_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone para recado",
  },
  {
    signals: "telefone_contato contato_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone de contato",
  },
  {
    signals: "telefone_emergencia emergencia_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone de emergência",
  },
  {
    signals: "telefone_comercial comercial_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone comercial",
  },
  {
    signals: "telefone_financeiro financeiro_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone financeiro",
  },
  {
    signals: "telefone_rh rh_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone do RH",
  },
  {
    signals: "telefone_suporte suporte_telefone",
    expectedType: "phone",
    origin: "synthetic-hard",
    originDetail: "Telefone de suporte",
  },

  // ── NAME VARIATIONS ──
  {
    signals: "nome_titular titular_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome do titular",
  },
  {
    signals: "nome_responsavel responsavel_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome do responsável",
  },
  {
    signals: "nome_socio socio_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome do sócio",
  },
  {
    signals: "nome_dependente dependente_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome do dependente",
  },
  {
    signals: "nome_conjuge conjuge_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome do cônjuge",
  },
  {
    signals: "nome_avalista avalista_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome do avalista",
  },
  {
    signals: "nome_fiador fiador_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome do fiador",
  },
  {
    signals: "nome_testemunha testemunha_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome da testemunha",
  },
  {
    signals: "nome_mae mae_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome da mãe",
  },
  {
    signals: "nome_pai pai_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome do pai",
  },
  {
    signals: "nome_fantasia fantasia_nome",
    expectedType: "company",
    origin: "synthetic-hard",
    originDetail: "Nome fantasia",
  },
  {
    signals: "razao_social social_razao",
    expectedType: "company",
    origin: "synthetic-hard",
    originDetail: "Razão social",
  },
  {
    signals: "nome_empresa empresa_nome",
    expectedType: "company",
    origin: "synthetic-hard",
    originDetail: "Nome da empresa",
  },
  {
    signals: "nome_filial filial_nome",
    expectedType: "company",
    origin: "synthetic-hard",
    originDetail: "Nome da filial",
  },
  {
    signals: "nome_matriz matriz_nome",
    expectedType: "company",
    origin: "synthetic-hard",
    originDetail: "Nome da matriz",
  },
  {
    signals: "nome_fornecedor fornecedor_nome",
    expectedType: "company",
    origin: "synthetic-hard",
    originDetail: "Nome do fornecedor",
  },
  {
    signals: "nome_cliente cliente_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome do cliente",
  },
  {
    signals: "nome_transportadora transportadora_nome",
    expectedType: "company",
    origin: "synthetic-hard",
    originDetail: "Nome da transportadora",
  },
  {
    signals: "nome_faturamento faturamento_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome de faturamento",
  },
  {
    signals: "nome_pagamento pagamento_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome de pagamento",
  },
  {
    signals: "nome_nfe nfe_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome para NFe",
  },
  {
    signals: "nome_xml xml_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome para XML",
  },
  {
    signals: "nome_boleto boleto_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome para boleto",
  },
  {
    signals: "nome_contato contato_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome de contato",
  },
  {
    signals: "nome_emergencia emergencia_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome de emergência",
  },
  {
    signals: "nome_comprador comprador_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome do comprador",
  },
  {
    signals: "nome_vendedor vendedor_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome do vendedor",
  },
  {
    signals: "nome_paciente paciente_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome do paciente",
  },
  {
    signals: "nome_medico medico_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome do médico",
  },
  {
    signals: "nome_aluno aluno_nome",
    expectedType: "name",
    origin: "synthetic-hard",
    originDetail: "Nome do aluno",
  },

  // ── ADDRESS VARIATIONS ──
  {
    signals: "endereco_titular titular_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço do titular",
  },
  {
    signals: "endereco_responsavel responsavel_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço do responsável",
  },
  {
    signals: "endereco_socio socio_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço do sócio",
  },
  {
    signals: "endereco_dependente dependente_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço do dependente",
  },
  {
    signals: "endereco_conjuge conjuge_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço do cônjuge",
  },
  {
    signals: "endereco_avalista avalista_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço do avalista",
  },
  {
    signals: "endereco_fiador fiador_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço do fiador",
  },
  {
    signals: "endereco_testemunha testemunha_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço da testemunha",
  },
  {
    signals: "endereco_empresa empresa_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço da empresa",
  },
  {
    signals: "endereco_filial filial_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço da filial",
  },
  {
    signals: "endereco_matriz matriz_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço da matriz",
  },
  {
    signals: "endereco_fornecedor fornecedor_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço do fornecedor",
  },
  {
    signals: "endereco_cliente cliente_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço do cliente",
  },
  {
    signals: "endereco_transportadora transportadora_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço da transportadora",
  },
  {
    signals: "endereco_faturamento faturamento_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço de faturamento",
  },
  {
    signals: "endereco_pagamento pagamento_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço de pagamento",
  },
  {
    signals: "endereco_nfe nfe_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço para NFe",
  },
  {
    signals: "endereco_xml xml_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço para XML",
  },
  {
    signals: "endereco_boleto boleto_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço para boleto",
  },
  {
    signals: "endereco_contato contato_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço de contato",
  },
  {
    signals: "endereco_emergencia emergencia_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço de emergência",
  },
  {
    signals: "endereco_residencial residencial_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço residencial",
  },
  {
    signals: "endereco_comercial comercial_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço comercial",
  },
  {
    signals: "endereco_trabalho trabalho_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço de trabalho",
  },
  {
    signals: "endereco_secundario secundario_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço secundário",
  },
  {
    signals: "endereco_alternativo alternativo_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço alternativo",
  },
  {
    signals: "endereco_recuperacao recuperacao_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço de recuperação",
  },
  {
    signals: "endereco_cobranca cobranca_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço de cobrança",
  },
  {
    signals: "endereco_entrega entrega_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço de entrega",
  },
  {
    signals: "endereco_coleta coleta_endereco",
    expectedType: "address",
    origin: "synthetic-hard",
    originDetail: "Endereço de coleta",
  },

  // ── CITY VARIATIONS ──
  {
    signals: "cidade_titular titular_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade do titular",
  },
  {
    signals: "cidade_responsavel responsavel_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade do responsável",
  },
  {
    signals: "cidade_socio socio_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade do sócio",
  },
  {
    signals: "cidade_dependente dependente_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade do dependente",
  },
  {
    signals: "cidade_conjuge conjuge_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade do cônjuge",
  },
  {
    signals: "cidade_avalista avalista_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade do avalista",
  },
  {
    signals: "cidade_fiador fiador_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade do fiador",
  },
  {
    signals: "cidade_testemunha testemunha_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade da testemunha",
  },
  {
    signals: "cidade_empresa empresa_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade da empresa",
  },
  {
    signals: "cidade_filial filial_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade da filial",
  },
  {
    signals: "cidade_matriz matriz_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade da matriz",
  },
  {
    signals: "cidade_fornecedor fornecedor_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade do fornecedor",
  },
  {
    signals: "cidade_cliente cliente_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade do cliente",
  },
  {
    signals: "cidade_transportadora transportadora_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade da transportadora",
  },
  {
    signals: "cidade_faturamento faturamento_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade de faturamento",
  },
  {
    signals: "cidade_pagamento pagamento_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade de pagamento",
  },
  {
    signals: "cidade_nfe nfe_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade para NFe",
  },
  {
    signals: "cidade_xml xml_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade para XML",
  },
  {
    signals: "cidade_boleto boleto_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade para boleto",
  },
  {
    signals: "cidade_contato contato_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade de contato",
  },
  {
    signals: "cidade_emergencia emergencia_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade de emergência",
  },
  {
    signals: "cidade_residencial residencial_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade residencial",
  },
  {
    signals: "cidade_comercial comercial_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade comercial",
  },
  {
    signals: "cidade_trabalho trabalho_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade de trabalho",
  },
  {
    signals: "cidade_secundario secundario_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade secundária",
  },
  {
    signals: "cidade_alternativo alternativo_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade alternativa",
  },
  {
    signals: "cidade_recuperacao recuperacao_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade de recuperação",
  },
  {
    signals: "cidade_cobranca cobranca_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade de cobrança",
  },
  {
    signals: "cidade_entrega entrega_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade de entrega",
  },
  {
    signals: "cidade_coleta coleta_cidade",
    expectedType: "city",
    origin: "synthetic-hard",
    originDetail: "Cidade de coleta",
  },

  // ── STATE VARIATIONS ──
  {
    signals: "estado_titular titular_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado do titular",
  },
  {
    signals: "estado_responsavel responsavel_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado do responsável",
  },
  {
    signals: "estado_socio socio_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado do sócio",
  },
  {
    signals: "estado_dependente dependente_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado do dependente",
  },
  {
    signals: "estado_conjuge conjuge_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado do cônjuge",
  },
  {
    signals: "estado_avalista avalista_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado do avalista",
  },
  {
    signals: "estado_fiador fiador_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado do fiador",
  },
  {
    signals: "estado_testemunha testemunha_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado da testemunha",
  },
  {
    signals: "estado_empresa empresa_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado da empresa",
  },
  {
    signals: "estado_filial filial_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado da filial",
  },
  {
    signals: "estado_matriz matriz_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado da matriz",
  },
  {
    signals: "estado_fornecedor fornecedor_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado do fornecedor",
  },
  {
    signals: "estado_cliente cliente_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado do cliente",
  },
  {
    signals: "estado_transportadora transportadora_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado da transportadora",
  },
  {
    signals: "estado_faturamento faturamento_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado de faturamento",
  },
  {
    signals: "estado_pagamento pagamento_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado de pagamento",
  },
  {
    signals: "estado_nfe nfe_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado para NFe",
  },
  {
    signals: "estado_xml xml_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado para XML",
  },
  {
    signals: "estado_boleto boleto_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado para boleto",
  },
  {
    signals: "estado_contato contato_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado de contato",
  },
  {
    signals: "estado_emergencia emergencia_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado de emergência",
  },
  {
    signals: "estado_residencial residencial_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado residencial",
  },
  {
    signals: "estado_comercial comercial_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado comercial",
  },
  {
    signals: "estado_trabalho trabalho_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado de trabalho",
  },
  {
    signals: "estado_secundario secundario_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado secundário",
  },
  {
    signals: "estado_alternativo alternativo_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado alternativo",
  },
  {
    signals: "estado_recuperacao recuperacao_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado de recuperação",
  },
  {
    signals: "estado_cobranca cobranca_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado de cobrança",
  },
  {
    signals: "estado_entrega entrega_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado de entrega",
  },
  {
    signals: "estado_coleta coleta_estado",
    expectedType: "state",
    origin: "synthetic-hard",
    originDetail: "Estado de coleta",
  },

  // ── CEP VARIATIONS ──
  {
    signals: "cep_titular titular_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP do titular",
  },
  {
    signals: "cep_responsavel responsavel_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP do responsável",
  },
  {
    signals: "cep_socio socio_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP do sócio",
  },
  {
    signals: "cep_dependente dependente_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP do dependente",
  },
  {
    signals: "cep_conjuge conjuge_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP do cônjuge",
  },
  {
    signals: "cep_avalista avalista_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP do avalista",
  },
  {
    signals: "cep_fiador fiador_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP do fiador",
  },
  {
    signals: "cep_testemunha testemunha_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP da testemunha",
  },
  {
    signals: "cep_empresa empresa_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP da empresa",
  },
  {
    signals: "cep_filial filial_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP da filial",
  },
  {
    signals: "cep_matriz matriz_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP da matriz",
  },
  {
    signals: "cep_fornecedor fornecedor_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP do fornecedor",
  },
  {
    signals: "cep_cliente cliente_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP do cliente",
  },
  {
    signals: "cep_transportadora transportadora_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP da transportadora",
  },
  {
    signals: "cep_faturamento faturamento_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP de faturamento",
  },
  {
    signals: "cep_pagamento pagamento_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP de pagamento",
  },
  {
    signals: "cep_nfe nfe_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP para NFe",
  },
  {
    signals: "cep_xml xml_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP para XML",
  },
  {
    signals: "cep_boleto boleto_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP para boleto",
  },
  {
    signals: "cep_contato contato_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP de contato",
  },
  {
    signals: "cep_emergencia emergencia_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP de emergência",
  },
  {
    signals: "cep_residencial residencial_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP residencial",
  },
  {
    signals: "cep_comercial comercial_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP comercial",
  },
  {
    signals: "cep_trabalho trabalho_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP de trabalho",
  },
  {
    signals: "cep_secundario secundario_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP secundário",
  },
  {
    signals: "cep_alternativo alternativo_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP alternativo",
  },
  {
    signals: "cep_recuperacao recuperacao_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP de recuperação",
  },
  {
    signals: "cep_cobranca cobranca_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP de cobrança",
  },
  {
    signals: "cep_entrega entrega_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP de entrega",
  },
  {
    signals: "cep_coleta coleta_cep",
    expectedType: "cep",
    origin: "synthetic-hard",
    originDetail: "CEP de coleta",
  },

  // ── DATE VARIATIONS ──
  {
    signals: "data_nascimento_titular titular_data_nascimento",
    expectedType: "birth-date",
    origin: "synthetic-hard",
    originDetail: "Data de nascimento do titular",
  },
  {
    signals: "data_nascimento_responsavel responsavel_data_nascimento",
    expectedType: "birth-date",
    origin: "synthetic-hard",
    originDetail: "Data de nascimento do responsável",
  },
  {
    signals: "data_nascimento_socio socio_data_nascimento",
    expectedType: "birth-date",
    origin: "synthetic-hard",
    originDetail: "Data de nascimento do sócio",
  },
  {
    signals: "data_nascimento_dependente dependente_data_nascimento",
    expectedType: "birth-date",
    origin: "synthetic-hard",
    originDetail: "Data de nascimento do dependente",
  },
  {
    signals: "data_nascimento_conjuge conjuge_data_nascimento",
    expectedType: "birth-date",
    origin: "synthetic-hard",
    originDetail: "Data de nascimento do cônjuge",
  },
  {
    signals: "data_nascimento_avalista avalista_data_nascimento",
    expectedType: "birth-date",
    origin: "synthetic-hard",
    originDetail: "Data de nascimento do avalista",
  },
  {
    signals: "data_nascimento_fiador fiador_data_nascimento",
    expectedType: "birth-date",
    origin: "synthetic-hard",
    originDetail: "Data de nascimento do fiador",
  },
  {
    signals: "data_nascimento_testemunha testemunha_data_nascimento",
    expectedType: "birth-date",
    origin: "synthetic-hard",
    originDetail: "Data de nascimento da testemunha",
  },
  {
    signals: "data_nascimento_mae mae_data_nascimento",
    expectedType: "birth-date",
    origin: "synthetic-hard",
    originDetail: "Data de nascimento da mãe",
  },
  {
    signals: "data_nascimento_pai pai_data_nascimento",
    expectedType: "birth-date",
    origin: "synthetic-hard",
    originDetail: "Data de nascimento do pai",
  },
  {
    signals: "data_fundacao fundacao_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data de fundação",
  },
  {
    signals: "data_abertura abertura_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data de abertura",
  },
  {
    signals: "data_criacao criacao_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data de criação",
  },
  {
    signals: "data_emissao emissao_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data de emissão",
  },
  {
    signals: "data_vencimento vencimento_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data de vencimento",
  },
  {
    signals: "data_pagamento pagamento_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data de pagamento",
  },
  {
    signals: "data_recebimento recebimento_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data de recebimento",
  },
  {
    signals: "data_faturamento faturamento_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data de faturamento",
  },
  {
    signals: "data_nfe nfe_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data da NFe",
  },
  {
    signals: "data_xml xml_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data do XML",
  },
  {
    signals: "data_boleto boleto_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data do boleto",
  },
  {
    signals: "data_contato contato_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data de contato",
  },
  {
    signals: "data_emergencia emergencia_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data de emergência",
  },
  {
    signals: "data_cadastro cadastro_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data de cadastro",
  },
  {
    signals: "data_atualizacao atualizacao_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data de atualização",
  },
  {
    signals: "data_exclusao exclusao_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data de exclusão",
  },
  {
    signals: "data_inclusao inclusao_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data de inclusão",
  },
  {
    signals: "data_alteracao alteracao_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data de alteração",
  },
  {
    signals: "data_aprovacao aprovacao_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data de aprovação",
  },
  {
    signals: "data_reprovacao reprovacao_data",
    expectedType: "date",
    origin: "synthetic-hard",
    originDetail: "Data de reprovação",
  },

  // ── PASSWORD VARIATIONS ──
  {
    signals: "senha_titular titular_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha do titular",
  },
  {
    signals: "senha_responsavel responsavel_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha do responsável",
  },
  {
    signals: "senha_socio socio_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha do sócio",
  },
  {
    signals: "senha_dependente dependente_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha do dependente",
  },
  {
    signals: "senha_conjuge conjuge_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha do cônjuge",
  },
  {
    signals: "senha_avalista avalista_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha do avalista",
  },
  {
    signals: "senha_fiador fiador_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha do fiador",
  },
  {
    signals: "senha_testemunha testemunha_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha da testemunha",
  },
  {
    signals: "senha_empresa empresa_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha da empresa",
  },
  {
    signals: "senha_filial filial_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha da filial",
  },
  {
    signals: "senha_matriz matriz_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha da matriz",
  },
  {
    signals: "senha_fornecedor fornecedor_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha do fornecedor",
  },
  {
    signals: "senha_cliente cliente_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha do cliente",
  },
  {
    signals: "senha_transportadora transportadora_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha da transportadora",
  },
  {
    signals: "senha_faturamento faturamento_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha de faturamento",
  },
  {
    signals: "senha_pagamento pagamento_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha de pagamento",
  },
  {
    signals: "senha_nfe nfe_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha para NFe",
  },
  {
    signals: "senha_xml xml_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha para XML",
  },
  {
    signals: "senha_boleto boleto_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha para boleto",
  },
  {
    signals: "senha_contato contato_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha de contato",
  },
  {
    signals: "senha_emergencia emergencia_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha de emergência",
  },
  {
    signals: "senha_residencial residencial_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha residencial",
  },
  {
    signals: "senha_comercial comercial_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha comercial",
  },
  {
    signals: "senha_trabalho trabalho_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha de trabalho",
  },
  {
    signals: "senha_secundario secundario_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha secundária",
  },
  {
    signals: "senha_alternativo alternativo_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha alternativa",
  },
  {
    signals: "senha_recuperacao recuperacao_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha de recuperação",
  },
  {
    signals: "senha_cobranca cobranca_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha de cobrança",
  },
  {
    signals: "senha_entrega entrega_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha de entrega",
  },
  {
    signals: "senha_coleta coleta_senha",
    expectedType: "password",
    origin: "synthetic-hard",
    originDetail: "Senha de coleta",
  },

  // ── MONEY VARIATIONS ──
  {
    signals: "valor_titular titular_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor do titular",
  },
  {
    signals: "valor_responsavel responsavel_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor do responsável",
  },
  {
    signals: "valor_socio socio_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor do sócio",
  },
  {
    signals: "valor_dependente dependente_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor do dependente",
  },
  {
    signals: "valor_conjuge conjuge_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor do cônjuge",
  },
  {
    signals: "valor_avalista avalista_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor do avalista",
  },
  {
    signals: "valor_fiador fiador_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor do fiador",
  },
  {
    signals: "valor_testemunha testemunha_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor da testemunha",
  },
  {
    signals: "valor_empresa empresa_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor da empresa",
  },
  {
    signals: "valor_filial filial_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor da filial",
  },
  {
    signals: "valor_matriz matriz_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor da matriz",
  },
  {
    signals: "valor_fornecedor fornecedor_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor do fornecedor",
  },
  {
    signals: "valor_cliente cliente_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor do cliente",
  },
  {
    signals: "valor_transportadora transportadora_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor da transportadora",
  },
  {
    signals: "valor_faturamento faturamento_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor de faturamento",
  },
  {
    signals: "valor_pagamento pagamento_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor de pagamento",
  },
  {
    signals: "valor_nfe nfe_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor da NFe",
  },
  {
    signals: "valor_xml xml_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor do XML",
  },
  {
    signals: "valor_boleto boleto_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor do boleto",
  },
  {
    signals: "valor_contato contato_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor de contato",
  },
  {
    signals: "valor_emergencia emergencia_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor de emergência",
  },
  {
    signals: "valor_residencial residencial_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor residencial",
  },
  {
    signals: "valor_comercial comercial_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor comercial",
  },
  {
    signals: "valor_trabalho trabalho_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor de trabalho",
  },
  {
    signals: "valor_secundario secundario_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor secundário",
  },
  {
    signals: "valor_alternativo alternativo_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor alternativo",
  },
  {
    signals: "valor_recuperacao recuperacao_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor de recuperação",
  },
  {
    signals: "valor_cobranca cobranca_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor de cobrança",
  },
  {
    signals: "valor_entrega entrega_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor de entrega",
  },
  {
    signals: "valor_coleta coleta_valor",
    expectedType: "money",
    origin: "synthetic-hard",
    originDetail: "Valor de coleta",
  },

  // ── NUMBER VARIATIONS ──
  {
    signals: "numero_titular titular_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número do titular",
  },
  {
    signals: "numero_responsavel responsavel_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número do responsável",
  },
  {
    signals: "numero_socio socio_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número do sócio",
  },
  {
    signals: "numero_dependente dependente_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número do dependente",
  },
  {
    signals: "numero_conjuge conjuge_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número do cônjuge",
  },
  {
    signals: "numero_avalista avalista_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número do avalista",
  },
  {
    signals: "numero_fiador fiador_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número do fiador",
  },
  {
    signals: "numero_testemunha testemunha_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número da testemunha",
  },
  {
    signals: "numero_empresa empresa_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número da empresa",
  },
  {
    signals: "numero_filial filial_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número da filial",
  },
  {
    signals: "numero_matriz matriz_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número da matriz",
  },
  {
    signals: "numero_fornecedor fornecedor_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número do fornecedor",
  },
  {
    signals: "numero_cliente cliente_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número do cliente",
  },
  {
    signals: "numero_transportadora transportadora_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número da transportadora",
  },
  {
    signals: "numero_faturamento faturamento_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número de faturamento",
  },
  {
    signals: "numero_pagamento pagamento_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número de pagamento",
  },
  {
    signals: "numero_nfe nfe_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número para NFe",
  },
  {
    signals: "numero_xml xml_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número para XML",
  },
  {
    signals: "numero_boleto boleto_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número para boleto",
  },
  {
    signals: "numero_contato contato_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número de contato",
  },
  {
    signals: "numero_emergencia emergencia_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número de emergência",
  },
  {
    signals: "numero_residencial residencial_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número residencial",
  },
  {
    signals: "numero_comercial comercial_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número comercial",
  },
  {
    signals: "numero_trabalho trabalho_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número de trabalho",
  },
  {
    signals: "numero_secundario secundario_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número secundário",
  },
  {
    signals: "numero_alternativo alternativo_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número alternativo",
  },
  {
    signals: "numero_recuperacao recuperacao_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número de recuperação",
  },
  {
    signals: "numero_cobranca cobranca_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número de cobrança",
  },
  {
    signals: "numero_entrega entrega_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número de entrega",
  },
  {
    signals: "numero_coleta coleta_numero",
    expectedType: "number",
    origin: "synthetic-hard",
    originDetail: "Número de coleta",
  },

  // ── TEXT VARIATIONS ──
  {
    signals: "texto_titular titular_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto do titular",
  },
  {
    signals: "texto_responsavel responsavel_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto do responsável",
  },
  {
    signals: "texto_socio socio_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto do sócio",
  },
  {
    signals: "texto_dependente dependente_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto do dependente",
  },
  {
    signals: "texto_conjuge conjuge_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto do cônjuge",
  },
  {
    signals: "texto_avalista avalista_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto do avalista",
  },
  {
    signals: "texto_fiador fiador_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto do fiador",
  },
  {
    signals: "texto_testemunha testemunha_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto da testemunha",
  },
  {
    signals: "texto_empresa empresa_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto da empresa",
  },
  {
    signals: "texto_filial filial_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto da filial",
  },
  {
    signals: "texto_matriz matriz_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto da matriz",
  },
  {
    signals: "texto_fornecedor fornecedor_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto do fornecedor",
  },
  {
    signals: "texto_cliente cliente_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto do cliente",
  },
  {
    signals: "texto_transportadora transportadora_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto da transportadora",
  },
  {
    signals: "texto_faturamento faturamento_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto de faturamento",
  },
  {
    signals: "texto_pagamento pagamento_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto de pagamento",
  },
  {
    signals: "texto_nfe nfe_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto para NFe",
  },
  {
    signals: "texto_xml xml_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto para XML",
  },
  {
    signals: "texto_boleto boleto_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto para boleto",
  },
  {
    signals: "texto_contato contato_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto de contato",
  },
  {
    signals: "texto_emergencia emergencia_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto de emergência",
  },
  {
    signals: "texto_residencial residencial_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto residencial",
  },
  {
    signals: "texto_comercial comercial_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto comercial",
  },
  {
    signals: "texto_trabalho trabalho_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto de trabalho",
  },
  {
    signals: "texto_secundario secundario_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto secundário",
  },
  {
    signals: "texto_alternativo alternativo_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto alternativo",
  },
  {
    signals: "texto_recuperacao recuperacao_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto de recuperação",
  },
  {
    signals: "texto_cobranca cobranca_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto de cobrança",
  },
  {
    signals: "texto_entrega entrega_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto de entrega",
  },
  {
    signals: "texto_coleta coleta_texto",
    expectedType: "text",
    origin: "synthetic-hard",
    originDetail: "Texto de coleta",
  },

  // ── UNKNOWN VARIATIONS ──
  {
    signals: "desconhecido_titular titular_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido do titular",
  },
  {
    signals: "desconhecido_responsavel responsavel_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido do responsável",
  },
  {
    signals: "desconhecido_socio socio_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido do sócio",
  },
  {
    signals: "desconhecido_dependente dependente_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido do dependente",
  },
  {
    signals: "desconhecido_conjuge conjuge_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido do cônjuge",
  },
  {
    signals: "desconhecido_avalista avalista_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido do avalista",
  },
  {
    signals: "desconhecido_fiador fiador_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido do fiador",
  },
  {
    signals: "desconhecido_testemunha testemunha_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido da testemunha",
  },
  {
    signals: "desconhecido_empresa empresa_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido da empresa",
  },
  {
    signals: "desconhecido_filial filial_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido da filial",
  },
  {
    signals: "desconhecido_matriz matriz_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido da matriz",
  },
  {
    signals: "desconhecido_fornecedor fornecedor_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido do fornecedor",
  },
  {
    signals: "desconhecido_cliente cliente_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido do cliente",
  },
  {
    signals: "desconhecido_transportadora transportadora_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido da transportadora",
  },
  {
    signals: "desconhecido_faturamento faturamento_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido de faturamento",
  },
  {
    signals: "desconhecido_pagamento pagamento_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido de pagamento",
  },
  {
    signals: "desconhecido_nfe nfe_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido para NFe",
  },
  {
    signals: "desconhecido_xml xml_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido para XML",
  },
  {
    signals: "desconhecido_boleto boleto_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido para boleto",
  },
  {
    signals: "desconhecido_contato contato_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido de contato",
  },
  {
    signals: "desconhecido_emergencia emergencia_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido de emergência",
  },
  {
    signals: "desconhecido_residencial residencial_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido residencial",
  },
  {
    signals: "desconhecido_comercial comercial_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido comercial",
  },
  {
    signals: "desconhecido_trabalho trabalho_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido de trabalho",
  },
  {
    signals: "desconhecido_secundario secundario_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido secundário",
  },
  {
    signals: "desconhecido_alternativo alternativo_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido alternativo",
  },
  {
    signals: "desconhecido_recuperacao recuperacao_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido de recuperação",
  },
  {
    signals: "desconhecido_cobranca cobranca_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido de cobrança",
  },
  {
    signals: "desconhecido_entrega entrega_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido de entrega",
  },
  {
    signals: "desconhecido_coleta coleta_desconhecido",
    expectedType: "unknown",
    origin: "synthetic-hard",
    originDetail: "Desconhecido de coleta",
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
