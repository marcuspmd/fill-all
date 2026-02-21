/**
 * Training Data — Signal→FieldType pairs for the TF.js classifier
 *
 * Each sample simulates the "contextSignals" string built from a real form
 * field (label + name + id + placeholder + autocomplete, all lowercased).
 *
 * The training set is split into:
 *   • TRAINING_SAMPLES   — used to build/update prototype vectors  (≈70%)
 *   • (validation/test)  — see validation-data.ts and test-data.ts (≈15%+15%)
 *
 * ──────────────────────────────────────────────────────────────────────────
 * HOW TO ADD NEW SAMPLES:
 *   1. Add a new { signals, type, ... } entry to the appropriate section
 *   2. Use realistic signal strings (copy from real pages when possible)
 *   3. The `source` field documents where the sample came from
 *   4. Re-run the test suite to check dataset balance
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { FieldType } from "@/types";

export interface TrainingSample {
  /** Normalised signals string (label+name+id+placeholder concatenated) */
  signals: string;
  /** Expected field type */
  type: FieldType;
  /** Where this sample came from */
  source: "synthetic" | "real-world" | "augmented" | "learned";
  /** Optional: original URL domain (for real-world samples) */
  domain?: string;
  /** Difficulty level for curriculum learning */
  difficulty: "easy" | "medium" | "hard";
}

// ── CPF ─────────────────────────────────────────────────────────────────────

const CPF_SAMPLES: TrainingSample[] = [
  {
    signals: "cpf cpf cpf_field digite seu cpf",
    type: "cpf",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "cpf cadastro-pessoa-fisica cpf_input cpf",
    type: "cpf",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "cpf-cnpj documento cpf_cnpj informe o cpf",
    type: "cpf",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "nr_cpf cpf numero_cpf",
    type: "cpf",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "cadastro pessoa cpf txt_cpf",
    type: "cpf",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "cpf do titular cpf_titular campo_cpf",
    type: "cpf",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "cpf responsavel cpf_resp cpf-responsavel",
    type: "cpf",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "documento fiscal cpf input-doc-cpf",
    type: "cpf",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "cpf_contribuinte contribuinte cpf",
    type: "cpf",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "cpf sem pontos cpf_limpo informe apenas numeros",
    type: "cpf",
    source: "synthetic",
    difficulty: "hard",
  },
  {
    signals: "cpf_conjuge conjuge cpf",
    type: "cpf",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "numero cpf cpf_number",
    type: "cpf",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "cpf/cnpj documento identificacao",
    type: "cpf",
    source: "augmented",
    difficulty: "hard",
  },
  {
    signals: "informe cpf cpf_field_1 cpf do cliente",
    type: "cpf",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "seu cpf cpf-input placeholder-cpf",
    type: "cpf",
    source: "augmented",
    difficulty: "easy",
  },
];

// ── CNPJ ────────────────────────────────────────────────────────────────────

const CNPJ_SAMPLES: TrainingSample[] = [
  {
    signals: "cnpj cnpj cnpj_field informe o cnpj",
    type: "cnpj",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "cnpj da empresa cnpj_empresa empresa",
    type: "cnpj",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "cadastro nacional cnpj inscricao_federal",
    type: "cnpj",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "cnpj fornecedor cnpj_forn cnpj-fornecedor",
    type: "cnpj",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "cnpj_contratante pessoa juridica cnpj",
    type: "cnpj",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "nr_cnpj cnpj numero_cnpj",
    type: "cnpj",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "inscricao federal cnpj_empresa_input",
    type: "cnpj",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "cnpj_tomador tomador de servico cnpj",
    type: "cnpj",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "documento empresa cnpj empresa_cnpj",
    type: "cnpj",
    source: "augmented",
    difficulty: "medium",
  },
  {
    signals: "cnpj matriz cnpj_matriz filial",
    type: "cnpj",
    source: "synthetic",
    difficulty: "medium",
  },
];

// ── RG ──────────────────────────────────────────────────────────────────────

