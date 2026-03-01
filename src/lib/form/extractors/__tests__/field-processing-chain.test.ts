/** @vitest-environment happy-dom */

import { describe, expect, it } from "vitest";
import { FieldProcessingChain } from "@/lib/form/extractors/field-processing-chain";
import type { FormField } from "@/types";
import { FieldClassifier } from "@/lib/form/form-detector";

function createField(name = "email"): FormField {
  const input = document.createElement("input");
  input.name = name;

  return {
    element: input,
    selector: `input[name="${name}"]`,
    category: "unknown",
    fieldType: "unknown",
    required: false,
    name,
  };
}

function createClassifier(
  name: FieldClassifier["name"],
  result: Partial<{
    type: FormField["fieldType"];
    confidence: number;
    method: FormField["detectionMethod"];
  }>,
): FieldClassifier {
  return {
    name,
    detect: () => ({
      type: result.type ?? "unknown",
      confidence: result.confidence ?? 0,
      method: result.method ?? "html-fallback",
    }),
  };
}

describe("FieldProcessingChain", () => {
  it("runAsync classifica campos em lote", async () => {
    // Arrange
    const chain = new FieldProcessingChain().classify(
      createClassifier("keyword", {
        type: "email",
        confidence: 0.9,
        method: "keyword",
      }),
    );
    const fields = [createField("email")];

    // Act
    const result = await chain.runAsync(fields);

    // Assert
    expect(result[0].fieldType).toBe("email");
    expect(result[0].detectionMethod).toBe("keyword");
    expect(result[0].detectionConfidence).toBe(0.9);
  });

  it("runAsync usa detectAsync quando disponível", async () => {
    // Arrange
    const asyncClassifier: FieldClassifier = {
      name: "chrome-ai",
      detect: () => null,
      detectAsync: async () => ({
        type: "name",
        confidence: 0.8,
        method: "chrome-ai",
      }),
    };
    const chain = new FieldProcessingChain().classify(asyncClassifier);
    const fields = [createField("fullName")];

    // Act
    const result = await chain.runAsync(fields);

    // Assert
    expect(result[0].fieldType).toBe("name");
    expect(result[0].detectionMethod).toBe("chrome-ai");
    expect(result[0].detectionConfidence).toBe(0.8);
  });

  it("stream emite cada campo após classificação", async () => {
    // Arrange
    const chain = new FieldProcessingChain().classify(
      createClassifier("html-type", {
        type: "email",
        confidence: 1,
        method: "html-type",
      }),
    );
    const fields = [createField("email"), createField("alt-email")];

    // Act
    const emitted: FormField[] = [];
    for await (const classified of chain.stream(fields)) {
      emitted.push(classified);
    }

    // Assert
    expect(emitted).toHaveLength(2);
    expect(emitted[0].fieldType).toBe("email");
    expect(emitted[1].detectionMethod).toBe("html-type");
  });

  it("classify substitui a lista de classificadores em chamadas subsequentes", async () => {
    // Arrange
    const chain = new FieldProcessingChain()
      .classify(
        createClassifier("keyword", {
          type: "email",
          confidence: 0.7,
          method: "keyword",
        }),
      )
      .classify(
        createClassifier("html-fallback", {
          type: "text",
          confidence: 0.2,
          method: "html-fallback",
        }),
      );

    // Act
    const [classified] = await chain.runAsync([createField("generic")]);

    // Assert
    expect(classified.fieldType).toBe("text");
    expect(classified.detectionMethod).toBe("html-fallback");
  });
});
