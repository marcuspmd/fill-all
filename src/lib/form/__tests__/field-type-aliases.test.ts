import { describe, it, expect } from "vitest";
import {
  deriveFieldValueFromTemplate,
  FIELD_TYPE_DERIVATIONS,
} from "@/lib/form/field-type-aliases";
import type { FieldType } from "@/types";

function makeValues(entries: [FieldType, string][]): Map<FieldType, string> {
  return new Map(entries);
}

describe("deriveFieldValueFromTemplate", () => {
  describe("name group", () => {
    describe("first-name", () => {
      it("derives first-name from full-name", () => {
        const values = makeValues([["full-name", "João Silva"]]);
        expect(deriveFieldValueFromTemplate("first-name", values)).toBe("João");
      });

      it("derives first-name from name", () => {
        const values = makeValues([["name", "Maria Pereira"]]);
        expect(deriveFieldValueFromTemplate("first-name", values)).toBe(
          "Maria",
        );
      });

      it("prefers full-name over name for first-name derivation", () => {
        const values = makeValues([
          ["full-name", "João Silva"],
          ["name", "Carlos Costa"],
        ]);
        expect(deriveFieldValueFromTemplate("first-name", values)).toBe("João");
      });

      it("returns single word when full-name has only one word", () => {
        const values = makeValues([["full-name", "João"]]);
        expect(deriveFieldValueFromTemplate("first-name", values)).toBe("João");
      });

      it("returns null when no name-related type exists", () => {
        const values = makeValues([["email", "test@example.com"]]);
        expect(deriveFieldValueFromTemplate("first-name", values)).toBeNull();
      });
    });

    describe("last-name", () => {
      it("derives last-name from full-name", () => {
        const values = makeValues([["full-name", "João Da Silva"]]);
        expect(deriveFieldValueFromTemplate("last-name", values)).toBe(
          "Da Silva",
        );
      });

      it("derives last-name from name", () => {
        const values = makeValues([["name", "Ana Souza"]]);
        expect(deriveFieldValueFromTemplate("last-name", values)).toBe("Souza");
      });

      it("returns null for last-name when full-name has single word", () => {
        const values = makeValues([["full-name", "João"]]);
        expect(deriveFieldValueFromTemplate("last-name", values)).toBeNull();
      });

      it("prefers full-name over name for last-name derivation", () => {
        const values = makeValues([
          ["full-name", "João Silva"],
          ["name", "Carlos Costa"],
        ]);
        expect(deriveFieldValueFromTemplate("last-name", values)).toBe("Silva");
      });
    });

    describe("full-name", () => {
      it("derives full-name from name", () => {
        const values = makeValues([["name", "João Silva"]]);
        expect(deriveFieldValueFromTemplate("full-name", values)).toBe(
          "João Silva",
        );
      });

      it("combines first-name + last-name into full-name", () => {
        const values = makeValues([
          ["first-name", "João"],
          ["last-name", "Silva"],
        ]);
        expect(deriveFieldValueFromTemplate("full-name", values)).toBe(
          "João Silva",
        );
      });

      it("falls back to first-name alone when last-name is absent", () => {
        const values = makeValues([["first-name", "João"]]);
        expect(deriveFieldValueFromTemplate("full-name", values)).toBe("João");
      });

      it("prefers name over first-name+last-name combination", () => {
        const values = makeValues([
          ["name", "Carlos Costa"],
          ["first-name", "João"],
          ["last-name", "Silva"],
        ]);
        expect(deriveFieldValueFromTemplate("full-name", values)).toBe(
          "Carlos Costa",
        );
      });

      it("returns null when no related type exists", () => {
        const values = makeValues([["email", "test@example.com"]]);
        expect(deriveFieldValueFromTemplate("full-name", values)).toBeNull();
      });
    });

    describe("name", () => {
      it("derives name from full-name", () => {
        const values = makeValues([["full-name", "João Silva"]]);
        expect(deriveFieldValueFromTemplate("name", values)).toBe("João Silva");
      });

      it("combines first-name + last-name into name", () => {
        const values = makeValues([
          ["first-name", "Ana"],
          ["last-name", "Ferreira"],
        ]);
        expect(deriveFieldValueFromTemplate("name", values)).toBe(
          "Ana Ferreira",
        );
      });

      it("falls back to first-name alone", () => {
        const values = makeValues([["first-name", "Ana"]]);
        expect(deriveFieldValueFromTemplate("name", values)).toBe("Ana");
      });
    });
  });

  describe("phone group", () => {
    it("derives phone from mobile", () => {
      const values = makeValues([["mobile", "11999998888"]]);
      expect(deriveFieldValueFromTemplate("phone", values)).toBe("11999998888");
    });

    it("derives phone from whatsapp when mobile is absent", () => {
      const values = makeValues([["whatsapp", "11977776666"]]);
      expect(deriveFieldValueFromTemplate("phone", values)).toBe("11977776666");
    });

    it("derives mobile from phone", () => {
      const values = makeValues([["phone", "1133334444"]]);
      expect(deriveFieldValueFromTemplate("mobile", values)).toBe("1133334444");
    });

    it("derives mobile from whatsapp when phone is absent", () => {
      const values = makeValues([["whatsapp", "11977776666"]]);
      expect(deriveFieldValueFromTemplate("mobile", values)).toBe(
        "11977776666",
      );
    });

    it("derives whatsapp from mobile", () => {
      const values = makeValues([["mobile", "11999998888"]]);
      expect(deriveFieldValueFromTemplate("whatsapp", values)).toBe(
        "11999998888",
      );
    });

    it("returns null for phone when no related type exists", () => {
      const values = makeValues([["email", "test@example.com"]]);
      expect(deriveFieldValueFromTemplate("phone", values)).toBeNull();
    });
  });

  describe("authentication group", () => {
    it("derives confirm-password from password", () => {
      const values = makeValues([["password", "Secret123!"]]);
      expect(deriveFieldValueFromTemplate("confirm-password", values)).toBe(
        "Secret123!",
      );
    });

    it("returns null for confirm-password when password is absent", () => {
      const values = makeValues([["email", "test@example.com"]]);
      expect(
        deriveFieldValueFromTemplate("confirm-password", values),
      ).toBeNull();
    });
  });

  describe("postal code group", () => {
    it("derives zip-code from cep", () => {
      const values = makeValues([["cep", "01310-100"]]);
      expect(deriveFieldValueFromTemplate("zip-code", values)).toBe(
        "01310-100",
      );
    });

    it("derives cep from zip-code", () => {
      const values = makeValues([["zip-code", "01310-100"]]);
      expect(deriveFieldValueFromTemplate("cep", values)).toBe("01310-100");
    });
  });

  describe("financial group", () => {
    it("derives price from money", () => {
      const values = makeValues([["money", "99.90"]]);
      expect(deriveFieldValueFromTemplate("price", values)).toBe("99.90");
    });

    it("derives price from amount when money is absent", () => {
      const values = makeValues([["amount", "150.00"]]);
      expect(deriveFieldValueFromTemplate("price", values)).toBe("150.00");
    });

    it("derives money from price", () => {
      const values = makeValues([["price", "49.99"]]);
      expect(deriveFieldValueFromTemplate("money", values)).toBe("49.99");
    });

    it("derives amount from money", () => {
      const values = makeValues([["money", "250.00"]]);
      expect(deriveFieldValueFromTemplate("amount", values)).toBe("250.00");
    });

    it("derives amount from price when money is absent", () => {
      const values = makeValues([["price", "199.00"]]);
      expect(deriveFieldValueFromTemplate("amount", values)).toBe("199.00");
    });
  });

  describe("date variants group", () => {
    it("derives birth-date from date", () => {
      const values = makeValues([["date", "1990-01-01"]]);
      expect(deriveFieldValueFromTemplate("birth-date", values)).toBe(
        "1990-01-01",
      );
    });

    it("derives start-date from date", () => {
      const values = makeValues([["date", "2025-03-01"]]);
      expect(deriveFieldValueFromTemplate("start-date", values)).toBe(
        "2025-03-01",
      );
    });

    it("derives end-date from date", () => {
      const values = makeValues([["date", "2025-12-31"]]);
      expect(deriveFieldValueFromTemplate("end-date", values)).toBe(
        "2025-12-31",
      );
    });

    it("derives due-date from date", () => {
      const values = makeValues([["date", "2025-06-30"]]);
      expect(deriveFieldValueFromTemplate("due-date", values)).toBe(
        "2025-06-30",
      );
    });

    it("returns null for date variants when date is absent", () => {
      const values = makeValues([["email", "test@example.com"]]);
      expect(deriveFieldValueFromTemplate("birth-date", values)).toBeNull();
    });
  });

  describe("product group", () => {
    it("derives product-name from product", () => {
      const values = makeValues([["product", "Camiseta Azul"]]);
      expect(deriveFieldValueFromTemplate("product-name", values)).toBe(
        "Camiseta Azul",
      );
    });

    it("derives product from product-name", () => {
      const values = makeValues([["product-name", "Notebook Pro"]]);
      expect(deriveFieldValueFromTemplate("product", values)).toBe(
        "Notebook Pro",
      );
    });
  });

  describe("company group", () => {
    it("derives supplier from company", () => {
      const values = makeValues([["company", "ACME Ltda"]]);
      expect(deriveFieldValueFromTemplate("supplier", values)).toBe(
        "ACME Ltda",
      );
    });

    it("derives company from supplier", () => {
      const values = makeValues([["supplier", "Distribuidora XYZ"]]);
      expect(deriveFieldValueFromTemplate("company", values)).toBe(
        "Distribuidora XYZ",
      );
    });
  });

  describe("document group", () => {
    it("derives cpf-cnpj from cpf", () => {
      const values = makeValues([["cpf", "123.456.789-09"]]);
      expect(deriveFieldValueFromTemplate("cpf-cnpj", values)).toBe(
        "123.456.789-09",
      );
    });

    it("derives cpf-cnpj from cnpj when cpf is absent", () => {
      const values = makeValues([["cnpj", "12.345.678/0001-95"]]);
      expect(deriveFieldValueFromTemplate("cpf-cnpj", values)).toBe(
        "12.345.678/0001-95",
      );
    });

    it("prefers cpf over cnpj for cpf-cnpj derivation", () => {
      const values = makeValues([
        ["cpf", "123.456.789-09"],
        ["cnpj", "12.345.678/0001-95"],
      ]);
      expect(deriveFieldValueFromTemplate("cpf-cnpj", values)).toBe(
        "123.456.789-09",
      );
    });
  });

  describe("no derivation available", () => {
    it("returns null for types without any derivation rules (email)", () => {
      const values = makeValues([["name", "João Silva"]]);
      expect(deriveFieldValueFromTemplate("email", values)).toBeNull();
    });

    it("returns null for types without any derivation rules (cpf)", () => {
      const values = makeValues([["name", "João Silva"]]);
      expect(deriveFieldValueFromTemplate("cpf", values)).toBeNull();
    });

    it("returns null when map is empty", () => {
      expect(deriveFieldValueFromTemplate("full-name", new Map())).toBeNull();
    });

    it("returns null when map has unrelated types only", () => {
      const values = makeValues([
        ["email", "test@example.com"],
        ["cpf", "123.456.789-09"],
      ]);
      expect(deriveFieldValueFromTemplate("first-name", values)).toBeNull();
    });
  });

  describe("FIELD_TYPE_DERIVATIONS completeness", () => {
    it("exports a non-empty derivations map", () => {
      expect(Object.keys(FIELD_TYPE_DERIVATIONS).length).toBeGreaterThan(0);
    });

    it("every derivation function returns a string or null", () => {
      const values = makeValues([
        ["name", "Test Name"],
        ["full-name", "Test Full Name"],
        ["first-name", "Test"],
        ["last-name", "Name"],
        ["phone", "11999998888"],
        ["mobile", "11999998888"],
        ["whatsapp", "11999998888"],
        ["password", "pass123"],
        ["cep", "01310-100"],
        ["zip-code", "01310-100"],
        ["money", "100.00"],
        ["price", "100.00"],
        ["amount", "100.00"],
        ["date", "2025-01-01"],
        ["product", "Product X"],
        ["product-name", "Product X"],
        ["company", "Company Y"],
        ["supplier", "Supplier Z"],
        ["cpf", "123.456.789-09"],
        ["cnpj", "12.345.678/0001-95"],
      ]);

      for (const [type, fn] of Object.entries(FIELD_TYPE_DERIVATIONS)) {
        const result = fn!(values);
        expect(
          result === null || typeof result === "string",
          `derivation for "${type}" should return string or null`,
        ).toBe(true);
      }
    });
  });
});