const RG_SAMPLES: TrainingSample[] = [
  {
    signals: "rg rg rg_field informe o rg",
    type: "rg",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "registro geral rg identidade",
    type: "rg",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "carteira identidade rg_numero cart_identidade",
    type: "rg",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "numero rg nr_rg rg-numero",
    type: "rg",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "doc rg rg_doc documento identidade",
    type: "rg",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "rg orgao emissor rg_emissor",
    type: "rg",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "registro geral identidade inp_rg",
    type: "rg",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "numero identidade rg_input campo_rg",
    type: "rg",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "identidade rg-field id_rg",
    type: "rg",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "carteira de identidade ci_rg",
    type: "rg",
    source: "augmented",
    difficulty: "medium",
  },
];

// ── EMAIL ───────────────────────────────────────────────────────────────────

const EMAIL_SAMPLES: TrainingSample[] = [
  {
    signals: "email email email_field seu email",
    type: "email",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "e-mail email endereco_email email",
    type: "email",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "email corporativo email_corp email",
    type: "email",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "email pessoal email_pessoal email-personal",
    type: "email",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "contato email email_contato",
    type: "email",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "endereço eletrônico email e_mail",
    type: "email",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "correo electronico correo email",
    type: "email",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "mail address emailaddress email",
    type: "email",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "email confirmação confirmar email confirm_email",
    type: "email",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "email de recuperação recovery_email",
    type: "email",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "email responsavel email_resp",
    type: "email",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "enter your email email_input",
    type: "email",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "login email user_email",
    type: "email",
    source: "augmented",
    difficulty: "medium",
  },
  {
    signals: "email address email_addr",
    type: "email",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "email_usuario usuario email",
    type: "email",
    source: "synthetic",
    difficulty: "easy",
  },
];

// ── PHONE ───────────────────────────────────────────────────────────────────

const PHONE_SAMPLES: TrainingSample[] = [
  {
    signals: "telefone telefone phone_field seu telefone",
    type: "phone",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "phone phone tel informe telefone",
    type: "phone",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "celular celular mobile celular com ddd",
    type: "phone",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "tel_residencial telefone residencial tel",
    type: "phone",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "fone fone fone_input telefone",
    type: "phone",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "whatsapp whatsapp_number whatsapp",
    type: "phone",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "ddd telefone ddd_telefone phone",
    type: "phone",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "contato telefonico tel_contato phone-contact",
    type: "phone",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "numero celular numero_celular cell",
    type: "phone",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "tel comercial tel_comercial tel-business",
    type: "phone",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "phone number phonenumber tel",
    type: "phone",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "mobile number mobile_number cell",
    type: "phone",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "cellular celular_input celular",
    type: "phone",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "contato telefone tel fone",
    type: "phone",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "telefone para contato fone_contato",
    type: "phone",
    source: "synthetic",
    difficulty: "medium",
  },
];

// ── NAME VARIANTS ───────────────────────────────────────────────────────────

const NAME_SAMPLES: TrainingSample[] = [
  {
    signals: "nome nome nome_field seu nome",
    type: "name",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "name name name_input your name",
    type: "name",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "nome do cliente nome_cliente nome",
    type: "name",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "nome titular nome_titular",
    type: "name",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "nome do responsavel nome_resp",
    type: "name",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "nome mae nome_mae nome-da-mae",
    type: "name",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "nome pai nome_pai nome-do-pai",
    type: "name",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "nome social nome_social",
    type: "name",
    source: "augmented",
    difficulty: "medium",
  },
];

const FIRST_NAME_SAMPLES: TrainingSample[] = [
  {
    signals: "primeiro nome first-name firstname",
    type: "first-name",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "first name firstname given-name",
    type: "first-name",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "nome próprio primeiro_nome prenome",
    type: "first-name",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "given name givenname first_name_input",
    type: "first-name",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "primeironome first_name fname",
    type: "first-name",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "primeiro-nome primeiro nome prenome",
    type: "first-name",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "nome_primeiro inp_firstname first",
    type: "first-name",
    source: "augmented",
    difficulty: "medium",
  },
  {
    signals: "first firstname input_first_name",
    type: "first-name",
    source: "augmented",
    difficulty: "easy",
  },
];

