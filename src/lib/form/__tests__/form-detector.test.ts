/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FormField } from "@/types";

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    groupCollapsed: vi.fn(),
    groupEnd: vi.fn(),
  }),
}));

vi.mock("@/lib/form/detectors/classifiers", () => ({
  DEFAULT_PIPELINE: {},
  DEFAULT_COLLECTION_PIPELINE: {},
  nativeInputDetector: { detect: vi.fn().mockReturnValue([]) },
  detectNativeFieldsAsync: vi.fn().mockResolvedValue([]),
  streamNativeFieldsAsync: vi.fn().mockReturnValue((async function* () {})()),
  classifyCustomFieldsSync: vi
    .fn()
    .mockImplementation((fields: FormField[]) => fields),
}));

vi.mock("@/lib/form/adapters/adapter-registry", () => ({
  detectCustomComponents: vi.fn().mockReturnValue([]),
}));

import {
  detectAllFields,
  detectAllFieldsAsync,
  detectFormFields,
  streamAllFields,
} from "@/lib/form/form-detector";
import {
  nativeInputDetector,
  detectNativeFieldsAsync,
  streamNativeFieldsAsync,
  classifyCustomFieldsSync,
} from "@/lib/form/detectors/classifiers";
import { detectCustomComponents } from "@/lib/form/adapters/adapter-registry";

function makeField(id: string, parent?: HTMLElement): FormField {
  const element = document.createElement("input");
  element.id = id;
  if (parent) parent.appendChild(element);
  return {
    element,
    selector: `#${id}`,
    fieldType: "text",
    label: id,
    name: id,
    id,
    placeholder: "",
    required: false,
    category: "generic",
  };
}

describe("form-detector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(nativeInputDetector.detect).mockReturnValue([]);
    vi.mocked(detectNativeFieldsAsync).mockResolvedValue([]);
    vi.mocked(streamNativeFieldsAsync).mockReturnValue(
      (async function* () {})(),
    );
    vi.mocked(classifyCustomFieldsSync).mockImplementation(
      (f) => f as FormField[],
    );
    vi.mocked(detectCustomComponents).mockReturnValue([]);
  });

  // ─────────────────────── detectFormFields ───────────────────────────

  describe("detectFormFields", () => {
    it("retorna array de campos detectados", () => {
      const field = makeField("email");
      vi.mocked(nativeInputDetector.detect).mockReturnValue([field]);
      const result = detectFormFields();
      expect(result).toContain(field);
    });

    it("retorna array vazio quando não há campos", () => {
      expect(detectFormFields()).toEqual([]);
    });
  });

  // ─────────────────────── detectAllFields ────────────────────────────

  describe("detectAllFields", () => {
    it("retorna DetectionResult com propriedade fields", () => {
      const result = detectAllFields();
      expect(result).toHaveProperty("fields");
      expect(Array.isArray(result.fields)).toBe(true);
    });

    it("mescla campos nativos e customizados", () => {
      const native = makeField("native");
      const custom = makeField("custom");
      vi.mocked(nativeInputDetector.detect).mockReturnValue([native]);
      vi.mocked(detectCustomComponents).mockReturnValue([custom as any]);
      vi.mocked(classifyCustomFieldsSync).mockReturnValue([custom]);

      const { fields } = detectAllFields();
      expect(fields).toHaveLength(2);
      expect(fields).toContain(native);
      expect(fields).toContain(custom);
    });

    it("deduplica campos nativos contidos em wrapper de componente customizado", () => {
      const wrapper = document.createElement("div");
      document.body.appendChild(wrapper);

      const nativeElement = document.createElement("input");
      wrapper.appendChild(nativeElement);

      const nativeField: FormField = {
        element: nativeElement,
        selector: "div input",
        fieldType: "text",
        label: "native",
        name: "native",
        id: "native",
        placeholder: "",
        required: false,
        category: "generic",
      };

      const customField: FormField = {
        element: wrapper,
        selector: "div",
        fieldType: "text",
        label: "custom",
        name: "custom",
        id: "custom",
        placeholder: "",
        required: false,
        category: "generic",
      };

      vi.mocked(nativeInputDetector.detect).mockReturnValue([nativeField]);
      vi.mocked(detectCustomComponents).mockReturnValue([customField as any]);
      vi.mocked(classifyCustomFieldsSync).mockReturnValue([customField]);

      const { fields } = detectAllFields();
      // nativeField element is inside wrapper, so should be deduped
      expect(fields).not.toContain(nativeField);
      expect(fields).toContain(customField);

      wrapper.remove();
    });
  });

  // ─────────────────────── detectAllFieldsAsync ────────────────────────

  describe("detectAllFieldsAsync", () => {
    it("retorna DetectionResult assíncrono", async () => {
      const result = await detectAllFieldsAsync();
      expect(result).toHaveProperty("fields");
    });

    it("usa detectNativeFieldsAsync para campos nativos", async () => {
      const field = makeField("cpf");
      vi.mocked(detectNativeFieldsAsync).mockResolvedValue([field]);
      const { fields } = await detectAllFieldsAsync();
      expect(fields).toContain(field);
    });

    it("registra método de detecção em cada campo", async () => {
      const field = makeField("email");
      field.detectionMethod = "keyword";
      field.detectionConfidence = 0.9;
      field.detectionDurationMs = 5;
      vi.mocked(detectNativeFieldsAsync).mockResolvedValue([field]);
      const { fields } = await detectAllFieldsAsync();
      expect(fields).toContain(field);
    });

    it("não lança exceção quando campos têm propriedades ausentes", async () => {
      const field = makeField("test");
      // Remove optional properties
      delete (field as any).detectionMethod;
      delete (field as any).detectionDurationMs;
      vi.mocked(detectNativeFieldsAsync).mockResolvedValue([field]);
      await expect(detectAllFieldsAsync()).resolves.toHaveProperty("fields");
    });

    it("mescla campos customizados com nativos", async () => {
      const native = makeField("native");
      const custom = makeField("custom");
      vi.mocked(detectNativeFieldsAsync).mockResolvedValue([native]);
      vi.mocked(detectCustomComponents).mockReturnValue([custom as any]);
      vi.mocked(classifyCustomFieldsSync).mockReturnValue([custom]);

      const { fields } = await detectAllFieldsAsync();
      expect(fields).toHaveLength(2);
    });
  });

  // ─────────────────────── streamAllFields ────────────────────────────

  describe("streamAllFields", () => {
    it("emite campos nativos via stream", async () => {
      const field1 = makeField("f1");
      const field2 = makeField("f2");

      async function* fakeStream() {
        yield field1;
        yield field2;
      }
      vi.mocked(streamNativeFieldsAsync).mockReturnValue(fakeStream());

      const results: FormField[] = [];
      for await (const f of streamAllFields()) {
        results.push(f);
      }
      expect(results).toContain(field1);
      expect(results).toContain(field2);
    });

    it("emite campos customizados após campos nativos", async () => {
      const customField = makeField("custom");
      vi.mocked(streamNativeFieldsAsync).mockReturnValue(
        (async function* () {})(),
      );
      vi.mocked(detectCustomComponents).mockReturnValue([customField as any]);
      vi.mocked(classifyCustomFieldsSync).mockReturnValue([customField]);

      const results: FormField[] = [];
      for await (const f of streamAllFields()) {
        results.push(f);
      }
      expect(results).toContain(customField);
    });
  });
});
