/**
 * Miscellaneous generators: password, username, number
 */

import { generateCpf } from "./cpf";
import { generateCnpj } from "./cnpj";

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generatePassword(length = 12): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (v) => chars[v % chars.length]).join("");
}

export function generateUsername(): string {
  const adjectives = [
    "cool",
    "fast",
    "smart",
    "brave",
    "dark",
    "epic",
    "wild",
    "neo",
    "dev",
    "pro",
  ];
  const nouns = [
    "coder",
    "ninja",
    "tiger",
    "wolf",
    "hawk",
    "fox",
    "byte",
    "node",
    "pixel",
    "stack",
  ];
  const num = Math.floor(Math.random() * 999);
  return `${randomItem(adjectives)}_${randomItem(nouns)}${num}`;
}

export function generateNumber(min = 1, max = 99999): string {
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

export function generateText(wordCount = 5): string {
  const words = [
    "lorem",
    "ipsum",
    "dolor",
    "sit",
    "amet",
    "consectetur",
    "adipiscing",
    "elit",
    "sed",
    "tempor",
    "incididunt",
    "labore",
    "magna",
    "aliqua",
    "enim",
    "minim",
    "veniam",
    "quis",
    "nostrud",
    "exercitation",
  ];
  return Array.from({ length: wordCount }, () => randomItem(words)).join(" ");
}

export function generateMoney(min = 1, max = 10000): string {
  if (min === max) return min.toFixed(2);
  const raw = min + Math.random() * (max - min);
  return raw.toFixed(2);
}

export function generateWebsite(): string {
  const domains = [
    "minhapagina",
    "seusite",
    "empresa",
    "loja",
    "portal",
    "blog",
    "sistema",
    "plataforma",
    "startup",
    "negocio",
  ];
  const tlds = ["com.br", "com", "net", "io", "app", "digital", "online"];
  return `https://www.${randomItem(domains)}.${randomItem(tlds)}`;
}

export function generateProductName(): string {
  const adjectives = [
    "Premium",
    "Pro",
    "Lite",
    "Ultra",
    "Smart",
    "Fast",
    "Plus",
    "Max",
    "Mini",
    "Standard",
  ];
  const nouns = [
    "Pacote",
    "Kit",
    "Módulo",
    "Solução",
    "Serviço",
    "Produto",
    "Item",
    "Pacote",
    "Plano",
    "Assinatura",
  ];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${randomItem(adjectives)} ${randomItem(nouns)} ${num}`;
}

export function generateJobTitle(): string {
  const titles = [
    "Analista de Sistemas",
    "Desenvolvedor Full Stack",
    "Gerente de Projetos",
    "Coordenador de TI",
    "Diretor Comercial",
    "Técnico de Suporte",
    "Designer UX/UI",
    "Engenheiro de Software",
    "Product Manager",
    "Consultor de Negócios",
    "Especialista em Marketing",
    "Analista de Dados",
    "Arquiteto de Soluções",
    "Scrum Master",
    "DevOps Engineer",
  ];
  return randomItem(titles);
}

export function generateCpfCnpj(): string {
  // CPF is slightly more common in public forms than CNPJ.
  return Math.random() < 0.6 ? generateCpf(true) : generateCnpj(true);
}

export function generateEmployeeCount(): string {
  const ranges = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000, 10000];
  const base = randomItem(ranges);
  return String(base + Math.floor(Math.random() * (base / 2)));
}
