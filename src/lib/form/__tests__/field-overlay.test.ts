// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { clearAllBadges, showDetectionBadge } from "../field-overlay";

const BADGE_ATTR = "data-fill-all-badge";

describe("field-overlay", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("showDetectionBadge", () => {
    it("appends a badge element to the document body", () => {
      const el = document.createElement("input");
      document.body.appendChild(el);

      // Mock getBoundingClientRect to return non-zero size
      vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
        width: 200,
        height: 30,
        top: 100,
        left: 50,
        right: 250,
        bottom: 130,
        x: 50,
        y: 100,
        toJSON: () => ({}),
      });

      showDetectionBadge(el, "email");

      const badge = document.querySelector(`[${BADGE_ATTR}]`);
      expect(badge).not.toBeNull();
      expect(badge?.textContent).toContain("email");
    });

    it("includes method icon when method is provided", () => {
      const el = document.createElement("input");
      document.body.appendChild(el);

      vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
        width: 200,
        height: 30,
        top: 100,
        left: 50,
        right: 250,
        bottom: 130,
        x: 50,
        y: 100,
        toJSON: () => ({}),
      });

      showDetectionBadge(el, "cpf", "keyword");

      const badge = document.querySelector(`[${BADGE_ATTR}]`);
      expect(badge?.textContent).toContain("🔑");
      expect(badge?.textContent).toContain("cpf");
    });

    it("does not create badge when element has zero dimensions", () => {
      const el = document.createElement("input");
      document.body.appendChild(el);

      vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      showDetectionBadge(el, "email");

      const badge = document.querySelector(`[${BADGE_ATTR}]`);
      expect(badge).toBeNull();
    });

    it("injects overlay styles into document head", () => {
      const el = document.createElement("input");
      document.body.appendChild(el);

      vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
        width: 100,
        height: 20,
        top: 50,
        left: 10,
        right: 110,
        bottom: 70,
        x: 10,
        y: 50,
        toJSON: () => ({}),
      });

      showDetectionBadge(el, "text");

      expect(document.getElementById("fill-all-overlay-styles")).not.toBeNull();
    });

    it("removes badge after lifetime expires", () => {
      const el = document.createElement("input");
      document.body.appendChild(el);

      vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
        width: 100,
        height: 20,
        top: 50,
        left: 10,
        right: 110,
        bottom: 70,
        x: 10,
        y: 50,
        toJSON: () => ({}),
      });

      showDetectionBadge(el, "text");
      expect(document.querySelector(`[${BADGE_ATTR}]`)).not.toBeNull();

      // advance past BADGE_LIFETIME_MS (3500) + fade duration (320ms)
      vi.advanceTimersByTime(3500 + 400);

      expect(document.querySelector(`[${BADGE_ATTR}]`)).toBeNull();
    });
  });

  describe("clearAllBadges", () => {
    it("removes all active badges from the document", () => {
      // Manually inject badges
      for (let i = 0; i < 3; i++) {
        const badge = document.createElement("div");
        badge.setAttribute(BADGE_ATTR, "");
        document.body.appendChild(badge);
      }

      expect(document.querySelectorAll(`[${BADGE_ATTR}]`)).toHaveLength(3);

      clearAllBadges();

      expect(document.querySelectorAll(`[${BADGE_ATTR}]`)).toHaveLength(0);
    });

    it("does not throw when there are no badges", () => {
      expect(() => clearAllBadges()).not.toThrow();
    });
  });
});