const LAST_NAME_SAMPLES: TrainingSample[] = [
  {
    signals: "sobrenome sobrenome lastname",
    type: "last-name",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "last name lastname family-name",
    type: "last-name",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "surname surname last_name_input",
    type: "last-name",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "family name familyname lname",
    type: "last-name",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "apelido familia sobrenome_input",
    type: "last-name",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "nome familia last_name_field",
    type: "last-name",
    source: "augmented",
    difficulty: "medium",
  },
  {
    signals: "sobrenome_input inp_lastname last",
    type: "last-name",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "ultimo nome ultimo_nome last_name",
    type: "last-name",
    source: "augmented",
    difficulty: "medium",
  },
];

const FULL_NAME_SAMPLES: TrainingSample[] = [
  {
    signals: "nome completo nome_completo fullname",
    type: "full-name",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "full name fullname full_name",
    type: "full-name",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "nomecompleto nome-completo full-name",
    type: "full-name",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "nome completo do titular full_name_input",
    type: "full-name",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "nome completo sem abreviação nomecompleto",
    type: "full-name",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "razao_nome nome completo razao",
    type: "full-name",
    source: "augmented",
    difficulty: "hard",
  },
  {
    signals: "fullname_input nome-completo full",
    type: "full-name",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "nome inteiro nome_completo_input",
    type: "full-name",
    source: "augmented",
    difficulty: "medium",
  },
];

// ── ADDRESS ─────────────────────────────────────────────────────────────────

const ADDRESS_SAMPLES: TrainingSample[] = [
  {
    signals: "endereco endereco address_field seu endereco",
    type: "address",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "endereço endereço endereco_completo",
    type: "address",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "address address addr informe endereco",
    type: "address",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "endereco completo endereco_full address-full",
    type: "address",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "billing address billing_address endereco cobranca",
    type: "address",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "shipping address shipping_addr endereco entrega",
    type: "address",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "address line 1 address1 endereco",
    type: "address",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "address line 2 address2 complemento",
    type: "address",
    source: "augmented",
    difficulty: "medium",
  },
  {
    signals: "endereco_residencial residencial endereco",
    type: "address",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "endereco_comercial empresarial endereco",
    type: "address",
    source: "synthetic",
    difficulty: "easy",
  },
];

const STREET_SAMPLES: TrainingSample[] = [
  {
    signals: "rua rua street logradouro",
    type: "street",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "street street street_address rua",
    type: "street",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "logradouro logradouro rua_avenida",
    type: "street",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "avenida avenida av logradouro",
    type: "street",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "alameda travessa rodovia logradouro",
    type: "street",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "street address streetaddress street_addr",
    type: "street",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "nome da rua rua_nome street-name",
    type: "street",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "estrada estrada_input rodovia",
    type: "street",
    source: "augmented",
    difficulty: "medium",
  },
  {
    signals: "logradouro_input inp_rua street",
    type: "street",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "endereco rua logradouro_field",
    type: "street",
    source: "synthetic",
    difficulty: "easy",
  },
];

const CITY_SAMPLES: TrainingSample[] = [
  {
    signals: "cidade cidade city city_field",
    type: "city",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "city city city_input sua cidade",
    type: "city",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "municipio municipio cidade_municipio",
    type: "city",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "município município localidade",
    type: "city",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "billing city billing_city cidade cobranca",
    type: "city",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "shipping city shipping_city cidade entrega",
    type: "city",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "localidade localidade municipio_cidade",
    type: "city",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "cidade nascimento cidade_nasc birth_city",
    type: "city",
    source: "augmented",
    difficulty: "medium",
  },
  {
    signals: "onde mora cidade_residencia city",
    type: "city",
    source: "augmented",
    difficulty: "medium",
  },
  {
    signals: "cidade_input inp_city cidade",
    type: "city",
    source: "augmented",
    difficulty: "easy",
  },
];

