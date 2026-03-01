/** @vitest-environment happy-dom */

import { describe, expect, it } from "vitest";
import {
  labelExtractor,
  findLabel,
  findLabelWithStrategy,
} from "@/lib/form/extractors/label-extractor";
import { buildSignals } from "@/lib/form/extractors/signals-extractor";
import { getUniqueSelector } from "@/lib/form/extractors/selector-extractor";
import type { LabelStrategy } from "@/lib/form/extractors/label-strategy.interface";

describe("extractors", () => {
  it("buildSignals normaliza e combina sinais disponíveis", () => {
    // Arrange
    const field = {
      label: "Nome do cliente",
      name: "customer_name",
      id: "user-id",
      placeholder: "Digite seu nome",
      autocomplete: "name",
    };

    // Act
    const signals = buildSignals(field);

    // Assert
    expect(signals).toBe(
      "nome do cliente customer_name user-id digite seu nome name",
    );
  });

  it("getUniqueSelector prioriza ID estável quando existe", () => {
    // Arrange
    document.body.innerHTML = '<input id="email-principal" name="email" />';
    const input = document.getElementById(
      "email-principal",
    ) as HTMLInputElement;

    // Act
    const selector = getUniqueSelector(input);

    // Assert
    expect(selector).toBe("#email-principal");
  });

  it("getUniqueSelector cria caminho com nth-of-type sem id", () => {
    // Arrange
    document.body.innerHTML = `
      <form>
        <div>
          <input name="first" />
          <input name="second" />
        </div>
      </form>
    `;
    const second = document.querySelector(
      'input[name="second"]',
    ) as HTMLElement;

    // Act
    const selector = getUniqueSelector(second);

    // Assert
    expect(selector).toContain("input:nth-of-type(2)");
  });

  it("findLabel usa estratégia customizada quando fornecida", () => {
    // Arrange
    const element = document.createElement("input");
    const customStrategy: LabelStrategy = {
      name: "title",
      find: () => ({ text: "Rótulo custom", strategy: "title" }),
    };

    // Act
    const label = findLabelWithStrategy(element, [customStrategy]);

    // Assert
    expect(label).toEqual({ text: "Rótulo custom", strategy: "title" });
  });

  it("findLabel retorna undefined quando nenhuma estratégia encontra valor", () => {
    // Arrange
    document.body.innerHTML = '<input id="sem-label" />';
    const element = document.getElementById("sem-label") as HTMLElement;

    // Act
    const label = findLabel(element);

    // Assert
    expect(label).toBeUndefined();
  });

  it("labelExtractor expõe nome fixo e delega para findLabel", () => {
    // Arrange
    document.body.innerHTML = `
      <label for="cpf">CPF</label>
      <input id="cpf" />
    `;
    const input = document.getElementById("cpf") as HTMLElement;

    // Act
    const extracted = labelExtractor.extract(input);

    // Assert
    expect(labelExtractor.name).toBe("label");
    expect(extracted).toEqual({ text: "CPF", strategy: "label[for]" });
  });
});
