/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FormField } from "@/types";

function buildField(): FormField {
  const element = document.createElement("input");
  element.type = "email";

  return {
    element,
    selector: "#email",
    category: "contact",
    fieldType: "email",
    label: "E-mail",
    name: "email",
    id: "email",
    placeholder: "Digite seu e-mail",
    required: false,
  };
}

describe("chrome-ai", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    Reflect.deleteProperty(globalThis as object, "LanguageModel");
  });

  it("retorna indisponível quando API não existe", async () => {
    // Arrange
    const module = await import("@/lib/ai/chrome-ai");

    // Act
    const available = await module.isAvailable();
    const session = await module.getSession();

    // Assert
    expect(available).toBe(false);
    expect(session).toBeNull();
  });

  it("considera disponibilidade como true para status downloadable", async () => {
    // Arrange
    const availability = vi.fn().mockResolvedValue("downloadable");
    const create = vi.fn();
    Reflect.set(globalThis as object, "LanguageModel", {
      availability,
      create,
    });
    const module = await import("@/lib/ai/chrome-ai");

    // Act
    const available = await module.isAvailable();

    // Assert
    expect(available).toBe(true);
  });

  it("cria e reutiliza sessão", async () => {
    // Arrange
    const fakeSession = {
      prompt: vi.fn().mockResolvedValue("  teste@exemplo.com  "),
      destroy: vi.fn(),
    };
    const availability = vi.fn().mockResolvedValue("available");
    const create = vi.fn().mockResolvedValue(fakeSession);
    Reflect.set(globalThis as object, "LanguageModel", {
      availability,
      create,
    });
    const module = await import("@/lib/ai/chrome-ai");

    // Act
    const first = await module.getSession();
    const second = await module.getSession();

    // Assert
    expect(first).toBe(fakeSession);
    expect(second).toBe(fakeSession);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("gera valor com trim e destrói sessão ativa", async () => {
    // Arrange
    const fakeSession = {
      prompt: vi.fn().mockResolvedValue("  joao@empresa.com  "),
      destroy: vi.fn(),
    };
    Reflect.set(globalThis as object, "LanguageModel", {
      availability: vi.fn().mockResolvedValue("available"),
      create: vi.fn().mockResolvedValue(fakeSession),
    });
    const module = await import("@/lib/ai/chrome-ai");

    // Act
    const value = await module.generateFieldValue(buildField());
    module.destroySession();

    // Assert
    expect(value).toBe("joao@empresa.com");
    expect(fakeSession.prompt).toHaveBeenCalledTimes(1);
    expect(fakeSession.destroy).toHaveBeenCalledTimes(1);
  });

  it("retorna string vazia em generateFieldValue quando sessão é null", async () => {
    // Arrange — LanguageModel não está disponível (sem API)
    const module = await import("@/lib/ai/chrome-ai");

    // Act
    const value = await module.generateFieldValue(buildField());

    // Assert
    expect(value).toBe("");
  });

  it("gera valor via generateFieldValueFromInput com sessão disponível", async () => {
    // Arrange
    const fakeSession = {
      prompt: vi.fn().mockResolvedValue("  teste@exemplo.com  "),
      destroy: vi.fn(),
    };
    Reflect.set(globalThis as object, "LanguageModel", {
      availability: vi.fn().mockResolvedValue("available"),
      create: vi.fn().mockResolvedValue(fakeSession),
    });
    const module = await import("@/lib/ai/chrome-ai");

    // Act
    const value = await module.generateFieldValueFromInput({
      label: "E-mail",
      name: "email",
      fieldType: "email",
      inputType: "email",
    });

    // Assert
    expect(value).toBe("teste@exemplo.com");
    expect(fakeSession.prompt).toHaveBeenCalledTimes(1);
  });

  it("retorna string vazia em generateFieldValueFromInput quando sessão é null", async () => {
    // Arrange — sem LanguageModel API
    const module = await import("@/lib/ai/chrome-ai");

    // Act
    const value = await module.generateFieldValueFromInput({
      label: "Nome",
      name: "name",
      fieldType: "full-name",
      inputType: "text",
    });

    // Assert
    expect(value).toBe("");
  });

  it("destroySession não lança erro quando sessão é null", async () => {
    // Arrange
    const module = await import("@/lib/ai/chrome-ai");

    // Act & Assert — não deve lançar
    expect(() => module.destroySession()).not.toThrow();
  });

  it("isAvailable retorna false quando api existe mas status não é available/downloadable", async () => {
    // Arrange — api existe mas status é "after-download"
    Reflect.set(globalThis as object, "LanguageModel", {
      availability: vi.fn().mockResolvedValue("after-download"),
      create: vi.fn(),
    });
    const module = await import("@/lib/ai/chrome-ai");

    // Act
    const result = await module.isAvailable();

    // Assert
    expect(result).toBe(false);
  });

  it("getSession retorna null quando availability retorna unavailable", async () => {
    // Arrange — api existe mas está unavailable
    const create = vi.fn();
    Reflect.set(globalThis as object, "LanguageModel", {
      availability: vi.fn().mockResolvedValue("unavailable"),
      create,
    });
    const module = await import("@/lib/ai/chrome-ai");

    // Act
    const result = await module.getSession();

    // Assert
    expect(result).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it("generateFieldValue com field sem label mas com name usa name no log", async () => {
    // Arrange — cobre branch label ?? name (label é undefined, name definido)
    const fakeSession = {
      prompt: vi.fn().mockResolvedValue("  gerado  "),
      destroy: vi.fn(),
    };
    Reflect.set(globalThis as object, "LanguageModel", {
      availability: vi.fn().mockResolvedValue("available"),
      create: vi.fn().mockResolvedValue(fakeSession),
    });
    const module = await import("@/lib/ai/chrome-ai");
    const element = document.createElement("input");
    const field = {
      element,
      selector: "#campo",
      category: "generic",
      fieldType: "text",
      label: undefined,
      name: "campo",
      id: "campo",
      placeholder: "",
      required: false,
    } as unknown as FormField;

    // Act
    const value = await module.generateFieldValue(field);

    // Assert
    expect(value).toBe("gerado");
  });

  it("generateFieldValue com field sem label e sem name usa selector no log", async () => {
    // Arrange — cobre branch label ?? name ?? selector (ambos undefined)
    const fakeSession = {
      prompt: vi.fn().mockResolvedValue("  anon  "),
      destroy: vi.fn(),
    };
    Reflect.set(globalThis as object, "LanguageModel", {
      availability: vi.fn().mockResolvedValue("available"),
      create: vi.fn().mockResolvedValue(fakeSession),
    });
    const module = await import("@/lib/ai/chrome-ai");
    const element = document.createElement("input");
    const field = {
      element,
      selector: "#anon",
      category: "generic",
      fieldType: "text",
      label: undefined,
      name: undefined,
      id: undefined,
      placeholder: "",
      required: false,
    } as unknown as FormField;

    // Act
    const value = await module.generateFieldValue(field);

    // Assert
    expect(value).toBe("anon");
  });

  it("generateFieldValueFromInput com label e name undefined cobre fallbacks de log", async () => {
    // Arrange — cobre input.label ?? "" e input.name ?? "" quando undefined
    const fakeSession = {
      prompt: vi.fn().mockResolvedValue("  resultado  "),
      destroy: vi.fn(),
    };
    Reflect.set(globalThis as object, "LanguageModel", {
      availability: vi.fn().mockResolvedValue("available"),
      create: vi.fn().mockResolvedValue(fakeSession),
    });
    const module = await import("@/lib/ai/chrome-ai");

    // Act
    const value = await module.generateFieldValueFromInput({
      label: undefined,
      name: undefined,
      fieldType: "text",
      inputType: "text",
    });

    // Assert
    expect(value).toBe("resultado");
  });
});
