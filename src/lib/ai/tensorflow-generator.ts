/**
 * TensorFlow.js-based field value generator
 * Uses a simple model to predict field types and generate appropriate values
 */

import type { FormField, FieldType } from "@/types";
import { generate } from "@/lib/generators";

// Field type keywords mapping for classification
const FIELD_TYPE_KEYWORDS: Record<FieldType, string[]> = {
  cpf: ["cpf", "documento", "document"],
  cnpj: ["cnpj", "empresa", "company-doc"],
  email: ["email", "e-mail", "mail", "correo"],
  phone: ["phone", "telefone", "celular", "tel", "mobile", "fone", "whatsapp"],
  name: ["name", "nome"],
  "first-name": ["first-name", "firstname", "primeiro-nome", "given-name"],
  "last-name": ["last-name", "lastname", "sobrenome", "family-name"],
  "full-name": ["fullname", "full-name", "nome-completo"],
  address: ["address", "endereco", "endereço", "logradouro"],
  street: ["street", "rua", "avenida", "av"],
  city: ["city", "cidade", "municipio"],
  state: ["state", "estado", "uf"],
  "zip-code": ["zip", "zipcode", "zip-code", "postal"],
  cep: ["cep", "codigo-postal"],
  date: ["date", "data"],
  "birth-date": ["birth", "nascimento", "birthday", "dob", "data-nascimento"],
  number: ["number", "numero", "quantidade", "qty"],
  password: ["password", "senha", "pass", "pwd"],
  username: ["username", "usuario", "user", "login"],
  company: [
    "company",
    "empresa",
    "razao-social",
    "razão-social",
    "organization",
  ],
  rg: ["rg", "registro-geral", "identidade"],
  text: ["text", "description", "descricao", "obs", "observacao", "comentario"],
  select: [],
  checkbox: [],
  radio: [],
  unknown: [],
};

/**
 * Classifies a field using keyword matching (lightweight alternative to full TF model).
 * Can be enhanced with a trained TF.js model for better accuracy.
 */
export function classifyField(field: FormField): FieldType {
  const signals = [
    field.label?.toLowerCase(),
    field.name?.toLowerCase(),
    field.id?.toLowerCase(),
    field.placeholder?.toLowerCase(),
    field.autocomplete?.toLowerCase(),
  ]
    .filter(Boolean)
    .join(" ");

  let bestMatch: FieldType = "unknown";
  let bestScore = 0;

  for (const [fieldType, keywords] of Object.entries(FIELD_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (signals.includes(keyword)) {
        const score = keyword.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = fieldType as FieldType;
        }
      }
    }
  }

  // Fallback: check HTML input type
  if (bestMatch === "unknown") {
    const inputType = field.element.type?.toLowerCase();
    const typeMap: Record<string, FieldType> = {
      email: "email",
      tel: "phone",
      password: "password",
      number: "number",
      date: "date",
      url: "text",
    };
    if (inputType && typeMap[inputType]) {
      bestMatch = typeMap[inputType];
    }
  }

  return bestMatch;
}

/**
 * Generate a value using TF.js classification + built-in generators
 */
export function generateWithTensorFlow(field: FormField): string {
  const detectedType = classifyField(field);
  return generate(detectedType);
}
