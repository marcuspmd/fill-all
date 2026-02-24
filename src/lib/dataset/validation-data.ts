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
  // ═══════════════════════════════════════════════════════════════════════
  // ── CPF (8 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
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
    signals: "cpf_titular titular_cpf pessoa_fisica",
    expectedType: "cpf",
    note: "CPF titular",
  },
  {
    signals: "cpf_responsavel responsavel cpf cadastro",
    expectedType: "cpf",
    note: "CPF responsável cadastro",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── CNPJ (6 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
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
  {
    signals: "cnpj empresa contractor_cnpj",
    expectedType: "cnpj",
    note: "CNPJ contratante",
  },
  {
    signals: "cnpj_matriz headquarters_cnpj sede",
    expectedType: "cnpj",
    note: "CNPJ matriz",
  },
  {
    signals: "cadastro_cnpj registro firma cnpj",
    expectedType: "cnpj",
    note: "Cadastro de firma",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── CPF-CNPJ (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
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
  {
    signals: "documento cpf/cnpj cadastro contribuinte",
    expectedType: "cpf-cnpj",
    note: "Barra separadora",
  },
  {
    signals: "cpf_cnpj_devedor devedor documento",
    expectedType: "cpf-cnpj",
    note: "Contexto de devedor",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── RG (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
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
  {
    signals: "carteira_identidade ci_numero registro_geral",
    expectedType: "rg",
    note: "Carteira de identidade formal",
  },
  {
    signals: "rg_orgao_expedidor rg ssp orgao",
    expectedType: "rg",
    note: "RG com órgão expedidor",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── PASSPORT (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "passaporte numero_passaporte passport",
    expectedType: "passport",
    note: "Passaporte pt/en",
  },
  {
    signals: "passport_number travel_document passaporte_id",
    expectedType: "passport",
    note: "Documento de viagem",
  },
  {
    signals: "num_passaporte passport_input documento_viagem",
    expectedType: "passport",
    note: "Variação numérica",
  },
  {
    signals: "international_id passaporte_estrangeiro passport",
    expectedType: "passport",
    note: "ID internacional",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── CNH (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "cnh_motorista carteira_habilitacao cnh",
    expectedType: "cnh",
    note: "CNH padrão",
  },
  {
    signals: "habilitacao num_cnh driver_license",
    expectedType: "cnh",
    note: "Habilitação misto",
  },
  {
    signals: "registro_cnh cnh_numero carteira_motorista",
    expectedType: "cnh",
    note: "Registro CNH",
  },
  {
    signals: "cnh_condutor license_number habilitacao_input",
    expectedType: "cnh",
    note: "Condutor / license",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── PIS (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "pis_pasep pis numero trabalhador",
    expectedType: "pis",
    note: "PIS/PASEP",
  },
  {
    signals: "num_pis nit_input social_security",
    expectedType: "pis",
    note: "PIS com NIT",
  },
  {
    signals: "pis_funcionario pis_input cadastro_pis",
    expectedType: "pis",
    note: "PIS de funcionário",
  },
  {
    signals: "pasep_number pis_pasep_num contribuicao",
    expectedType: "pis",
    note: "PASEP number",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── NATIONAL-ID (3 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "national_id documento_nacional id_nacional",
    expectedType: "national-id",
    note: "ID nacional genérico",
  },
  {
    signals: "identification_number national_identification cedula",
    expectedType: "national-id",
    note: "Identificação nacional en",
  },
  {
    signals: "doc_identidade_nacional national_doc civic_id",
    expectedType: "national-id",
    note: "Documento cívico",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── TAX-ID (3 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "tax_id taxpayer_id inscricao_fiscal",
    expectedType: "tax-id",
    note: "Tax ID genérico",
  },
  {
    signals: "tax_identification_number tin_input fiscal",
    expectedType: "tax-id",
    note: "TIN input",
  },
  {
    signals: "vat_number tax_number contribuinte_fiscal",
    expectedType: "tax-id",
    note: "VAT / tax number",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── EMAIL (6 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
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
  {
    signals: "work_email corporate_email e-mail",
    expectedType: "email",
    note: "Email corporativo bilíngue",
  },
  {
    signals: "email_recuperacao recovery_email backup_email",
    expectedType: "email",
    note: "Email de recuperação",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── PHONE (6 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
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
    signals: "contato_tel fone-contato tel",
    expectedType: "phone",
    note: "Contato telefone",
  },
  {
    signals: "mobile_contact tel_whatsapp phone",
    expectedType: "phone",
    note: "Telefone contato mobile",
  },
  {
    signals: "telefone_fixo fone_residencial landline",
    expectedType: "phone",
    note: "Telefone fixo residencial",
  },
  {
    signals: "ddd_telefone tel_com_ddd fone_area",
    expectedType: "phone",
    note: "Telefone com DDD",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── MOBILE (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "num_cel celular-input numero-celular",
    expectedType: "mobile",
    note: "Variação celular",
  },
  {
    signals: "celular_pessoal meu_celular cell_phone",
    expectedType: "mobile",
    note: "Celular pessoal",
  },
  {
    signals: "mobile_phone smartphone_number celular",
    expectedType: "mobile",
    note: "Mobile phone en",
  },
  {
    signals: "tel_celular celular contato_movel",
    expectedType: "mobile",
    note: "Contato móvel",
  },
  {
    signals: "cell cel_input mobile_num",
    expectedType: "mobile",
    note: "Abreviação cell",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── WHATSAPP (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "whatsapp_number numero_whatsapp whats",
    expectedType: "whatsapp",
    note: "WhatsApp claro",
  },
  {
    signals: "zap zap_contato whatsapp_input",
    expectedType: "whatsapp",
    note: "Zap coloquial",
  },
  {
    signals: "wpp_number whatsapp contato_wpp",
    expectedType: "whatsapp",
    note: "Abrev WPP",
  },
  {
    signals: "whats_app celular_whatsapp msg_whatsapp",
    expectedType: "whatsapp",
    note: "WhatsApp com contexto",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── NAME (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
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
  {
    signals: "nome_aluno student_name aluno",
    expectedType: "name",
    note: "Nome de aluno",
  },
  {
    signals: "nome_participante participant_name inscricao",
    expectedType: "name",
    note: "Participante de evento",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── FIRST NAME (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "primeironome nome_primeiro first-name-input",
    expectedType: "first-name",
    note: "Variação primeiro nome",
  },
  {
    signals: "given_name fname primeiro_nome",
    expectedType: "first-name",
    note: "Given name en",
  },
  {
    signals: "nome_proprio first_name_field nome_batismo",
    expectedType: "first-name",
    note: "Nome próprio / batismo",
  },
  {
    signals: "prenome input_fname primeiro",
    expectedType: "first-name",
    note: "Prenome abreviado",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── LAST NAME (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "sobrenome_input inp_sobrenome family-name",
    expectedType: "last-name",
    note: "Variação sobrenome",
  },
  {
    signals: "surname_field lname apellido",
    expectedType: "last-name",
    note: "Surname / apellido",
  },
  {
    signals: "nome_familia last_name_input family",
    expectedType: "last-name",
    note: "Nome de família",
  },
  {
    signals: "segundo_nome sobrenome_paterno lname_input",
    expectedType: "last-name",
    note: "Sobrenome paterno",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── FULL NAME (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "nome-completo full-name-field nomecompleto",
    expectedType: "full-name",
    note: "Nome completo misto",
  },
  {
    signals: "fullname complete_name nome_inteiro",
    expectedType: "full-name",
    note: "Fullname en",
  },
  {
    signals: "nome_completo_responsavel full_name responsavel",
    expectedType: "full-name",
    note: "Nome completo do responsável",
  },
  {
    signals: "nome_completo_cadastro full_name_form nome_pessoa",
    expectedType: "full-name",
    note: "Nome completo de cadastro",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── ADDRESS (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
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
  {
    signals: "endereco_cobranca billing_address faturamento",
    expectedType: "address",
    note: "Endereço de cobrança",
  },
  {
    signals: "endereco_comercial business_address trabalho",
    expectedType: "address",
    note: "Endereço comercial",
  },
  {
    signals: "local_endereco address_line_1 endereco_principal",
    expectedType: "address",
    note: "Address line 1",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── STREET (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "via via_rua logradouro rua",
    expectedType: "street",
    note: "Variação via",
  },
  {
    signals: "nome_rua street_name avenida",
    expectedType: "street",
    note: "Nome da rua / avenida",
  },
  {
    signals: "logradouro_input travessa alameda rua_input",
    expectedType: "street",
    note: "Tipos de logradouro",
  },
  {
    signals: "street_address road_name estrada",
    expectedType: "street",
    note: "Street address en",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── HOUSE NUMBER (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "numero_imovel house_number num_address",
    expectedType: "house-number",
    note: "Número do imóvel",
  },
  {
    signals: "house_number number_endereco num_casa",
    expectedType: "house-number",
    note: "Numero de endereco",
  },
  {
    signals: "num_residencia numero_logradouro addr_number",
    expectedType: "house-number",
    note: "Número residência",
  },
  {
    signals: "numero_predial building_number nro_end",
    expectedType: "house-number",
    note: "Número predial",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── COMPLEMENT (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
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
  {
    signals: "addr_complement suite_number andar sala",
    expectedType: "complement",
    note: "Suite / andar / sala",
  },
  {
    signals: "compl_endereco unidade apt_number torre",
    expectedType: "complement",
    note: "Unidade / torre",
  },
  {
    signals: "addr_line_2 complemento_residencial edif_bloco",
    expectedType: "complement",
    note: "Linha 2 endereço / edifício",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── NEIGHBORHOOD (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "bairro_residencia neighborhood_name bairro",
    expectedType: "neighborhood",
    note: "Bairro residencial",
  },
  {
    signals: "nome_bairro distrito localidade bairro_input",
    expectedType: "neighborhood",
    note: "Distrito / localidade",
  },
  {
    signals: "bairro_entrega delivery_neighborhood regiao",
    expectedType: "neighborhood",
    note: "Bairro de entrega",
  },
  {
    signals: "setor_bairro zona_urbana neighborhood",
    expectedType: "neighborhood",
    note: "Setor / zona urbana",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── CITY (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "city_origin cidade_origem origin",
    expectedType: "city",
    note: "Cidade de origem",
  },
  {
    signals: "city_name municipality city",
    expectedType: "city",
    note: "Cidade em ingles",
  },
  {
    signals: "municipio_residencia cidade_moradia localidade",
    expectedType: "city",
    note: "Cidade de residência",
  },
  {
    signals: "cidade_entrega delivery_city city_shipping",
    expectedType: "city",
    note: "Cidade de entrega",
  },
  {
    signals: "localidade_cidade town_name urbe",
    expectedType: "city",
    note: "Localidade / town",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── STATE (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "uf_nascimento uf-nasc uf",
    expectedType: "state",
    note: "UF de nascimento",
  },
  {
    signals: "state_code uf estado",
    expectedType: "state",
    note: "Estado com uf",
  },
  {
    signals: "provincia_estado state_province regiao_estado",
    expectedType: "state",
    note: "Província / province",
  },
  {
    signals: "uf_endereco estado_input sigla_estado",
    expectedType: "state",
    note: "Sigla do estado",
  },
  {
    signals: "estado_civil state_field unidade_federativa",
    expectedType: "state",
    note: "Unidade federativa (ambíguo)",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── COUNTRY (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "pais_origem country_name pais",
    expectedType: "country",
    note: "País de origem",
  },
  {
    signals: "country_code nation pais_nascimento",
    expectedType: "country",
    note: "Country code / nação",
  },
  {
    signals: "nacionalidade_pais country_input pais_residencia",
    expectedType: "country",
    note: "País de residência",
  },
  {
    signals: "pais_destino destination_country travel_country",
    expectedType: "country",
    note: "País de destino",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── CEP (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "cep_entrega delivery_zip cep",
    expectedType: "cep",
    note: "CEP de entrega",
  },
  {
    signals: "cep_input buscar cep_code",
    expectedType: "cep",
    note: "CEP com busca",
  },
  {
    signals: "cep_residencia cep_endereco codigo_postal_br",
    expectedType: "cep",
    note: "CEP residencial",
  },
  {
    signals: "buscar_cep consulta_cep cep_autocomplete",
    expectedType: "cep",
    note: "Busca de CEP",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── ZIP CODE (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
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
  {
    signals: "postal_code zip_input mailing_code",
    expectedType: "zip-code",
    note: "Mailing code en",
  },
  {
    signals: "postcode area_code zip_postal",
    expectedType: "zip-code",
    note: "Postcode UK style",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── DATE (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "data_evento event_date data",
    expectedType: "date",
    note: "Data de evento",
  },
  {
    signals: "dt dt_field data",
    expectedType: "date",
    note: "Abrev. genérica data",
  },
  {
    signals: "data_emissao emission_date data_doc",
    expectedType: "date",
    note: "Data de emissão",
  },
  {
    signals: "data_cadastro registration_date data_registro",
    expectedType: "date",
    note: "Data de cadastro",
  },
  {
    signals: "data_assinatura sign_date data_contrato",
    expectedType: "date",
    note: "Data de assinatura",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── BIRTH DATE (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
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
  {
    signals: "data_nasc dob date_of_birth",
    expectedType: "birth-date",
    note: "DOB abreviação",
  },
  {
    signals: "nascimento_data aniversario data_aniversario",
    expectedType: "birth-date",
    note: "Aniversário / nascimento",
  },
  {
    signals: "birthdate_input birth_day idade_nascimento",
    expectedType: "birth-date",
    note: "Birthday input en",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── START DATE (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "data_inicio start_date inicio_periodo",
    expectedType: "start-date",
    note: "Data de início",
  },
  {
    signals: "dt_entrada entry_date data_admissao",
    expectedType: "start-date",
    note: "Data de admissão",
  },
  {
    signals: "vigencia_inicio begin_date from_date",
    expectedType: "start-date",
    note: "Vigência início",
  },
  {
    signals: "data_contratacao hiring_date start",
    expectedType: "start-date",
    note: "Data de contratação",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── END DATE (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "data_fim end_date fim_periodo",
    expectedType: "end-date",
    note: "Data de fim",
  },
  {
    signals: "dt_saida exit_date data_desligamento",
    expectedType: "end-date",
    note: "Data de desligamento",
  },
  {
    signals: "vigencia_fim finish_date to_date",
    expectedType: "end-date",
    note: "Vigência fim",
  },
  {
    signals: "data_encerramento closing_date end",
    expectedType: "end-date",
    note: "Data de encerramento",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── DUE DATE (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "data_vencimento due_date vencimento",
    expectedType: "due-date",
    note: "Data de vencimento",
  },
  {
    signals: "prazo_pagamento payment_due deadline",
    expectedType: "due-date",
    note: "Prazo de pagamento",
  },
  {
    signals: "vencimento_fatura invoice_due dt_vencimento",
    expectedType: "due-date",
    note: "Vencimento de fatura",
  },
  {
    signals: "data_limite expiry_date validade",
    expectedType: "due-date",
    note: "Data limite / validade",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── PASSWORD (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "new_password nova-senha create_password",
    expectedType: "password",
    note: "Nova senha",
  },
  {
    signals: "senha_acesso password_input secret",
    expectedType: "password",
    note: "Senha de acesso",
  },
  {
    signals: "pass_field pwd chave_acesso",
    expectedType: "password",
    note: "Password abreviado",
  },
  {
    signals: "senha_cadastro register_password criar_senha",
    expectedType: "password",
    note: "Senha de cadastro",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── CONFIRM PASSWORD (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "confirmar_senha confirm_password retype_password",
    expectedType: "confirm-password",
    note: "Confirmar senha padrão",
  },
  {
    signals: "senha_confirmacao password_confirm repetir_senha",
    expectedType: "confirm-password",
    note: "Repetir senha",
  },
  {
    signals: "re_password verify_password confirme_sua_senha",
    expectedType: "confirm-password",
    note: "Verify password en",
  },
  {
    signals: "pwd_confirm retype_pwd confirmacao",
    expectedType: "confirm-password",
    note: "Abreviação pwd confirm",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── USERNAME (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
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
  {
    signals: "user_id usuario_login handle_input",
    expectedType: "username",
    note: "User ID / handle",
  },
  {
    signals: "login_name screen_name nome_login",
    expectedType: "username",
    note: "Screen name / login",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── OTP (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "otp_code one_time_password codigo_otp",
    expectedType: "otp",
    note: "OTP padrão",
  },
  {
    signals: "token_sms sms_code codigo_sms",
    expectedType: "otp",
    note: "Código SMS",
  },
  {
    signals: "2fa_code two_factor autenticacao_dupla",
    expectedType: "otp",
    note: "2FA code",
  },
  {
    signals: "otp_input security_code codigo_seguranca_otp",
    expectedType: "otp",
    note: "Security code OTP",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── VERIFICATION CODE (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "codigo_verificacao verification_code verify",
    expectedType: "verification-code",
    note: "Código de verificação",
  },
  {
    signals: "confirmation_code codigo_confirmacao validate",
    expectedType: "verification-code",
    note: "Código de confirmação",
  },
  {
    signals: "pin_verificacao verify_pin email_code",
    expectedType: "verification-code",
    note: "PIN de verificação",
  },
  {
    signals: "activation_code codigo_ativacao activate",
    expectedType: "verification-code",
    note: "Código de ativação",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── COMPANY (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
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
  {
    signals: "razao_social social_name company_name",
    expectedType: "company",
    note: "Razão social",
  },
  {
    signals: "empresa_contratante firma contratante_nome",
    expectedType: "company",
    note: "Empresa contratante",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── SUPPLIER (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
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
  {
    signals: "supplier_name fornecedor principal vendor",
    expectedType: "supplier",
    note: "Fornecedor bilíngue",
  },
  {
    signals: "distribuidora distributor vendor_name",
    expectedType: "supplier",
    note: "Distribuidora / distributor",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── EMPLOYEE COUNT (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
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
  {
    signals: "employee_total headcount employees_count",
    expectedType: "employee-count",
    note: "Contagem de funcionarios",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── JOB TITLE (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
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
  {
    signals: "position_name cargo profissional",
    expectedType: "job-title",
    note: "Cargo bilíngue",
  },
  {
    signals: "atividade_profissional trabalho_funcao area_atuacao",
    expectedType: "job-title",
    note: "Atividade / área de atuação",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── DEPARTMENT (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "departamento_empresa department dept_name",
    expectedType: "department",
    note: "Departamento padrão",
  },
  {
    signals: "setor_trabalho area_department setor_rh",
    expectedType: "department",
    note: "Setor de trabalho / RH",
  },
  {
    signals: "division_name divisao departamento_input",
    expectedType: "department",
    note: "Divisão / division",
  },
  {
    signals: "departamento_lotacao setor_organizacional dept_lotacao",
    expectedType: "department",
    note: "Departamento de lotação",
  },
  {
    signals: "area_funcional team_department equipe_setor",
    expectedType: "department",
    note: "Área funcional / equipe",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── MONEY (6 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "valor_investimento investimento rendimento",
    expectedType: "money",
    note: "Investimento / rendimento",
  },
  {
    signals: "valor_total total_value montante",
    expectedType: "money",
    note: "Valor total",
  },
  {
    signals: "salario_bruto gross_salary remuneracao",
    expectedType: "money",
    note: "Salário bruto",
  },
  {
    signals: "renda_mensal monthly_income valor_renda",
    expectedType: "money",
    note: "Renda mensal",
  },
  {
    signals: "receita_anual annual_revenue faturamento",
    expectedType: "money",
    note: "Receita / faturamento",
  },
  {
    signals: "valor_patrimonio net_worth patrimonio",
    expectedType: "money",
    note: "Patrimônio líquido",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── PRICE (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "preco_unitario unit_price valor_unitario",
    expectedType: "price",
    note: "Preço unitário",
  },
  {
    signals: "preco_venda selling_price valor_venda",
    expectedType: "price",
    note: "Preço de venda",
  },
  {
    signals: "valor_produto product_price custo_item",
    expectedType: "price",
    note: "Preço do produto",
  },
  {
    signals: "preco_item item_price tarifa_unitaria",
    expectedType: "price",
    note: "Preço do item / tarifa",
  },
  {
    signals: "preco_por_kg price_per_unit valor_kg",
    expectedType: "price",
    note: "Preço por kg / unidade",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── AMOUNT (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "valor_parcela installment_amount parcela_pagamento",
    expectedType: "amount",
    note: "Valor da parcela",
  },
  {
    signals: "valor_entrada down_payment entrada_pedido",
    expectedType: "amount",
    note: "Valor de entrada",
  },
  {
    signals: "montante_total total_amount soma_transacao",
    expectedType: "amount",
    note: "Montante total",
  },
  {
    signals: "quantia_deposito deposit_amount valor_deposito",
    expectedType: "amount",
    note: "Quantia de depósito",
  },
  {
    signals: "valor_pagamento payment_amount valor_pagar",
    expectedType: "amount",
    note: "Valor de pagamento",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── DISCOUNT (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "desconto_percentual discount_percent percentual",
    expectedType: "discount",
    note: "Desconto percentual",
  },
  {
    signals: "valor_desconto discount_amount abatimento",
    expectedType: "discount",
    note: "Valor de desconto",
  },
  {
    signals: "desconto_cupom coupon_discount promocao",
    expectedType: "discount",
    note: "Desconto de cupom",
  },
  {
    signals: "rebate_value desconto_negociado reduction",
    expectedType: "discount",
    note: "Rebate / negociado",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── TAX (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "imposto_valor tax_amount aliquota",
    expectedType: "tax",
    note: "Imposto / alíquota",
  },
  {
    signals: "icms_valor tax_rate tributo",
    expectedType: "tax",
    note: "ICMS / tributo",
  },
  {
    signals: "iss_valor tax_percentage imposto_servico",
    expectedType: "tax",
    note: "ISS imposto serviço",
  },
  {
    signals: "taxa_impostos total_tax impostos",
    expectedType: "tax",
    note: "Total de impostos",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── CREDIT CARD NUMBER (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "numero_cartao card_number credit_card",
    expectedType: "credit-card-number",
    note: "Número do cartão",
  },
  {
    signals: "cc_number cartao_credito visa_mastercard",
    expectedType: "credit-card-number",
    note: "CC number / visa",
  },
  {
    signals: "numero_cartao_credito card_input payment_card",
    expectedType: "credit-card-number",
    note: "Payment card",
  },
  {
    signals: "card_num cartao_numero dados_cartao",
    expectedType: "credit-card-number",
    note: "Dados do cartão",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── CREDIT CARD EXPIRATION (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "validade_cartao expiry_date card_expiration",
    expectedType: "credit-card-expiration",
    note: "Validade do cartão",
  },
  {
    signals: "mm_yy exp_date data_validade_cartao",
    expectedType: "credit-card-expiration",
    note: "MM/YY expiration",
  },
  {
    signals: "card_expiry expiration_date vencimento_cartao",
    expectedType: "credit-card-expiration",
    note: "Card expiry",
  },
  {
    signals: "mes_ano_validade expiry_month_year valid_thru",
    expectedType: "credit-card-expiration",
    note: "Valid thru",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── CREDIT CARD CVV (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "cvv_cartao security_code cvv",
    expectedType: "credit-card-cvv",
    note: "CVV padrão",
  },
  {
    signals: "cvc_input cvv2 card_verification",
    expectedType: "credit-card-cvv",
    note: "CVC / CVV2",
  },
  {
    signals: "codigo_seguranca_cartao cvv_input tres_digitos",
    expectedType: "credit-card-cvv",
    note: "Código segurança 3 dígitos",
  },
  {
    signals: "security_number card_cvv verificacao_cartao",
    expectedType: "credit-card-cvv",
    note: "Security number",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── PIX KEY (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "chave_pix pix_key pix",
    expectedType: "pix-key",
    note: "Chave PIX padrão",
  },
  {
    signals: "pix_input chave_pagamento pix_cpf",
    expectedType: "pix-key",
    note: "PIX input",
  },
  {
    signals: "pix_email pix_telefone chave_pix_input",
    expectedType: "pix-key",
    note: "PIX email/telefone",
  },
  {
    signals: "codigo_pix pix_aleatoria random_pix",
    expectedType: "pix-key",
    note: "PIX aleatória",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── PRODUCT (5 samples — selection/dropdown context) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "selecione_produto produto_select escolha_item",
    expectedType: "product",
    note: "Seleção de produto (dropdown)",
  },
  {
    signals: "item_servico servico_combo product_dropdown",
    expectedType: "product",
    note: "Combo de serviço/produto",
  },
  {
    signals: "produto_catalogo catalog_item escolher_produto",
    expectedType: "product",
    note: "Catálogo/item para seleção",
  },
  {
    signals: "product_list select_product item_combo",
    expectedType: "product",
    note: "Lista de produtos (select)",
  },
  {
    signals: "mercadoria_selecionada goods_picker artigo_combo",
    expectedType: "product",
    note: "Seletor de mercadoria",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── PRODUCT NAME (5 samples — text input for display name) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "titulo_produto product_title nome_exibicao",
    expectedType: "product-name",
    note: "Título do produto (display name)",
  },
  {
    signals: "product_display_name nome_vitrine label_produto",
    expectedType: "product-name",
    note: "Nome de vitrine / label",
  },
  {
    signals: "nome_do_produto product_name_input nome_item",
    expectedType: "product-name",
    note: "Campo de texto para nome do item",
  },
  {
    signals: "product_heading titulo_anuncio listing_name",
    expectedType: "product-name",
    note: "Título de anúncio / heading",
  },
  {
    signals: "nome_artigo item_label product_display",
    expectedType: "product-name",
    note: "Nome do artigo (display)",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── SKU (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "sku_produto sku_code sku",
    expectedType: "sku",
    note: "SKU padrão",
  },
  {
    signals: "codigo_produto product_code ref_produto",
    expectedType: "sku",
    note: "Código do produto",
  },
  {
    signals: "referencia_item item_ref sku_input",
    expectedType: "sku",
    note: "Referência do item",
  },
  {
    signals: "part_number barcode_sku codigo_barras",
    expectedType: "sku",
    note: "Part number / barcode",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── QUANTITY (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "quantidade_itens qty_input quantity",
    expectedType: "quantity",
    note: "Quantidade de itens",
  },
  {
    signals: "qtd_pedido order_quantity qtde_compra",
    expectedType: "quantity",
    note: "Quantidade do pedido",
  },
  {
    signals: "unidades_compradas qty_purchased amount_items",
    expectedType: "quantity",
    note: "Unidades compradas",
  },
  {
    signals: "quantity_field num_items quant_produto",
    expectedType: "quantity",
    note: "Quantity field",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── COUPON (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "cupom_desconto coupon_code cupom",
    expectedType: "coupon",
    note: "Cupom de desconto",
  },
  {
    signals: "codigo_promocional promo_code voucher",
    expectedType: "coupon",
    note: "Código promocional",
  },
  {
    signals: "discount_code coupon_input cod_cupom",
    expectedType: "coupon",
    note: "Discount code",
  },
  {
    signals: "voucher_code vale_presente gift_code",
    expectedType: "coupon",
    note: "Voucher / vale presente",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── WEBSITE (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "site_empresa url_empresa website",
    expectedType: "website",
    note: "Site da empresa",
  },
  {
    signals: "homepage_url pagina_web site_url",
    expectedType: "website",
    note: "Homepage / página web",
  },
  {
    signals: "company_website url site empresa",
    expectedType: "website",
    note: "Website corporativo",
  },
  {
    signals: "website_pessoal site_pessoal portfolio_url",
    expectedType: "website",
    note: "Site pessoal / portfolio",
  },
  {
    signals: "pagina_internet internet_address homepage",
    expectedType: "website",
    note: "Página na internet",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── URL (4 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "link_site domain url",
    expectedType: "url",
    note: "Link / domain",
  },
  {
    signals: "url_input link_externo external_link",
    expectedType: "url",
    note: "URL / link externo",
  },
  {
    signals: "endereco_url href_input link_referencia",
    expectedType: "url",
    note: "Endereço URL / href",
  },
  {
    signals: "callback_url redirect_url return_url",
    expectedType: "url",
    note: "Callback / redirect URL",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── NUMBER (6 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
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
    signals: "codigo_promotora cod_agencia promoter_code",
    expectedType: "number",
    note: "Código numérico genérico",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── TEXT (6 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "campo_livre free_text input_texto",
    expectedType: "text",
    note: "Campo texto livre",
  },
  {
    signals: "campo_texto text input_1",
    expectedType: "text",
    note: "Genérico → texto",
  },
  {
    signals: "informacoes_adicionais additional_info extra",
    expectedType: "text",
    note: "Info adicionais",
  },
  {
    signals: "mensagem_texto message_input texto_livre",
    expectedType: "text",
    note: "Mensagem / texto livre",
  },
  {
    signals: "campo_generico generic_input other_info",
    expectedType: "text",
    note: "Campo genérico",
  },
  {
    signals: "motivo_contato reason_input assunto",
    expectedType: "text",
    note: "Motivo de contato / assunto",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── DESCRIPTION (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "descricao_servico service_description detalhes_servico",
    expectedType: "description",
    note: "Descrição de serviço",
  },
  {
    signals: "descricao_detalhada detailed_description detalhe_produto",
    expectedType: "description",
    note: "Descrição detalhada de produto",
  },
  {
    signals: "about_field descricao_sobre bio_perfil",
    expectedType: "description",
    note: "About / bio",
  },
  {
    signals: "resumo_descricao summary_desc overview_produto",
    expectedType: "description",
    note: "Resumo / overview de produto",
  },
  {
    signals: "descricao_anuncio ad_description listing_desc",
    expectedType: "description",
    note: "Descrição de anúncio",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── NOTES (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "comentarios comments_field notas_adicionais",
    expectedType: "notes",
    note: "Comentários",
  },
  {
    signals: "anotacoes_internas internal_notes obs_interna",
    expectedType: "notes",
    note: "Anotações internas",
  },
  {
    signals: "notas_reuniao meeting_notes memo_equipe",
    expectedType: "notes",
    note: "Notas de reunião",
  },
  {
    signals: "observacoes_pedido order_notes remarks_checkout",
    expectedType: "notes",
    note: "Observações do pedido",
  },
  {
    signals: "instrucoes_entrega delivery_notes obs_entrega",
    expectedType: "notes",
    note: "Instruções de entrega",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── SEARCH (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "buscar_produto search_input pesquisar",
    expectedType: "search",
    note: "Buscar / pesquisar",
  },
  {
    signals: "campo_busca search_field query_input",
    expectedType: "search",
    note: "Campo de busca",
  },
  {
    signals: "filtro_pesquisa search_filter procurar",
    expectedType: "search",
    note: "Filtro de pesquisa",
  },
  {
    signals: "search_box keyword_search busca_rapida",
    expectedType: "search",
    note: "Search box / busca rápida",
  },
  {
    signals: "pesquisa_catalogo catalog_search autocomplete_search",
    expectedType: "search",
    note: "Pesquisa catálogo / autocomplete",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── SELECT (5 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "selecione_opcao select_input dropdown",
    expectedType: "select",
    note: "Select / dropdown",
  },
  {
    signals: "escolha_item combo_box lista_opcoes",
    expectedType: "select",
    note: "Combobox / lista",
  },
  {
    signals: "opcao_selecionada chosen_select pick_one",
    expectedType: "select",
    note: "Opção selecionada",
  },
  {
    signals: "tipo_selecionado select_type dropdown_escolha",
    expectedType: "select",
    note: "Select de tipo / categoria",
  },
  {
    signals: "lista_selecao selectbox options_list",
    expectedType: "select",
    note: "Lista de seleção",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── CHECKBOX (6 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "aceito_termos checkbox_terms agree_check",
    expectedType: "checkbox",
    note: "Aceitar termos",
  },
  {
    signals: "marcar_opcao check_input checkbox_field",
    expectedType: "checkbox",
    note: "Marcar opção",
  },
  {
    signals: "concordo_politica privacy_checkbox aceitar",
    expectedType: "checkbox",
    note: "Concordar política",
  },
  {
    signals: "remember_me lembrar_login manter_conectado",
    expectedType: "checkbox",
    note: "Lembrar-me / stay signed in",
  },
  {
    signals: "opt_in newsletter_signup receber_emails",
    expectedType: "checkbox",
    note: "Opt-in newsletter",
  },
  {
    signals: "ativo_inativo active_toggle is_enabled",
    expectedType: "checkbox",
    note: "Toggle ativo/inativo",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── RADIO (3 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "sexo_genero gender_radio masculino_feminino",
    expectedType: "radio",
    note: "Gênero / sexo radio",
  },
  {
    signals: "tipo_pagamento payment_type radio_option",
    expectedType: "radio",
    note: "Tipo pagamento radio",
  },
  {
    signals: "radio_input escolha_unica single_choice",
    expectedType: "radio",
    note: "Radio escolha única",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── FILE (3 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "upload_arquivo file_input anexar_documento",
    expectedType: "file",
    note: "Upload / anexar",
  },
  {
    signals: "enviar_arquivo upload_field file_field",
    expectedType: "file",
    note: "Enviar arquivo",
  },
  {
    signals: "foto_perfil profile_picture image_upload",
    expectedType: "file",
    note: "Foto / imagem upload",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── AMBIGUOUS / HARD CASES (15 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "doc documento id_doc",
    expectedType: "cpf",
    note: "Documento genérico → CPF (mais comum)",
  },
  {
    signals: "valor valor_field value",
    expectedType: "money",
    note: "Valor genérico → money",
  },
  {
    signals: "numero number num_input",
    expectedType: "number",
    note: "Número genérico",
  },
  {
    signals: "data_1 campo_data date_field",
    expectedType: "date",
    note: "Campo data genérico",
  },
  {
    signals: "nome nome_input name",
    expectedType: "name",
    note: "Nome genérico sem contexto",
  },
  {
    signals: "endereco address addr",
    expectedType: "address",
    note: "Endereço genérico",
  },
  {
    signals: "telefone tel phone",
    expectedType: "phone",
    note: "Telefone genérico",
  },
  {
    signals: "senha password pwd",
    expectedType: "password",
    note: "Senha genérica",
  },
  {
    signals: "email mail e-mail",
    expectedType: "email",
    note: "Email genérico mínimo",
  },
  {
    signals: "cidade city municipio",
    expectedType: "city",
    note: "Cidade genérica",
  },
  {
    signals: "estado state uf",
    expectedType: "state",
    note: "Estado genérico",
  },
  {
    signals: "cep postal_code zip",
    expectedType: "cep",
    note: "CEP com contexto internacional",
  },
  {
    signals: "descricao description desc textarea",
    expectedType: "description",
    note: "Descrição com textarea",
  },
  {
    signals: "empresa company org",
    expectedType: "company",
    note: "Empresa genérica",
  },
  {
    signals: "cargo position title job",
    expectedType: "job-title",
    note: "Cargo genérico",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── EDGE CASES — Real-world forms (20 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "inscricao_estadual ie_number estadual",
    expectedType: "number",
    note: "Inscrição estadual → number (não é tipo específico)",
  },
  {
    signals: "matricula_funcionario employee_id registro",
    expectedType: "number",
    note: "Matrícula → number",
  },
  {
    signals: "protocolo_atendimento protocol_number ticket",
    expectedType: "number",
    note: "Protocolo → number",
  },
  {
    signals: "dv_conta digito_conta bank_account_digit",
    expectedType: "number",
    note: "DV da conta",
  },
  {
    signals: "bank_account_digit dv_conta",
    expectedType: "number",
    note: "Dígito conta bancário",
  },
  {
    signals: "razao_social_empresa company_legal_name cnpj_razao",
    expectedType: "company",
    note: "Razão social com CNPJ perto (ambíguo)",
  },
  {
    signals: "rua_numero street_number nr_end",
    expectedType: "house-number",
    note: "Número da rua (não a rua em si)",
  },
  {
    signals: "data_expedicao_rg rg_issue_date emissao",
    expectedType: "date",
    note: "Data expedição RG (é data, não RG)",
  },
  {
    signals: "nome_mae mother_name mae",
    expectedType: "name",
    note: "Nome da mãe",
  },
  {
    signals: "nome_pai father_name pai",
    expectedType: "name",
    note: "Nome do pai",
  },
  {
    signals: "naturalidade_cidade birth_city local_nascimento",
    expectedType: "city",
    note: "Naturalidade → cidade",
  },
  {
    signals: "orgao_emissor_rg issuing_authority ssp",
    expectedType: "text",
    note: "Órgão emissor → text",
  },
  {
    signals: "profissao_conjuge spouse_occupation ocupacao",
    expectedType: "job-title",
    note: "Profissão do cônjuge",
  },
  {
    signals: "email_nfe nfe_email nota_fiscal",
    expectedType: "email",
    note: "Email para NF-e",
  },
  {
    signals: "cep_destinatario recipient_zip dest_cep",
    expectedType: "cep",
    note: "CEP destinatário",
  },
  {
    signals: "telefone_comercial business_phone tel_trabalho",
    expectedType: "phone",
    note: "Tele comercial",
  },
  {
    signals: "cnpj_tomador tomador_cnpj prestacao",
    expectedType: "cnpj",
    note: "CNPJ do tomador de serviço",
  },
  {
    signals: "valor_frete shipping_cost frete",
    expectedType: "price",
    note: "Valor do frete",
  },
  {
    signals: "peso_produto product_weight peso_kg",
    expectedType: "number",
    note: "Peso do produto → number",
  },
  {
    signals: "data_entrega delivery_date previsao_entrega",
    expectedType: "date",
    note: "Data de entrega",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── MULTI-LANGUAGE STRESS (10 samples) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    signals: "nombre completo full_name nom_complet",
    expectedType: "full-name",
    note: "Espanhol + francês + inglês",
  },
  {
    signals: "correo_electronico email_address couriel",
    expectedType: "email",
    note: "Email espanhol / francês",
  },
  {
    signals: "direccion address endereço calle",
    expectedType: "address",
    note: "Endereço espanhol",
  },
  {
    signals: "telefono phone_number numero_telefone",
    expectedType: "phone",
    note: "Telefone espanhol",
  },
  {
    signals: "contraseña password mot_de_passe",
    expectedType: "password",
    note: "Senha espanhol / francês",
  },
  {
    signals: "fecha_nacimiento birthday geburtsdatum",
    expectedType: "birth-date",
    note: "Data nasc espanhol / alemão",
  },
  {
    signals: "codigo_postal zip_code code_postale",
    expectedType: "zip-code",
    note: "Código postal multilíngue",
  },
  {
    signals: "numero_tarjeta card_number carta_credito",
    expectedType: "credit-card-number",
    note: "Cartão espanhol / italiano",
  },
  {
    signals: "empresa company société unternehmen",
    expectedType: "company",
    note: "Empresa multilíngue",
  },
  {
    signals: "producto product produit produkt",
    expectedType: "product",
    note: "Produto multilíngue",
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
