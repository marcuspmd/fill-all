// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FormField, GenerationResult, SavedForm, Settings } from "@/types";

// ── Mocks ────────────────────────────────────────────────────────────────────

const {
  mockDetectAllFieldsAsync,
  mockStreamAllFields,
  mockResolveFieldValue,
  mockIsChromeAiAvailable,
  mockChromeAiGenerate,
  mockTensorFlowGenerate,
  mockGetSettings,
  mockGetIgnoredFieldsForUrl,
  mockSetFillingInProgress,
  mockFillCustomComponent,
  mockGenerate,
  mockCreateProgressNotification,
} = vi.hoisted(() => {
  const progressMock = {
    show: vi.fn(),
    addDetecting: vi.fn(),
    updateDetected: vi.fn(),
    addFilling: vi.fn(),
    updateFilled: vi.fn(),
    updateError: vi.fn(),
    done: vi.fn(),
    destroy: vi.fn(),
  };
  return {
    mockDetectAllFieldsAsync: vi.fn(),
    mockStreamAllFields: vi.fn(),
    mockResolveFieldValue: vi.fn(),
    mockIsChromeAiAvailable: vi.fn().mockResolvedValue(false),
    mockChromeAiGenerate: vi.fn(),
    mockTensorFlowGenerate: vi.fn(),
    mockGetSettings: vi.fn(),
    mockGetIgnoredFieldsForUrl: vi.fn().mockResolvedValue([]),
    mockSetFillingInProgress: vi.fn(),
    mockFillCustomComponent: vi.fn().mockResolvedValue(false),
    mockGenerate: vi.fn().mockReturnValue("generated-value"),
    mockCreateProgressNotification: vi.fn().mockReturnValue(progressMock),
  };
});