const STATE_SAMPLES: TrainingSample[] = [
  {
    signals: "estado estado state state_field",
    type: "state",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "state state state_input province",
    type: "state",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "uf uf uf_field unidade federativa",
    type: "state",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "unidade federativa uf_input uf",
    type: "state",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "billing state billing_state estado",
    type: "state",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "shipping state shipping_state estado",
    type: "state",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "estado_residencia state_res uf",
    type: "state",
    source: "augmented",
    difficulty: "medium",
  },
  {
    signals: "estado_nascimento birth_state uf",
    type: "state",
    source: "augmented",
    difficulty: "medium",
  },
  {
    signals: "estado_input inp_state uf",
    type: "state",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "provincia province estado",
    type: "state",
    source: "augmented",
    difficulty: "medium",
  },
];

const ZIP_CODE_SAMPLES: TrainingSample[] = [
  {
    signals: "zip zip zipcode zip-code",
    type: "zip-code",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "zip code zip_code postal_code",
    type: "zip-code",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "postal code postalcode zip",
    type: "zip-code",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "postal postal_input zip_field",
    type: "zip-code",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "billing zip billing_zip zipcode",
    type: "zip-code",
    source: "augmented",
    difficulty: "medium",
  },
  {
    signals: "shipping zip shipping_postal zip",
    type: "zip-code",
    source: "augmented",
    difficulty: "medium",
  },
];

const CEP_SAMPLES: TrainingSample[] = [
  {
    signals: "cep cep cep_field informe o cep",
    type: "cep",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "cep cep codigo_postal cep",
    type: "cep",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "codigo postal codigopostal cep",
    type: "cep",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "cep residencial cep_res cep",
    type: "cep",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "cep comercial cep_com cep",
    type: "cep",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "cod postal cod_postal cep",
    type: "cep",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "postalcode cep cep_input",
    type: "cep",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "cep do endereco cep_endereco",
    type: "cep",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "informe seu cep cep_field_input",
    type: "cep",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "buscar cep cep_busca consulta_cep",
    type: "cep",
    source: "augmented",
    difficulty: "medium",
  },
];

// ── DATES ───────────────────────────────────────────────────────────────────

const DATE_SAMPLES: TrainingSample[] = [
  {
    signals: "data data date date_field",
    type: "date",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "date date data_input data",
    type: "date",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "data inicio datainicio start_date",
    type: "date",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "data fim datafim end_date",
    type: "date",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "data-inicio data_inicio start-date",
    type: "date",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "data-fim data_fim end-date",
    type: "date",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "validade validade_input expiry",
    type: "date",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "expiration expiry_date validade",
    type: "date",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "vigencia vigencia_input data",
    type: "date",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "vencimento data_vencimento due_date",
    type: "date",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "data admissao data_admissao hire_date",
    type: "date",
    source: "augmented",
    difficulty: "medium",
  },
  {
    signals: "data emissao data_emissao issued_date",
    type: "date",
    source: "augmented",
    difficulty: "medium",
  },
];

const BIRTH_DATE_SAMPLES: TrainingSample[] = [
  {
    signals: "nascimento data_nascimento birth_date",
    type: "birth-date",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "data nascimento datanascimento birthday",
    type: "birth-date",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "data de nascimento data-nascimento dob",
    type: "birth-date",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "birthday birthday birth_date bday",
    type: "birth-date",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "date of birth date-of-birth dob",
    type: "birth-date",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "dt nascimento dt_nasc dt-nascimento",
    type: "birth-date",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "aniversario aniversario_input birth",
    type: "birth-date",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "data_nascimento_input dtnasc birthdate",
    type: "birth-date",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "nascido em born_on birth_date",
    type: "birth-date",
    source: "augmented",
    difficulty: "medium",
  },
  {
    signals: "quando nasceu birth_date_input",
    type: "birth-date",
    source: "augmented",
    difficulty: "hard",
  },
  {
    signals: "data_nasc_field nasc nascimento",
    type: "birth-date",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "birth birthdate data_nasc",
    type: "birth-date",
    source: "augmented",
    difficulty: "easy",
  },
];

// ── AUTH ─────────────────────────────────────────────────────────────────────

