// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createProgressNotification } from "@/lib/form/progress-notification";
import type { FormField, GenerationResult } from "@/types";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/i18n", () => ({
  t: (key: string, subs?: string[]) => {
    const MAP: Record<string, string> = {
      progressHeaderProcessing: "Processing…",
      progressDetecting: "detecting",
      progressFilling: "filling",
      progressHeaderDone: "Done",
      progressFailed: "failed",
      progressSummary: subs ? `${subs[0]}/${subs[1]} campos preenchidos` : "",
    };
    if (key === "progressSummary" && subs) {
      return `${subs[0]}/${subs[1]} campos preenchidos`;
    }
    return MAP[key] ?? key;
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeField(overrides: Partial<FormField> = {}): FormField {
  return {
    element: document.createElement("input"),
    selector: "#input-test",
    category: "text",
    fieldType: "email",
    required: false,
    ...overrides,
  } as FormField;
}

function makeResult(
  overrides: Partial<GenerationResult> = {},
): GenerationResult {
  return {
    fieldSelector: "#input-test",
    value: "test@example.com",
    source: "generator",
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("createProgressNotification", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Clean up any DOM nodes from previous test
    document
      .querySelectorAll("#fill-all-progress, #fill-all-progress-styles")
      .forEach((el) => el.remove());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document
      .querySelectorAll("#fill-all-progress, #fill-all-progress-styles")
      .forEach((el) => el.remove());
  });

  describe("container creation", () => {
    it("appends container to document.body", () => {
      createProgressNotification();
      expect(document.getElementById("fill-all-progress")).not.toBeNull();
    });

    it("injects style element on first call", () => {
      createProgressNotification();
      expect(
        document.getElementById("fill-all-progress-styles"),
      ).not.toBeNull();
    });

    it("does not inject duplicate style element on second call", () => {
      createProgressNotification();
      createProgressNotification();
      const styles = document.querySelectorAll("#fill-all-progress-styles");
      expect(styles.length).toBe(1);
    });

    it("removes previous container before creating a new one", () => {
      createProgressNotification();
      createProgressNotification();
      const containers = document.querySelectorAll("#fill-all-progress");
      expect(containers.length).toBe(1);
    });
  });

  describe("show()", () => {
    it("adds fa-progress-visible class via requestAnimationFrame", () => {
      const progress = createProgressNotification();
      progress.show();

      const container = document.getElementById("fill-all-progress")!;
      expect(container.classList.contains("fa-progress-visible")).toBe(false);

      // Flush rAF
      vi.runAllTimers();
      expect(container.classList.contains("fa-progress-visible")).toBe(true);
    });
  });

  describe("addDetecting(field)", () => {
    it("creates an item with 'detecting' class and badge text", () => {
      const progress = createProgressNotification();
      const field = makeField({ label: "Email", selector: "#email" });
      progress.addDetecting(field);

      const item = document.querySelector(".fa-progress-item.detecting");
      expect(item).not.toBeNull();
      expect(item?.querySelector(".fa-progress-badge")?.textContent).toBe(
        "detecting",
      );
    });

    it("shows ai spinner when detectionMethod is chrome-ai", () => {
      const progress = createProgressNotification();
      const field = makeField({ detectionMethod: "chrome-ai" });
      progress.addDetecting(field);

      expect(document.querySelector(".fa-spinner.ai")).not.toBeNull();
    });

    it("shows ai spinner when detectionMethod is tensorflow", () => {
      const progress = createProgressNotification();
      const field = makeField({ detectionMethod: "tensorflow" });
      progress.addDetecting(field);

      expect(document.querySelector(".fa-spinner.ai")).not.toBeNull();
    });

    it("shows regular spinner for non-AI detectionMethod", () => {
      const progress = createProgressNotification();
      const field = makeField({ detectionMethod: "keyword" });
      progress.addDetecting(field);

      const spinner = document.querySelector(".fa-spinner");
      expect(spinner).not.toBeNull();
      expect(spinner?.classList.contains("ai")).toBe(false);
    });

    it("shows regular spinner when detectionMethod is undefined", () => {
      const progress = createProgressNotification();
      const field = makeField({ detectionMethod: undefined });
      progress.addDetecting(field);

      const spinner = document.querySelector(".fa-spinner");
      expect(spinner).not.toBeNull();
      expect(spinner?.classList.contains("ai")).toBe(false);
    });

    it("reuses the same DOM item when called twice with same selector", () => {
      const progress = createProgressNotification();
      const field = makeField({ selector: "#same" });
      progress.addDetecting(field);
      progress.addDetecting(field);

      const items = document.querySelectorAll(".fa-progress-item");
      expect(items.length).toBe(1);
    });
  });

  describe("updateDetected(field)", () => {
    it("updates item to 'detected' class and shows fieldType + method badge", () => {
      const progress = createProgressNotification();
      const field = makeField({
        selector: "#cpf",
        fieldType: "cpf",
        detectionMethod: "keyword",
      });
      progress.addDetecting(field);
      progress.updateDetected(field);

      const item = document.querySelector(".fa-progress-item.detected");
      expect(item).not.toBeNull();
      const badge = item?.querySelector(".fa-progress-badge")?.textContent;
      expect(badge).toContain("cpf");
      expect(badge).toContain("keyword");
    });

    it("uses method icon for known detectionMethod", () => {
      const progress = createProgressNotification();
      const field = makeField({
        detectionMethod: "html-type",
        fieldType: "email",
      });
      progress.updateDetected(field);

      const icon = document.querySelector(".fa-progress-icon")?.textContent;
      expect(icon).toBe("⚡");
    });

    it("falls back to 🔍 for unmapped detectionMethod", () => {
      const progress = createProgressNotification();
      const field = makeField({
        detectionMethod: "unknown-strategy" as FormField["detectionMethod"],
        fieldType: "email",
      });
      progress.updateDetected(field);

      const icon = document.querySelector(".fa-progress-icon")?.textContent;
      expect(icon).toBe("🔍");
    });

    it("defaults detectionMethod to html-fallback when undefined", () => {
      const progress = createProgressNotification();
      const field = makeField({ detectionMethod: undefined, fieldType: "cpf" });
      progress.updateDetected(field);

      const badge = document
        .querySelector(".fa-progress-badge")
        ?.textContent?.toLowerCase();
      expect(badge).toContain("html-fallback");
    });
  });

  describe("addFilling(field)", () => {
    it("updates item to 'filling' class with badge text", () => {
      const progress = createProgressNotification();
      const field = makeField({ label: "Phone" });
      progress.addFilling(field);

      const item = document.querySelector(".fa-progress-item.filling");
      expect(item).not.toBeNull();
      expect(item?.querySelector(".fa-progress-badge")?.textContent).toBe(
        "filling",
      );
    });

    it("always uses ai spinner", () => {
      const progress = createProgressNotification();
      const field = makeField({ detectionMethod: "keyword" });
      progress.addFilling(field);

      expect(document.querySelector(".fa-spinner.ai")).not.toBeNull();
    });

    it("shows method icon in label for known methods", () => {
      const progress = createProgressNotification();
      const field = makeField({ detectionMethod: "tensorflow" });
      progress.addFilling(field);

      const label =
        document.querySelector(".fa-progress-label")?.textContent ?? "";
      expect(label).toContain("🧠");
    });

    it("shows fallback icon 🔍 for unmapped detectionMethod", () => {
      const progress = createProgressNotification();
      const field = makeField({
        detectionMethod: "unknown-strategy" as FormField["detectionMethod"],
      });
      progress.addFilling(field);

      const label =
        document.querySelector(".fa-progress-label")?.textContent ?? "";
      expect(label).toContain("🔍");
    });
  });

  describe("updateFilled(field, result)", () => {
    it("updates item to 'filled' class with source icon and value", () => {
      const progress = createProgressNotification();
      const field = makeField({ label: "Email" });
      const result = makeResult({ source: "generator", value: "hi@test.com" });
      progress.updateFilled(field, result);

      const item = document.querySelector(".fa-progress-item.filled");
      expect(item).not.toBeNull();
      const badge = item?.querySelector(".fa-progress-badge")?.textContent;
      expect(badge).toContain("hi@test.com");
    });

    it("shows correct icon for each source", () => {
      const cases: Array<[GenerationResult["source"], string]> = [
        ["fixed", "📌"],
        ["rule", "📏"],
        ["ai", "✨"],
        ["tensorflow", "🧠"],
        ["generator", "⚙️"],
      ];

      for (const [source, icon] of cases) {
        document
          .querySelectorAll("#fill-all-progress, #fill-all-progress-styles")
          .forEach((el) => el.remove());

        const progress = createProgressNotification();
        const field = makeField({ selector: `#${source}` });
        const result = makeResult({ source, value: "v" });
        progress.updateFilled(field, result);

        const iconEl = document.querySelector(".fa-progress-icon");
        expect(iconEl?.textContent).toBe(icon);
      }
    });

    it("truncates value longer than 20 characters with ellipsis", () => {
      const progress = createProgressNotification();
      const field = makeField();
      const longValue = "a".repeat(25);
      const result = makeResult({ value: longValue });
      progress.updateFilled(field, result);

      const badge =
        document.querySelector(".fa-progress-badge")?.textContent ?? "";
      expect(badge).toContain("…");
      expect(badge).not.toContain(longValue);
    });

    it("shows full value when 20 chars or less", () => {
      const progress = createProgressNotification();
      const field = makeField();
      const shortValue = "a".repeat(20);
      const result = makeResult({ value: shortValue });
      progress.updateFilled(field, result);

      const badge =
        document.querySelector(".fa-progress-badge")?.textContent ?? "";
      expect(badge).toContain(shortValue);
      expect(badge).not.toContain("…");
    });

    it("falls back to ✅ icon for unmapped source", () => {
      const progress = createProgressNotification();
      const field = makeField();
      const result = makeResult({
        source: "unknown-source" as GenerationResult["source"],
        value: "x",
      });
      progress.updateFilled(field, result);

      const icon = document.querySelector(".fa-progress-icon")?.textContent;
      expect(icon).toBe("✅");
    });
  });

  describe("updateError(field, error?)", () => {
    it("updates item to 'error' class with provided error message", () => {
      const progress = createProgressNotification();
      const field = makeField({ label: "CPF" });
      progress.updateError(field, "invalid input");

      const item = document.querySelector(".fa-progress-item.error");
      expect(item).not.toBeNull();
      const badge = item?.querySelector(".fa-progress-badge")?.textContent;
      expect(badge).toContain("invalid input");
    });

    it("truncates error message to 30 chars", () => {
      const progress = createProgressNotification();
      const field = makeField();
      const longError = "x".repeat(40);
      progress.updateError(field, longError);

      const badge =
        document.querySelector(".fa-progress-badge")?.textContent ?? "";
      expect(badge.length).toBeLessThan(longError.length);
    });

    it("uses t('progressFailed') fallback when no error provided", () => {
      const progress = createProgressNotification();
      const field = makeField();
      progress.updateError(field);

      const badge =
        document.querySelector(".fa-progress-badge")?.textContent ?? "";
      expect(badge).toBe("failed");
    });

    it("shows ❌ icon", () => {
      const progress = createProgressNotification();
      const field = makeField();
      progress.updateError(field);

      const icon = document.querySelector(".fa-progress-icon")?.textContent;
      expect(icon).toBe("❌");
    });
  });

  describe("done(totalFilled, totalFields)", () => {
    it("updates header text to done label", () => {
      const progress = createProgressNotification();
      progress.done(3, 5);

      const header = document.querySelector(".fa-progress-header");
      expect(header?.textContent).toBe("Done");
    });

    it("appends summary with filled/total counts", () => {
      const progress = createProgressNotification();
      progress.done(3, 5);

      const summary = document.querySelector(".fa-progress-summary");
      expect(summary?.textContent).toContain("3");
      expect(summary?.textContent).toContain("5");
      expect(summary?.textContent).toContain("campos preenchidos");
    });

    it("removes container after AUTO_HIDE_MS + fade transition", () => {
      const progress = createProgressNotification();
      progress.done(2, 4);

      expect(document.getElementById("fill-all-progress")).not.toBeNull();

      // After AUTO_HIDE_MS (4000ms) opacity transition starts
      vi.advanceTimersByTime(4000);
      expect(document.getElementById("fill-all-progress")).not.toBeNull(); // still visible during fade

      // After 4000ms + 500ms fade the element is removed
      vi.advanceTimersByTime(500);
      expect(document.getElementById("fill-all-progress")).toBeNull();
    });
  });

  describe("destroy()", () => {
    it("removes the container from DOM immediately", () => {
      const progress = createProgressNotification();
      expect(document.getElementById("fill-all-progress")).not.toBeNull();

      progress.destroy();
      expect(document.getElementById("fill-all-progress")).toBeNull();
    });

    it("clears the auto-hide timer when called after done()", () => {
      const progress = createProgressNotification();
      progress.done(1, 1);

      // destroy should cancel the timer — advancing time won't throw
      progress.destroy();
      expect(() => vi.runAllTimers()).not.toThrow();
    });
  });

  describe("getFieldLabel fallback chain", () => {
    it("prefers label over other fields", () => {
      const progress = createProgressNotification();
      const field = makeField({
        label: "My Label",
        name: "myname",
        id: "myid",
      });
      progress.addDetecting(field);

      const labelEl =
        document.querySelector(".fa-progress-label")?.textContent ?? "";
      expect(labelEl).toContain("My Label");
    });

    it("falls back to name when label is absent", () => {
      const progress = createProgressNotification();
      const field = makeField({ label: undefined, name: "myname", id: "myid" });
      progress.addDetecting(field);

      const labelEl =
        document.querySelector(".fa-progress-label")?.textContent ?? "";
      expect(labelEl).toContain("myname");
    });

    it("falls back to id when label and name are absent", () => {
      const progress = createProgressNotification();
      const field = makeField({
        label: undefined,
        name: undefined,
        id: "myid",
      });
      progress.addDetecting(field);

      const labelEl =
        document.querySelector(".fa-progress-label")?.textContent ?? "";
      expect(labelEl).toContain("myid");
    });

    it("falls back to fieldType when label, name, and id are absent", () => {
      const progress = createProgressNotification();
      const field = makeField({
        label: undefined,
        name: undefined,
        id: undefined,
        fieldType: "cpf",
      });
      progress.addDetecting(field);

      const labelEl =
        document.querySelector(".fa-progress-label")?.textContent ?? "";
      expect(labelEl).toContain("cpf");
    });

    it("falls back to selector as last resort", () => {
      const progress = createProgressNotification();
      const field = makeField({
        label: undefined,
        name: undefined,
        id: undefined,
        fieldType: undefined as unknown as FormField["fieldType"],
        selector: "#fallback-selector",
      });
      progress.addDetecting(field);

      const labelEl =
        document.querySelector(".fa-progress-label")?.textContent ?? "";
      expect(labelEl).toContain("#fallback-selector");
    });
  });

  describe("all METHOD_ICON entries", () => {
    const methods: Array<[string, string]> = [
      ["html-type", "⚡"],
      ["keyword", "🔑"],
      ["tensorflow", "🧠"],
      ["chrome-ai", "✨"],
      ["html-fallback", "❓"],
      ["custom-select", "📋"],
      ["interactive", "🎛"],
      ["user-override", "👤"],
    ];

    it.each(methods)("shows icon %s → %s in updateDetected", (method, icon) => {
      document
        .querySelectorAll("#fill-all-progress, #fill-all-progress-styles")
        .forEach((el) => el.remove());

      const progress = createProgressNotification();
      const field = makeField({
        selector: `#${method}`,
        detectionMethod: method as FormField["detectionMethod"],
        fieldType: "email",
      });
      progress.updateDetected(field);

      const iconEl = document.querySelector(".fa-progress-icon");
      expect(iconEl?.textContent).toBe(icon);
    });
  });

  describe("escapeTextContent", () => {
    it("escapes HTML special characters in field label", () => {
      const progress = createProgressNotification();
      const field = makeField({ label: '<script>alert("xss")</script>' });
      progress.addDetecting(field);

      // The raw HTML should NOT contain unescaped <script>
      const container = document.getElementById("fill-all-progress")!;
      expect(container.innerHTML).not.toContain("<script>");
      // But the text content should show the original characters
      const label = document.querySelector(".fa-progress-label");
      expect(label?.textContent).toBe('<script>alert("xss")</script>');
    });
  });
});
