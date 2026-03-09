// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";

// Mock panel-state to avoid chrome.devtools access at module load time
vi.mock("../panel-state", () => ({
  panelState: {
    inspectedTabId: 1,
    activeTab: "actions",
    theme: "dark",
    detectedFields: [],
    ignoredSelectors: new Set(),
  },
}));

import { escapeHtml, escapeAttr } from "../panel-utils";

describe("panel-utils", () => {
  describe("escapeHtml", () => {
    it("should escape special HTML characters", () => {
      const input = "<div>Hello & 'World'</div>";
      const expected = "&lt;div&gt;Hello &amp; 'World'&lt;/div&gt;";
      expect(escapeHtml(input)).toBe(expected);
    });

    it("should return the same string if no special characters are present", () => {
      const input = "Hello World";
      expect(escapeHtml(input)).toBe(input);
    });
  });

  describe("escapeAttr", () => {
    it("should escape special attribute characters", () => {
      const input = "a&b\"c'd<e>f";
      const expected = "a&amp;b&quot;c&#39;d&lt;e&gt;f";
      expect(escapeAttr(input)).toBe(expected);
    });

    it("should return the same string if no special characters are present", () => {
      const input = "Hello World";
      expect(escapeAttr(input)).toBe(input);
    });

    it("should escape all occurrences of special characters", () => {
      const input = "&&\"\"''<<>>";
      const expected = "&amp;&amp;&quot;&quot;&#39;&#39;&lt;&lt;&gt;&gt;";
      expect(escapeAttr(input)).toBe(expected);
    });
  });
});