const PASSWORD_SAMPLES: TrainingSample[] = [
  {
    signals: "password password password_field sua senha",
    type: "password",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "senha senha senha_field password",
    type: "password",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "pass pass pwd password",
    type: "password",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "nova senha new-password new_password",
    type: "password",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "confirmar senha confirm-password confirm_pwd",
    type: "password",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "current password current-password senha_atual",
    type: "password",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "repeat password repeat-password retype",
    type: "password",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "senha_input inp_password pass",
    type: "password",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "digite sua senha passwd password",
    type: "password",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "confirme a senha confirm_senha",
    type: "password",
    source: "augmented",
    difficulty: "easy",
  },
];

const USERNAME_SAMPLES: TrainingSample[] = [
  {
    signals: "username username user_name login",
    type: "username",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "usuario usuario user login",
    type: "username",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "login login login_field username",
    type: "username",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "user name user-name user_input",
    type: "username",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "handle handle nick nickname",
    type: "username",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "apelido apelido nick_input nick",
    type: "username",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "login name login-name login_field",
    type: "username",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "nome usuario nome_usuario user",
    type: "username",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "seu login login_input informe",
    type: "username",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "user_field inp_username login",
    type: "username",
    source: "augmented",
    difficulty: "easy",
  },
];

// ── BUSINESS ────────────────────────────────────────────────────────────────

const COMPANY_SAMPLES: TrainingSample[] = [
  {
    signals: "empresa empresa company company_field",
    type: "company",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "company company org organization",
    type: "company",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "razao social razao_social razao-social",
    type: "company",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "razão social razão-social company",
    type: "company",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "nome empresa nome_empresa companyname",
    type: "company",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "nome fantasia nome_fantasia fantasy-name",
    type: "company",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "organization organization-name org_name",
    type: "company",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "nome da empresa empresa_input company",
    type: "company",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "empresa_field inp_company nome_empresa",
    type: "company",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "entidade organizacao org empresa",
    type: "company",
    source: "augmented",
    difficulty: "medium",
  },
];

// ── NUMERIC / FINANCIAL ─────────────────────────────────────────────────────

const MONEY_SAMPLES: TrainingSample[] = [
  {
    signals: "valor valor money amount",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "preco preco price valor",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "preço preço valor_field money",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "amount amount valor total",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "salario salario salary renda",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "renda renda income valor_renda",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "custo custo cost valor_custo",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "total total subtotal valor_total",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "desconto desconto discount valor",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "margem margem markup valor",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "receita receita revenue faturamento",
    type: "money",
    source: "augmented",
    difficulty: "medium",
  },
  {
    signals: "valor parcela valor_parcela installment",
    type: "money",
    source: "augmented",
    difficulty: "medium",
  },
];

const NUMBER_SAMPLES: TrainingSample[] = [
  {
    signals: "numero numero number num_field",
    type: "number",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "number number qty quantidade",
    type: "number",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "quantidade quantidade qty count",
    type: "number",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "age idade age_field age",
    type: "number",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "idade idade_input years anos",
    type: "number",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "complemento complemento num_compl",
    type: "number",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "count count num total_count",
    type: "number",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "num parcelas num_parcelas installments",
    type: "number",
    source: "augmented",
    difficulty: "medium",
  },
  {
    signals: "numero_input inp_number num",
    type: "number",
    source: "augmented",
    difficulty: "easy",
  },
  {
    signals: "qtd qtd_input quantidade",
    type: "number",
    source: "augmented",
    difficulty: "easy",
  },
];

// ── TEXT ─────────────────────────────────────────────────────────────────────

const TEXT_SAMPLES: TrainingSample[] = [
  {
    signals: "descricao descricao description text",
    type: "text",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "description description desc text_field",
    type: "text",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "observacao observacao obs note",
    type: "text",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "observação obs_field notas",
    type: "text",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "comentario comentario comment message",
    type: "text",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "mensagem mensagem message msg_field",
    type: "text",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "nota nota note_field anotacao",
    type: "text",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "bio bio about sobre",
    type: "text",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "informacoes informacoes details info",
    type: "text",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "detalhe detalhe details detail_field",
    type: "text",
    source: "synthetic",
    difficulty: "easy",
  },
  {
    signals: "convenio convênio agreement_input",
    type: "text",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "matricula matrícula enrollment_field",
    type: "text",
    source: "synthetic",
    difficulty: "medium",
  },
  {
    signals: "motivo motivo reason_field",
    type: "text",
    source: "augmented",
    difficulty: "medium",
  },
  {
    signals: "justificativa justificativa justification",
    type: "text",
    source: "augmented",
    difficulty: "medium",
  },
  {
    signals: "parecer parecer opinion_field",
    type: "text",
    source: "augmented",
    difficulty: "medium",
  },
];

