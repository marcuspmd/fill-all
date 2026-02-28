// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";

import {
  ICON_ID,
  MODAL_ID,
  RULE_POPUP_ID,
  injectStyles,
  removeStyles,
} from "../field-icon-styles";

describe("field-icon-styles", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  describe("constants", () => {
    it("ICON_ID is correct", () => {
      expect(ICON_ID).toBe("fill-all-field-icon");
    });

    it("RULE_POPUP_ID is correct", () => {
      expect(RULE_POPUP_ID).toBe("fill-all-rule-popup");
    });

    it("MODAL_ID is correct", () => {
      expect(MODAL_ID).toBe("fill-all-inspect-modal");
    });
  });

  describe("injectStyles", () => {
    it("injects a style element into the document head", () => {
      expect(document.getElementById("fill-all-field-icon-styles")).toBeNull();

      injectStyles();

      expect(
        document.getElementById("fill-all-field-icon-styles"),
      ).not.toBeNull();
    });

    it("does not inject duplicate style when called multiple times", () => {
      injectStyles();
      injectStyles();
      injectStyles();

      const all = document.querySelectorAll("#fill-all-field-icon-styles");
      expect(all).toHaveLength(1);
    });

    it("injected style contains the ICON_ID selector", () => {
      injectStyles();

      const style = document.getElementById("fill-all-field-icon-styles");
      expect(style?.textContent).toContain(ICON_ID);
    });
  });

  describe("removeStyles", () => {
    it("removes the injected style element", () => {
      injectStyles();
      expect(
        document.getElementById("fill-all-field-icon-styles"),
      ).not.toBeNull();

      removeStyles();

      expect(document.getElementById("fill-all-field-icon-styles")).toBeNull();
    });

    it("does not throw when styles were not injected", () => {
      expect(() => removeStyles()).not.toThrow();
    });
  });
});
