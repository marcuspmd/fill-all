# Geradores de Dados — Fill All

Documentação completa do sistema de geradores de dados brasileiros válidos.

---

## Visão Geral

Os geradores produzem dados sintéticos para preenchimento de formulários. Todos seguem princípios rígidos:

- **Funções puras** — sem side effects
- **Síncronos** — retorno imediato (`() → string`)
- **Dados válidos** — CPFs, CNPJs e documentos com dígitos verificadores corretos
- **Localização BR** — nomes, endereços, telefones e formatos brasileiros

---

## Registry Central

O arquivo `src/lib/generators/index.ts` contém o registry que mapeia `FieldType` → `GeneratorFn`.

```
FIELD_TYPE_DEFINITIONS → GENERATOR_FACTORIES → generatorMap
         │                       │                    │
    Define tipo +           Factory que           Map dinâmico
    generator key +         recebe params         consultado por
    params opcionais        e retorna string      generate(type)
```

### Como Funciona

1. `FIELD_TYPE_DEFINITIONS` define cada `FieldType` com um `generator` key e `params` opcionais
2. `GENERATOR_FACTORIES` mapeia cada key para uma função factory
3. `buildGeneratorMap()` combina as duas para criar o map final
4. `generate(fieldType)` consulta o map e executa a factory

```typescript
// Entry point principal
generate("cpf")         // → "123.456.789-09"
generate("email")       // → "joao.silva@email.com"
generate("birth-date")  // → "1985-03-14"
```

---

## Geradores por Categoria

### Documentos

| Função | Arquivo | Saída | Validação |
|--------|---------|-------|-----------|
| `generateCpf(formatted?)` | `cpf.ts` | `123.456.789-09` | Dígitos verificadores válidos |
| `generateCnpj(formatted?)` | `cnpj.ts` | `12.345.678/0001-95` | Dígitos verificadores válidos |
| `generateCpfCnpj()` | `misc.ts` | CPF ou CNPJ aleatório | Válido |
| `generateRg(formatted?)` | `rg.ts` | `12.345.678-9` | Formato válido |
| `generateCnh()` | `rg.ts` | `12345678901` | 11 dígitos |
| `generatePis()` | `rg.ts` | `123.45678.90-1` | Dígito verificador válido |
| `generatePassport()` | `misc.ts` | `AB123456` | Formato padrão |
| `generateNationalId()` | `misc.ts` | Documento de identidade | — |
| `generateTaxId()` | `misc.ts` | CPF ou CNPJ | Válido |

### Dados Pessoais

| Função | Arquivo | Saída |
|--------|---------|-------|
| `generateFullName()` | `name.ts` | `João Carlos Silva` |
| `generateFirstName()` | `name.ts` | `Maria` |
| `generateLastName()` | `name.ts` | `Oliveira` |
| `generateCompanyName()` | `name.ts` | `TechSol Soluções LTDA` |

### Contato

| Função | Arquivo | Saída |
|--------|---------|-------|
| `generateEmail()` | `email.ts` | `joao.silva@email.com` |
| `generatePhone(mobile?, formatted?)` | `phone.ts` | `(11) 98765-4321` |

### Endereço

| Função | Arquivo | Saída |
|--------|---------|-------|
| `generateFullAddress()` | `address.ts` | Endereço completo com CEP |
| `generateStreet(onlyLetters?)` | `address.ts` | `Rua das Flores` |
| `generateHouseNumber()` | `address.ts` | `1234` |
| `generateComplement(onlyLetters?)` | `address.ts` | `Apto 501` |
| `generateNeighborhood(onlyLetters?)` | `address.ts` | `Centro` |
| `generateCity()` | `address.ts` | `São Paulo` |
| `generateState()` | `address.ts` | `SP` |
| `generateCountry()` | `address.ts` | `Brasil` |
| `generateCep(formatted?)` | `address.ts` | `01234-567` |

### Datas

| Função | Arquivo | Saída |
|--------|---------|-------|
| `generateDate(format?)` | `date.ts` | `2024-03-14` (ISO) |
| `generateBirthDate(minAge?, maxAge?)` | `date.ts` | `1985-07-22` |
| `generateFutureDate(maxDays?)` | `date.ts` | `2025-06-15` |