// ── HARD / AMBIGUOUS SAMPLES ────────────────────────────────────────────────
// These samples test the classifier with signals that could match multiple types.

const HARD_SAMPLES: TrainingSample[] = [
  // "nome" in label + "email" in id → should be email (id is more specific)
  {
    signals: "nome email_input email",
    type: "email",
    source: "augmented",
    difficulty: "hard",
  },
  // "data" alone is generic — context helps
  {
    signals: "data campo_data informe a data",
    type: "date",
    source: "augmented",
    difficulty: "hard",
  },
  // "numero" could be phone, number, address number...
  {
    signals: "numero do documento nr_doc",
    type: "number",
    source: "augmented",
    difficulty: "hard",
  },
  // "endereco" in a textarea context
  {
    signals: "endereco completo obs endereco_obs",
    type: "address",
    source: "augmented",
    difficulty: "hard",
  },
  // Very short signal
  { signals: "tel", type: "phone", source: "augmented", difficulty: "hard" },
  // Mixed Portuguese/English
  {
    signals: "nome completo full name input_name",
    type: "full-name",
    source: "augmented",
    difficulty: "hard",
  },
  // Abbreviations
  {
    signals: "dt nasc dtnasc",
    type: "birth-date",
    source: "augmented",
    difficulty: "hard",
  },
  // No clear signal
  {
    signals: "campo1 field1 input1",
    type: "unknown",
    source: "augmented",
    difficulty: "hard",
  },
  // Misleading: "nome" in company context
  {
    signals: "nome fantasia empresa nome_fantasia",
    type: "company",
    source: "augmented",
    difficulty: "hard",
  },
  // "valor" could be money or number
  {
    signals: "valor total valor_total total_amount",
    type: "money",
    source: "augmented",
    difficulty: "hard",
  },
];

// ── Aggregate all training samples ──────────────────────────────────────────

export const TRAINING_SAMPLES: TrainingSample[] = [
  ...CPF_SAMPLES,
  ...CNPJ_SAMPLES,
  ...RG_SAMPLES,
  ...EMAIL_SAMPLES,
  ...PHONE_SAMPLES,
  ...NAME_SAMPLES,
  ...FIRST_NAME_SAMPLES,
  ...LAST_NAME_SAMPLES,
  ...FULL_NAME_SAMPLES,
  ...ADDRESS_SAMPLES,
  ...STREET_SAMPLES,
  ...CITY_SAMPLES,
  ...STATE_SAMPLES,
  ...ZIP_CODE_SAMPLES,
  ...CEP_SAMPLES,
  ...DATE_SAMPLES,
  ...BIRTH_DATE_SAMPLES,
  ...PASSWORD_SAMPLES,
  ...USERNAME_SAMPLES,
  ...COMPANY_SAMPLES,
  ...MONEY_SAMPLES,
  ...NUMBER_SAMPLES,
  ...TEXT_SAMPLES,
  ...HARD_SAMPLES,
];

/** Get training samples filtered by difficulty */
export function getTrainingSamplesByDifficulty(
  difficulty: TrainingSample["difficulty"],
): TrainingSample[] {
  return TRAINING_SAMPLES.filter((s) => s.difficulty === difficulty);
}

/** Get training samples filtered by type */
export function getTrainingSamplesByType(type: FieldType): TrainingSample[] {
  return TRAINING_SAMPLES.filter((s) => s.type === type);
}

/** Get the distribution of types in the training set */
export function getTrainingDistribution(): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const s of TRAINING_SAMPLES) {
    dist[s.type] = (dist[s.type] || 0) + 1;
  }
  return dist;
}
