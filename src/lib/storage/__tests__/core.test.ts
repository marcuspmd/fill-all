import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  STORAGE_KEYS,
  getFromStorage,
  setToStorage,
  updateStorageAtomically,
} from "../core";

// Cast necessário: chrome.storage.local.get tem múltiplos overloads
// que conflitam com mockResolvedValue — cast para any é seguro em testes.
const mockGet = chrome.storage.local.get as ReturnType<typeof vi.fn>;
const mockSet = chrome.storage.local.set as ReturnType<typeof vi.fn>;

describe("STORAGE_KEYS", () => {
  it("deve conter todas as chaves esperadas", () => {
    // Assert
    expect(STORAGE_KEYS.RULES).toBe("fill_all_rules");
    expect(STORAGE_KEYS.SAVED_FORMS).toBe("fill_all_saved_forms");
    expect(STORAGE_KEYS.SETTINGS).toBe("fill_all_settings");
    expect(STORAGE_KEYS.IGNORED_FIELDS).toBe("fill_all_ignored_fields");
    expect(STORAGE_KEYS.FIELD_CACHE).toBe("fill_all_field_cache");
  });
});

describe("getFromStorage", () => {
  beforeEach(() => {
    mockGet.mockResolvedValue({});
  });

  it("deve retornar o valor padrão quando a chave não existe", async () => {
    // Arrange
    mockGet.mockResolvedValue({});

    // Act
    const result = await getFromStorage("chave_inexistente", "padrão");

    // Assert
    expect(result).toBe("padrão");
  });

  it("deve retornar o valor armazenado quando a chave existe", async () => {
    // Arrange
    const storedValue = { nome: "Marcus" };
    mockGet.mockResolvedValue({ minha_chave: storedValue });

    // Act
    const result = await getFromStorage("minha_chave", null);

    // Assert
    expect(result).toEqual({ nome: "Marcus" });
  });

  it("deve retornar o valor padrão quando o resultado é undefined", async () => {
    // Arrange
    mockGet.mockResolvedValue({ minha_chave: undefined });

    // Act
    const result = await getFromStorage("minha_chave", 42);

    // Assert
    expect(result).toBe(42);
  });

  it("deve chamar chrome.storage.local.get com a chave correta", async () => {
    // Arrange
    mockGet.mockResolvedValue({ test_key: "val" });

    // Act
    await getFromStorage("test_key", null);

    // Assert
    expect(chrome.storage.local.get).toHaveBeenCalledWith("test_key");
  });
});

describe("setToStorage", () => {
  it("deve chamar chrome.storage.local.set com chave e valor corretos", async () => {
    // Arrange
    const key = "test_key";
    const value = { data: [1, 2, 3] };

    // Act
    await setToStorage(key, value);

    // Assert
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ [key]: value });
  });

  it("deve suportar múltiplos tipos de valor", async () => {
    // Arrange – string
    await setToStorage("k1", "string value");
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      k1: "string value",
    });

    // Arrange – number
    await setToStorage("k2", 123);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ k2: 123 });

    // Arrange – array
    await setToStorage("k3", [1, 2]);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ k3: [1, 2] });
  });
});

describe("updateStorageAtomically", () => {
  beforeEach(() => {
    mockGet.mockResolvedValue({});
    mockSet.mockResolvedValue(undefined);
  });

  it("deve aplicar o updater ao valor atual e persistir o resultado", async () => {
    // Arrange
    mockGet.mockResolvedValue({ [STORAGE_KEYS.RULES]: [1, 2, 3] });

    // Act
    const result = await updateStorageAtomically(
      STORAGE_KEYS.RULES,
      [] as number[],
      (current) => [...current, 4],
    );

    // Assert
    expect(result).toEqual([1, 2, 3, 4]);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      [STORAGE_KEYS.RULES]: [1, 2, 3, 4],
    });
  });

  it("deve usar o valor padrão quando a chave não existe", async () => {
    // Arrange
    mockGet.mockResolvedValue({});

    // Act
    const result = await updateStorageAtomically(
      STORAGE_KEYS.SETTINGS,
      { theme: "light" } as Record<string, unknown>,
      (current) => ({ ...current, theme: "dark" }),
    );

    // Assert
    expect(result).toEqual({ theme: "dark" });
  });

  it("deve executar múltiplas atualizações sequencialmente sem race conditions", async () => {
    // Arrange – simular que cada get retorna o último valor salvo
    let stored: number[] = [];
    mockGet.mockImplementation(async () => ({ [STORAGE_KEYS.RULES]: stored }));
    mockSet.mockImplementation(async (obj: Record<string, number[]>) => {
      stored = obj[STORAGE_KEYS.RULES];
    });

    // Act – disparar 3 atualizações concorrentes
    await Promise.all([
      updateStorageAtomically(STORAGE_KEYS.RULES, [] as number[], (c) => [
        ...c,
        1,
      ]),
      updateStorageAtomically(STORAGE_KEYS.RULES, [] as number[], (c) => [
        ...c,
        2,
      ]),
      updateStorageAtomically(STORAGE_KEYS.RULES, [] as number[], (c) => [
        ...c,
        3,
      ]),
    ]);

    // Assert – todas as escritas devem ter ocorrido em ordem (sem perda de dados)
    expect(stored).toHaveLength(3);
    expect(stored).toContain(1);
    expect(stored).toContain(2);
    expect(stored).toContain(3);
  });

  it("deve retornar o novo valor atualizado", async () => {
    // Arrange
    mockGet.mockResolvedValue({ [STORAGE_KEYS.IGNORED_FIELDS]: ["#old"] });

    // Act
    const result = await updateStorageAtomically(
      STORAGE_KEYS.IGNORED_FIELDS,
      [] as string[],
      () => ["#new"],
    );

    // Assert
    expect(result).toEqual(["#new"]);
  });
});
