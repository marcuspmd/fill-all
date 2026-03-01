import { describe, it, expect } from "vitest";
import {
  E2E_GENERATORS,
  getE2EGenerator,
  generateE2EScript,
} from "@/lib/e2e-export/e2e-generator-registry";
import type {
  CapturedAction,
  E2EGenerateOptions,
} from "@/lib/e2e-export/e2e-export.types";

describe("E2E Generator Registry", () => {
  describe("E2E_GENERATORS", () => {
    it("contains all three generators", () => {
      expect(E2E_GENERATORS).toHaveLength(3);
      const names = E2E_GENERATORS.map((g) => g.name);
      expect(names).toEqual(["playwright", "cypress", "pest"]);
    });
  });

  describe("getE2EGenerator", () => {
    it("returns playwright generator by name", () => {
      const gen = getE2EGenerator("playwright");
      expect(gen).not.toBeNull();
      expect(gen!.name).toBe("playwright");
    });

    it("returns cypress generator by name", () => {
      const gen = getE2EGenerator("cypress");
      expect(gen).not.toBeNull();
      expect(gen!.name).toBe("cypress");
    });

    it("returns pest generator by name", () => {
      const gen = getE2EGenerator("pest");
      expect(gen).not.toBeNull();
      expect(gen!.name).toBe("pest");
    });

    it("returns null for unknown framework", () => {
      const gen = getE2EGenerator("unknown" as never);
      expect(gen).toBeNull();
    });
  });

  describe("generateE2EScript", () => {
    const actions: CapturedAction[] = [
      { selector: "#name", value: "Test", actionType: "fill" },
    ];
    const opts: E2EGenerateOptions = { pageUrl: "https://x.com" };

    it("generates script for playwright", () => {
      const script = generateE2EScript("playwright", actions, opts);
      expect(script).not.toBeNull();
      expect(script).toContain("page.locator");
    });

    it("generates script for cypress", () => {
      const script = generateE2EScript("cypress", actions, opts);
      expect(script).not.toBeNull();
      expect(script).toContain("cy.get");
    });

    it("generates script for pest", () => {
      const script = generateE2EScript("pest", actions, opts);
      expect(script).not.toBeNull();
      expect(script).toContain("$browser");
    });

    it("returns null for unknown framework", () => {
      const script = generateE2EScript("unknown" as never, actions);
      expect(script).toBeNull();
    });

    it("passes options through to generator", () => {
      const optsWithAssertions: E2EGenerateOptions = {
        pageUrl: "https://x.com",
        includeAssertions: true,
        assertions: [{ type: "visible-text", expected: "Done" }],
      };
      const script = generateE2EScript(
        "playwright",
        actions,
        optsWithAssertions,
      );
      expect(script).toContain("Assertions");
      expect(script).toContain("Done");
    });
  });
});