vi.mock("../form-detector", () => ({
  detectAllFieldsAsync: mockDetectAllFieldsAsync,
  streamAllFields: mockStreamAllFields,
}));
vi.mock("@/lib/rules/rule-engine", () => ({
  resolveFieldValue: mockResolveFieldValue,
}));
vi.mock("@/lib/ai/chrome-ai-proxy", () => ({
  isAvailableViaProxy: mockIsChromeAiAvailable,
  generateFieldValueViaProxy: mockChromeAiGenerate,
}));
vi.mock("@/lib/ai/tensorflow-generator", () => ({
  generateWithTensorFlow: mockTensorFlowGenerate,
}));
vi.mock("@/lib/storage/storage", () => ({
  getSettings: mockGetSettings,
  getIgnoredFieldsForUrl: mockGetIgnoredFieldsForUrl,
}));
vi.mock("../dom-watcher", () => ({
  setFillingInProgress: mockSetFillingInProgress,
}));
vi.mock("../adapters/adapter-registry", () => ({
  fillCustomComponent: mockFillCustomComponent,
}));
vi.mock("@/lib/generators", () => ({ generate: mockGenerate }));
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
  logAuditFill: vi.fn(),
}));
vi.mock("../progress-notification", () => ({
  createProgressNotification: mockCreateProgressNotification,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeInput(type = "text", id = "", name = ""): HTMLInputElement {
  const el = document.createElement("input");
  el.type = type;
  if (id) el.id = id;
  if (name) el.name = name;
  document.body.appendChild(el);
  return el;
}

function makeField(
  el: HTMLElement,
  overrides: Partial<FormField> = {},
): FormField {
  return {
    element: el as HTMLInputElement,
    selector: `#${(el as HTMLInputElement).id || "field"}`,
    fieldType: "text",
    category: "text",
    label: "Label",
    detectionMethod: "keyword",
    detectionConfidence: 0.9,
    required: false,
    ...overrides,
  } as FormField;
}

const DEFAULT_SETTINGS: Settings = {
  autoFillOnLoad: false,
  defaultStrategy: "random",
  useChromeAI: false,
  forceAIFirst: false,
  shortcut: "Alt+Shift+F",
  locale: "pt-BR",
  highlightFilled: false,
  cacheEnabled: false,
  showFieldIcon: false,
  fieldIconPosition: "inside",
  detectionPipeline: [],
  debugLog: false,
  logLevel: "warn",
  uiLanguage: "auto",
  fillEmptyOnly: false,
  watcherEnabled: false,
  watcherDebounceMs: 600,
  watcherAutoRefill: true,
  watcherShadowDOM: false,
  logMaxEntries: 1000,
  aiTimeoutMs: 5000,
  showAiBadge: false,
  showFillToast: false,
};

/** Helper: wraps an array of fields into an async generator for streamAllFields mock */
function mockStreamFields(fields: FormField[]): void {
  mockStreamAllFields.mockImplementation(async function* () {
    for (const f of fields) yield f;
  });
}

// ── Import SUT AFTER mocks ────────────────────────────────────────────────────

import {
  applyTemplate,
  captureFormValues,
  fillAllFields,
  fillSingleField,
} from "../form-filler";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("form-filler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
    mockGetSettings.mockResolvedValue({ ...DEFAULT_SETTINGS });
    mockGetIgnoredFieldsForUrl.mockResolvedValue([]);
    mockIsChromeAiAvailable.mockResolvedValue(false);
  });

  // ── fillAllFields ──────────────────────────────────────────────────────────

  describe("fillAllFields", () => {
    it("fills all detected fields and returns results", async () => {
      const el = makeInput("text", "email-field");
      const field = makeField(el, { fieldType: "email", label: "Email" });

      mockStreamFields([field]);
      mockResolveFieldValue.mockResolvedValue({
        fieldSelector: "#email-field",
        value: "test@example.com",
        source: "generator",
      } satisfies GenerationResult);

      const results = await fillAllFields();

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe("test@example.com");
      expect(mockSetFillingInProgress).toHaveBeenCalledWith(true);
      expect(mockSetFillingInProgress).toHaveBeenCalledWith(false);
    });

    it("skips ignored fields", async () => {
      const el = makeInput("text", "ignored-field");
      const field = makeField(el, { selector: "#ignored-field" });

      mockStreamFields([field]);
      mockGetIgnoredFieldsForUrl.mockResolvedValue([
        { selector: "#ignored-field", label: "Ignored" },
      ]);

      const results = await fillAllFields();

      expect(results).toHaveLength(0);
      expect(mockResolveFieldValue).not.toHaveBeenCalled();
    });

    it("skips fields with existing values when fillEmptyOnly=true", async () => {
      const el = makeInput("text", "pre-filled");
      el.value = "existing value";
      const field = makeField(el, { selector: "#pre-filled" });

      mockStreamFields([field]);
      mockGetSettings.mockResolvedValue({
        ...DEFAULT_SETTINGS,
        fillEmptyOnly: true,
      });

      const results = await fillAllFields();

      expect(results).toHaveLength(0);
    });

    it("respects fillEmptyOnly override via options", async () => {
      const el = makeInput("text", "pre-filled2");
      el.value = "existing";
      const field = makeField(el, { selector: "#pre-filled2" });

      mockStreamFields([field]);
      mockGetSettings.mockResolvedValue({
        ...DEFAULT_SETTINGS,
        fillEmptyOnly: false,
      });
      mockResolveFieldValue.mockResolvedValue({
        fieldSelector: "#pre-filled2",
        value: "x",
        source: "generator",
      });

      // Explicitly pass fillEmptyOnly=true to override setting
      const results = await fillAllFields({ fillEmptyOnly: true });

      expect(results).toHaveLength(0);
    });

    it("returns empty array when no fields detected", async () => {
      mockStreamFields([]);

      const results = await fillAllFields();

      expect(results).toHaveLength(0);
    });

    it("always resets setFillingInProgress(false) even when it throws", async () => {
      const el = makeInput("text", "err-field");
      const field = makeField(el);

      mockStreamFields([field]);
      mockResolveFieldValue.mockRejectedValue(new Error("resolver failed"));

      // Should not throw, just skip
      const results = await fillAllFields();

      expect(results).toHaveLength(0);
      expect(mockSetFillingInProgress).toHaveBeenCalledWith(false);
    });

    it("fills select element by choosing a random option", async () => {
      const sel = document.createElement("select");
      sel.id = "sel-field";
      const opt = document.createElement("option");
      opt.value = "BR";
      opt.text = "Brazil";
      sel.appendChild(opt);
      document.body.appendChild(sel);

      const field = makeField(sel as unknown as HTMLInputElement, {
        element: sel as unknown as HTMLInputElement,
        selector: "#sel-field",
        fieldType: "select",
      });

      mockStreamFields([field]);
      mockResolveFieldValue.mockResolvedValue({
        fieldSelector: "#sel-field",
        value: "BR",
        source: "rule",
      });

      const results = await fillAllFields();

      expect(results).toHaveLength(1);
      expect(sel.value).toBe("BR");
    });

    it("handles checkbox field", async () => {
      const cb = makeInput("checkbox", "cb-field");
      const field = makeField(cb, {
        fieldType: "checkbox",
        selector: "#cb-field",
      });

      mockStreamFields([field]);
      mockResolveFieldValue.mockResolvedValue({
        fieldSelector: "#cb-field",
        value: "true",
        source: "generator",
      });

      await fillAllFields();

      expect(cb.checked).toBe(true);
    });
  });

  // ── fillSingleField ────────────────────────────────────────────────────────

  describe("fillSingleField", () => {
    it("fills single field and returns result", async () => {
      const el = makeInput("email", "single-email");
      const field = makeField(el, { fieldType: "email" });

      mockGetSettings.mockResolvedValue({ ...DEFAULT_SETTINGS });
      mockResolveFieldValue.mockResolvedValue({
        fieldSelector: "#single-email",
        value: "user@test.com",
        source: "ai",
      } satisfies GenerationResult);

      const result = await fillSingleField(field);

      expect(result).not.toBeNull();
      expect(result?.value).toBe("user@test.com");
    });

    it("returns null when resolver throws", async () => {
      const el = makeInput("text", "bad-field");
      const field = makeField(el);

      mockResolveFieldValue.mockRejectedValue(new Error("AI down"));

      const result = await fillSingleField(field);

      expect(result).toBeNull();
    });
  });

  // ── captureFormValues ──────────────────────────────────────────────────────

  describe("captureFormValues", () => {
    it("captures values indexed by id", async () => {
      const el = makeInput("text", "my-name");
      el.value = "Marcus";
      const field = makeField(el, { id: "my-name", selector: "#my-name" });

      mockDetectAllFieldsAsync.mockResolvedValue({ fields: [field] });

      const values = await captureFormValues();

      expect(values["my-name"]).toBe("Marcus");
    });

    it("captures values indexed by name when id missing", async () => {
      const el = makeInput("text", "", "user_email");
      el.value = "me@test.com";
      const field = makeField(el, {
        id: undefined,
        name: "user_email",
        selector: 'input[name="user_email"]',
      });

      mockDetectAllFieldsAsync.mockResolvedValue({ fields: [field] });

      const values = await captureFormValues();

      expect(values["user_email"]).toBe("me@test.com");
    });

    it("captures checkbox state as string", async () => {
      const el = makeInput("checkbox", "my-cb");
      el.checked = true;
      const field = makeField(el, { id: "my-cb", selector: "#my-cb" });

      mockDetectAllFieldsAsync.mockResolvedValue({ fields: [field] });

      const values = await captureFormValues();

      expect(values["my-cb"]).toBe("true");
    });

    it("captures textarea value", async () => {
      const ta = document.createElement("textarea");
      ta.id = "my-ta";
      ta.value = "hello textarea";
      document.body.appendChild(ta);

      const field = makeField(ta as unknown as HTMLInputElement, {
        element: ta as unknown as HTMLInputElement,
        id: "my-ta",
        selector: "#my-ta",
      });

      mockDetectAllFieldsAsync.mockResolvedValue({ fields: [field] });

      const values = await captureFormValues();

      expect(values["my-ta"]).toBe("hello textarea");
    });

    it("returns empty object when no fields detected", async () => {
      mockDetectAllFieldsAsync.mockResolvedValue({ fields: [] });

      const values = await captureFormValues();

      expect(values).toEqual({});
    });
  });

  // ── applyTemplate ──────────────────────────────────────────────────────────

  describe("applyTemplate", () => {
    it("applies fixed-value template by selector", async () => {
      const el = makeInput("text", "t-name");
      const field = makeField(el, { selector: "#t-name", fieldType: "text" });

      mockDetectAllFieldsAsync.mockResolvedValue({ fields: [field] });

      const form: SavedForm = {
        id: "form-1",
        name: "Test Form",
        urlPattern: "*",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        templateFields: [
          {
            key: "#t-name",
            label: "Name",
            mode: "fixed" as const,
            fixedValue: "Alice",
          },
        ],
        fields: {},
      };

      const { filled } = await applyTemplate(form);

      expect(filled).toBe(1);
      expect(el.value).toBe("Alice");
    });

    it("applies generator-mode template by selector", async () => {
      const el = makeInput("text", "t-email");
      const field = makeField(el, {
        selector: "#t-email",
        fieldType: "email",
      });

      mockDetectAllFieldsAsync.mockResolvedValue({ fields: [field] });
      mockGenerate.mockReturnValue("gen@example.com");

      const form: SavedForm = {
        id: "form-2",
        name: "Gen Form",
        urlPattern: "*",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        templateFields: [
          {
            key: "#t-email",
            label: "Email",
            mode: "generator" as const,
            generatorType: "email",
          },
        ],
        fields: {},
      };

      const { filled } = await applyTemplate(form);

      expect(filled).toBe(1);
      expect(mockGenerate).toHaveBeenCalledWith("email");
    });

    it("applies type-based template matching all fields of given type", async () => {
      const el1 = makeInput("email", "email-1");
      const el2 = makeInput("email", "email-2");
      const field1 = makeField(el1, {
        selector: "#email-1",
        fieldType: "email",
      });
      const field2 = makeField(el2, {
        selector: "#email-2",
        fieldType: "email",
      });

      mockDetectAllFieldsAsync.mockResolvedValue({ fields: [field1, field2] });

      const form: SavedForm = {
        id: "form-3",
        name: "Type Form",
        urlPattern: "*",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        templateFields: [
          {
            key: "email",
            label: "Email",
            mode: "fixed" as const,
            fixedValue: "type@example.com",
            matchByFieldType: "email",
          },
        ],
        fields: {},
      };

      const { filled } = await applyTemplate(form);

      expect(filled).toBe(2);
    });

    it("falls back to legacy fields when templateFields is empty", async () => {
      const el = makeInput("text", "legacy-id");
      const field = makeField(el, { id: "legacy-id", selector: "#legacy-id" });

      mockDetectAllFieldsAsync.mockResolvedValue({ fields: [field] });

      const form: SavedForm = {
        id: "form-4",
        name: "Legacy Form",
        urlPattern: "*",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        templateFields: [],
        fields: { "legacy-id": "Legacy Value" },
      };

      const { filled } = await applyTemplate(form);

      expect(filled).toBe(1);
      expect(el.value).toBe("Legacy Value");
    });

    it("returns filled=0 when no fields match template", async () => {
      mockDetectAllFieldsAsync.mockResolvedValue({ fields: [] });

      const form: SavedForm = {
        id: "form-5",
        name: "Empty Form",
        urlPattern: "*",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        templateFields: [],
        fields: { "#nonexistent": "value" },
      };

      const { filled } = await applyTemplate(form);

      expect(filled).toBe(0);
    });
  });
});
