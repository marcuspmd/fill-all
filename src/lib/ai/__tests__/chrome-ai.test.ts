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
});
