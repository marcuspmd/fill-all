import { describe, expect, it } from "vitest";
import {
  FORM_CONTEXT_MAX_FIELDS,
  formContextGeneratorPrompt,
} from "@/lib/ai/prompts/form-context-generator.prompt";
import type { FormContextFieldInput } from "@/lib/ai/prompts/form-context-generator.prompt";

function makeField(
  index: number,
  overrides: Partial<FormContextFieldInput> = {},
): FormContextFieldInput {
  return {
    index,
    label: `Campo ${index}`,
    fieldType: "text",
    ...overrides,
  };
}

describe("formContextGeneratorPrompt", () => {
  describe("buildPrompt", () => {
    it("inclui campo básico como linha formatada", () => {
      // Arrange
      const input = [makeField(0, { label: "Nome", fieldType: "full-name" })];

      // Act
      const prompt = formContextGeneratorPrompt.buildPrompt(input);

      // Assert
      expect(prompt).toContain("[0] Nome (full-name)");
      expect(prompt).toContain("JSON:");
    });

    it("usa inputType como label quando label está vazio", () => {
      // Arrange
      const input = [
        makeField(0, {
          label: "",
          inputType: "email",
          fieldType: "email",
        }),
      ];

      // Act
      const prompt = formContextGeneratorPrompt.buildPrompt(input);

      // Assert
      expect(prompt).toContain("[0] email (email)");
    });

    it("usa inputType como label quando label é apenas espaços", () => {
      // Arrange
      const input = [
        makeField(0, {
          label: "   ",
          inputType: "tel",
          fieldType: "phone",
        }),
      ];

      // Act
      const prompt = formContextGeneratorPrompt.buildPrompt(input);

      // Assert
      expect(prompt).toContain("[0] tel (phone)");
    });

    it("usa 'field' como fallback quando inputType também está ausente", () => {
      // Arrange
      const input = [
        makeField(0, {
          label: "",
          inputType: undefined,
          fieldType: "text",
        }),
      ];

      // Act
      const prompt = formContextGeneratorPrompt.buildPrompt(input);

      // Assert
      expect(prompt).toContain("[0] field (text)");
    });

    it("inclui opções de select separadas por pipe", () => {
      // Arrange
      const input = [
        makeField(0, {
          label: "Estado",
          fieldType: "state",
          options: ["SP", "RJ", "MG"],
        }),
      ];

      // Act
      const prompt = formContextGeneratorPrompt.buildPrompt(input);

      // Assert
      expect(prompt).toContain("[0] Estado (state): SP|RJ|MG");
    });

    it("filtra opções de select que são apenas espaços", () => {
      // Arrange
      const input = [
        makeField(0, {
          label: "Tipo",
          fieldType: "state",
          options: ["SP", "  ", "RJ"],
        }),
      ];

      // Act
      const prompt = formContextGeneratorPrompt.buildPrompt(input);

      // Assert
      expect(prompt).toContain("[0] Tipo (state): SP|RJ");
    });

    it("não adiciona opções quando array de opções está vazio", () => {
      // Arrange
      const input = [
        makeField(0, {
          label: "Campo",
          fieldType: "text",
          options: [],
        }),
      ];

      // Act
      const prompt = formContextGeneratorPrompt.buildPrompt(input);

      // Assert
      expect(prompt).toContain("[0] Campo (text)");
      expect(prompt).not.toContain("[0] Campo (text):");
    });

    it("não adiciona opções quando todas são apenas espaços (resultado filtrado vazio)", () => {
      // Arrange
      const input = [
        makeField(0, {
          label: "Campo",
          fieldType: "text",
          options: ["  ", "   "],
        }),
      ];

      // Act
      const prompt = formContextGeneratorPrompt.buildPrompt(input);

      // Assert
      expect(prompt).toContain("[0] Campo (text)");
      expect(prompt).not.toMatch(/\[0\] Campo \(text\):/);
    });

    it("trunca opções para MAX_OPTIONS_PER_FIELD (6)", () => {
      // Arrange
      const input = [
        makeField(0, {
          label: "Opção",
          fieldType: "state",
          options: ["A", "B", "C", "D", "E", "F", "G", "H"],
        }),
      ];

      // Act
      const prompt = formContextGeneratorPrompt.buildPrompt(input);

      // Assert
      expect(prompt).toContain("A|B|C|D|E|F");
      expect(prompt).not.toContain("|G");
    });

    it("trunca campos ao máximo de FORM_CONTEXT_MAX_FIELDS (30)", () => {
      // Arrange
      const input = Array.from({ length: 40 }, (_, i) => makeField(i));

      // Act
      const prompt = formContextGeneratorPrompt.buildPrompt(input);

      // Assert
      expect(prompt).toContain(`[${FORM_CONTEXT_MAX_FIELDS - 1}]`);
      expect(prompt).not.toContain(`[${FORM_CONTEXT_MAX_FIELDS}]`);
    });

    it("injeta bloco de contexto de usuário quando fornecido", () => {
      // Arrange
      const input = [makeField(0)];
      const userContext = "Use data from São Paulo";

      // Act
      const prompt = formContextGeneratorPrompt.buildPrompt(input, userContext);

      // Assert
      expect(prompt).toContain("ADDITIONAL CONTEXT PROVIDED BY THE USER");
      expect(prompt).toContain("Use data from São Paulo");
    });

    it("não injeta bloco de contexto quando userContext está vazio", () => {
      // Arrange
      const input = [makeField(0)];

      // Act
      const prompt = formContextGeneratorPrompt.buildPrompt(input, "");

      // Assert
      expect(prompt).not.toContain("ADDITIONAL CONTEXT PROVIDED BY THE USER");
    });

    it("não injeta bloco de contexto quando userContext é apenas espaços", () => {
      // Arrange
      const input = [makeField(0)];

      // Act
      const prompt = formContextGeneratorPrompt.buildPrompt(input, "   ");

      // Assert
      expect(prompt).not.toContain("ADDITIONAL CONTEXT PROVIDED BY THE USER");
    });

    it("gera múltiplos campos em ordem", () => {
      // Arrange
      const input = [
        makeField(0, { label: "Nome", fieldType: "full-name" }),
        makeField(1, { label: "Email", fieldType: "email" }),
        makeField(2, { label: "CPF", fieldType: "cpf" }),
      ];

      // Act
      const prompt = formContextGeneratorPrompt.buildPrompt(input);

      // Assert
      const idx0 = prompt.indexOf("[0]");
      const idx1 = prompt.indexOf("[1]");
      const idx2 = prompt.indexOf("[2]");
      expect(idx0).toBeLessThan(idx1);
      expect(idx1).toBeLessThan(idx2);
    });
  });

  describe("parseResponse", () => {
    it("parseia JSON válido e retorna mapa de valores", () => {
      // Arrange
      const raw =
        '{"0":"Ana Silva","1":"ana@example.com","2":"529.982.247-25"}';

      // Act
      const result = formContextGeneratorPrompt.parseResponse(raw);

      // Assert
      expect(result).toEqual({
        "0": "Ana Silva",
        "1": "ana@example.com",
        "2": "529.982.247-25",
      });
    });

    it("retorna null para string vazia", () => {
      // Act
      const result = formContextGeneratorPrompt.parseResponse("");

      // Assert
      expect(result).toBeNull();
    });

    it("retorna null para string apenas com espaços", () => {
      // Act
      const result = formContextGeneratorPrompt.parseResponse("   ");

      // Assert
      expect(result).toBeNull();
    });

    it("retorna null quando não há JSON na resposta", () => {
      // Act
      const result = formContextGeneratorPrompt.parseResponse(
        "Aqui está sua resposta em texto simples.",
      );

      // Assert
      expect(result).toBeNull();
    });

    it("retorna null para JSON inválido", () => {
      // Act
      const result = formContextGeneratorPrompt.parseResponse("{invalid json}");

      // Assert
      expect(result).toBeNull();
    });

    it("retorna null quando JSON é um array (não objeto)", () => {
      // Act
      const result = formContextGeneratorPrompt.parseResponse(
        '["valor1","valor2"]',
      );

      // Assert
      expect(result).toBeNull();
    });

    it("retorna null quando JSON é null literal", () => {
      // Act
      const result = formContextGeneratorPrompt.parseResponse("null");

      // Assert
      expect(result).toBeNull();
    });

    it("retorna null quando objeto JSON está vazio", () => {
      // Act
      const result = formContextGeneratorPrompt.parseResponse("{}");

      // Assert
      expect(result).toBeNull();
    });

    it("converte valores não-string para string", () => {
      // Arrange
      const raw = '{"0":42,"1":true,"2":null}';

      // Act
      const result = formContextGeneratorPrompt.parseResponse(raw);

      // Assert
      expect(result).toEqual({
        "0": "42",
        "1": "true",
        "2": "",
      });
    });

    it("extrai JSON embutido em prosa do modelo", () => {
      // Arrange
      const raw =
        'Here are the values: {"0":"Maria","1":"maria@test.com"} - hope this helps!';

      // Act
      const result = formContextGeneratorPrompt.parseResponse(raw);

      // Assert
      expect(result).toEqual({ "0": "Maria", "1": "maria@test.com" });
    });
  });
});