### Financeiro

| Função | Arquivo | Saída |
|--------|---------|-------|
| `generateCreditCardNumber()` | `finance.ts` | `4532 1234 5678 9012` |
| `generateCreditCardExpiration()` | `finance.ts` | `12/28` |
| `generateCreditCardCvv()` | `finance.ts` | `123` |
| `generatePixKey()` | `finance.ts` | Chave PIX (email, phone ou random) |
| `generateMoney(min?, max?)` | `misc.ts` | `1.234,56` |

### Autenticação

| Função | Arquivo | Saída |
|--------|---------|-------|
| `generateUsername()` | `misc.ts` | `joao_silva_42` |
| `generatePassword(length?)` | `misc.ts` | `aB3$xK9!mP2@` |
| `generateOtp(length?)` | `misc.ts` | `847291` |
| `generateVerificationCode(length?)` | `misc.ts` | `583017` |

### Genéricos

| Função | Arquivo | Saída |
|--------|---------|-------|
| `generateText(words?)` | `misc.ts` | Texto lorem realista |
| `generateDescription()` | `misc.ts` | Parágrafo de descrição |
| `generateNotes()` | `misc.ts` | Texto de notas |
| `generateWebsite()` | `misc.ts` | `https://www.exemplo.com.br` |
| `generateProductName()` | `misc.ts` | Nome de produto |
| `generateSku()` | `misc.ts` | `SKU-A1B2C3` |
| `generateCoupon()` | `misc.ts` | `PROMO2024` |
| `generateJobTitle()` | `misc.ts` | `Desenvolvedor Senior` |
| `generateDepartment()` | `misc.ts` | `Tecnologia` |

### Gerador Adaptativo

`generateAdaptive()` (`adaptive.ts`) respeita constraints do campo HTML:

- `minlength` / `maxlength`
- `min` / `max` (numéricos)
- `pattern` (regex)
- Trunca ou ajusta o valor gerado para caber nas restrições

---

## Como Criar um Novo Gerador

### 1. Crie o Arquivo

```typescript
// src/lib/generators/titulo-eleitor.ts

/**
 * Generates a valid Brazilian voter registration number (Título de Eleitor).
 */
export function generateTituloEleitor(formatted = true): string {
  // 1. Gere os 8 primeiros dígitos aleatórios
  const sequencial = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");

  // 2. Gere código do estado (01-28)
  const estadoCode = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");

  // 3. Calcule dígitos verificadores
  const base = sequencial + estadoCode;
  const d1 = calculateDigit1(base);
  const d2 = calculateDigit2(estadoCode, d1);

  const raw = base + d1 + d2;
  return formatted ? formatTituloEleitor(raw) : raw;
}
```

### 2. Registre a Factory

Em `src/lib/generators/index.ts`, adicione ao `GENERATOR_FACTORIES`:

```typescript
const GENERATOR_FACTORIES: Record<string, GeneratorFactory> = {
  // ... existentes ...
  "titulo-eleitor": (p) => generateTituloEleitor(p?.formatted !== false),
};
```

### 3. Adicione o FieldType

Em `src/types/field-type-definitions.ts`, adicione a definição:

```typescript
{
  type: "titulo-eleitor",
  generator: "titulo-eleitor",
  label: "Título de Eleitor",
  category: "document",
}
```

### 4. Exporte

No barrel `src/lib/generators/index.ts`, adicione o re-export:

```typescript
export { generateTituloEleitor } from "./titulo-eleitor";
```

---

## Princípios

1. **Dados brasileiros** — Formatos, DDDs, estados e nomes brasileiros
2. **Validação real** — CPFs e CNPJs passam em validadores oficiais
3. **Determinismo controlado** — Uso de `Math.random()` (sem seed fixo)
4. **Sem dependências externas** — Apenas lógica pura (exceto `@faker-js/faker` em alguns módulos)
5. **Formatação opcional** — Parâmetro `formatted` para retornar com ou sem máscara
