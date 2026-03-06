/** @vitest-environment happy-dom */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { executeStep, highlightElement } from "@/lib/demo/step-executor";
import { DEFAULT_REPLAY_CONFIG } from "@/lib/demo/demo.types";
import type {
  FlowStep,
  ReplayConfig,
  ExecuteStepPayload,
} from "@/lib/demo/demo.types";

// ── Helpers ───────────────────────────────────────────────────────────────

function assertFailed(result: {
  status: string;
  error?: string;
}): asserts result is { status: "failed"; error: string } {
  expect(result.status).toBe("failed");
}

function assertSkipped(result: {
  status: string;
  reason?: string;
}): asserts result is { status: "skipped"; reason: string } {
  expect(result.status).toBe("skipped");
}

const defaultConfig: ReplayConfig = {
  ...DEFAULT_REPLAY_CONFIG,
  stepDelay: 100,
  typingDelay: 0,
};

function makeStep(overrides: Partial<FlowStep> = {}): FlowStep {
  return {
    id: "step_1",
    action: "click",
    selector: "#target",
    ...overrides,
  };
}

function makePayload(
  step: FlowStep,
  resolvedValue?: string,
  config?: Partial<ReplayConfig>,
): ExecuteStepPayload {
  return {
    step,
    resolvedValue,
    replayConfig: { ...defaultConfig, ...config },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("executeStep — navigate", () => {
  it("returns success for navigate with url", async () => {
    const step = makeStep({ action: "navigate", url: "https://example.com" });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("success");
  });

  it("returns failed when url is missing", async () => {
    const step = makeStep({ action: "navigate", url: undefined });

    const result = await executeStep(makePayload(step));

    assertFailed(result);
    expect(result.error).toContain("missing url");
  });
});

describe("executeStep — fill", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("fills an input element with the resolved value", async () => {
    document.body.innerHTML = '<input id="target" />';
    const step = makeStep({ action: "fill" });

    const result = await executeStep(makePayload(step, "test-value"));

    expect(result.status).toBe("success");
    const input = document.querySelector("#target") as HTMLInputElement;
    expect(input.value).toBe("test-value");
  });

  it("fills a textarea element", async () => {
    document.body.innerHTML = '<textarea id="target"></textarea>';
    const step = makeStep({ action: "fill" });

    const result = await executeStep(makePayload(step, "multiline"));

    expect(result.status).toBe("success");
    const textarea = document.querySelector("#target") as HTMLTextAreaElement;
    expect(textarea.value).toBe("multiline");
  });

  it("fails when target is not input/textarea", async () => {
    document.body.innerHTML = '<div id="target">text</div>';
    const step = makeStep({ action: "fill" });

    const result = await executeStep(makePayload(step, "val"));

    assertFailed(result);
    expect(result.error).toContain("not an input/textarea");
  });

  it("fails when element not found", async () => {
    document.body.innerHTML = "";
    const step = makeStep({ action: "fill", selector: "#missing" });

    const result = await executeStep(makePayload(step, "val"));

    assertFailed(result);
    expect(result.error).toContain("not found");
  });

  it("dispatches input, change, and blur events", async () => {
    document.body.innerHTML = '<input id="target" />';
    const input = document.querySelector("#target") as HTMLInputElement;
    const events: string[] = [];
    (["input", "change", "blur"] as const).forEach((evt) =>
      input.addEventListener(evt, () => events.push(evt)),
    );

    const step = makeStep({ action: "fill" });
    await executeStep(makePayload(step, "x"));

    expect(events).toContain("input");
    expect(events).toContain("change");
    expect(events).toContain("blur");
  });

  it("uses empty string when resolvedValue is undefined", async () => {
    document.body.innerHTML = '<input id="target" />';
    const step = makeStep({ action: "fill" });

    await executeStep(makePayload(step));

    const input = document.querySelector("#target") as HTMLInputElement;
    expect(input.value).toBe("");
  });
});

describe("executeStep — click", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("clicks an HTMLElement", async () => {
    document.body.innerHTML = '<button id="target">Click me</button>';
    let clicked = false;
    document
      .querySelector("#target")!
      .addEventListener("click", () => (clicked = true));

    const step = makeStep({ action: "click" });
    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("success");
    expect(clicked).toBe(true);
  });

  it("fails when element not found", async () => {
    document.body.innerHTML = "";
    const step = makeStep({ action: "click", selector: "#missing" });

    const result = await executeStep(makePayload(step));

    assertFailed(result);
    expect(result.error).toContain("not found");
  });
});

describe("executeStep — select", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("selects by text", async () => {
    document.body.innerHTML = `
      <select id="target">
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
      </select>
    `;
    const step = makeStep({
      action: "select",
      selectText: "Beta",
    });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("success");
    const select = document.querySelector("#target") as HTMLSelectElement;
    expect(select.value).toBe("b");
  });

  it("selects by index", async () => {
    document.body.innerHTML = `
      <select id="target">
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
      </select>
    `;
    const step = makeStep({
      action: "select",
      selectIndex: 1,
    });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("success");
    const select = document.querySelector("#target") as HTMLSelectElement;
    expect(select.selectedIndex).toBe(1);
  });

  it("fails when option text not found", async () => {
    document.body.innerHTML = `
      <select id="target">
        <option value="a">Alpha</option>
      </select>
    `;
    const step = makeStep({
      action: "select",
      selectText: "Nonexistent",
    });

    const result = await executeStep(makePayload(step));

    assertFailed(result);
    expect(result.error).toContain("not found");
  });

  it("fails when index out of range", async () => {
    document.body.innerHTML = `
      <select id="target">
        <option value="a">Alpha</option>
      </select>
    `;
    const step = makeStep({
      action: "select",
      selectIndex: 99,
    });

    const result = await executeStep(makePayload(step));

    assertFailed(result);
    expect(result.error).toContain("out of range");
  });

  it("fails when target is not a select", async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const step = makeStep({ action: "select", selectText: "x" });

    const result = await executeStep(makePayload(step));

    assertFailed(result);
    expect(result.error).toContain("not a <select>");
  });
});

describe("executeStep — check/uncheck", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("checks a checkbox", async () => {
    document.body.innerHTML = '<input id="target" type="checkbox" />';
    const step = makeStep({ action: "check" });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("success");
    const cb = document.querySelector("#target") as HTMLInputElement;
    expect(cb.checked).toBe(true);
  });

  it("unchecks a checkbox", async () => {
    document.body.innerHTML = '<input id="target" type="checkbox" checked />';
    const step = makeStep({ action: "uncheck" });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("success");
    const cb = document.querySelector("#target") as HTMLInputElement;
    expect(cb.checked).toBe(false);
  });

  it("does nothing if already in desired state", async () => {
    document.body.innerHTML = '<input id="target" type="checkbox" checked />';
    const step = makeStep({ action: "check" });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("success");
    const cb = document.querySelector("#target") as HTMLInputElement;
    expect(cb.checked).toBe(true);
  });

  it("fails when target is not an input", async () => {
    document.body.innerHTML = '<div id="target"></div>';
    const step = makeStep({ action: "check" });

    const result = await executeStep(makePayload(step));

    assertFailed(result);
    expect(result.error).toContain("not an input");
  });
});

describe("executeStep — clear", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("clears an input value", async () => {
    document.body.innerHTML = '<input id="target" value="hello" />';
    const step = makeStep({ action: "clear" });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("success");
    const input = document.querySelector("#target") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("dispatches events on clear", async () => {
    document.body.innerHTML = '<input id="target" value="x" />';
    const input = document.querySelector("#target") as HTMLInputElement;
    const events: string[] = [];
    (["input", "change"] as const).forEach((evt) =>
      input.addEventListener(evt, () => events.push(evt)),
    );

    const step = makeStep({ action: "clear" });
    await executeStep(makePayload(step));

    expect(events).toContain("input");
    expect(events).toContain("change");
  });
});

describe("executeStep — press-key", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("dispatches keydown and keyup events", async () => {
    document.body.innerHTML = '<input id="target" />';
    const input = document.querySelector("#target") as HTMLInputElement;
    input.focus();

    const keys: string[] = [];
    input.addEventListener("keydown", (e) => keys.push(`down:${e.key}`));
    input.addEventListener("keyup", (e) => keys.push(`up:${e.key}`));

    const step = makeStep({ action: "press-key", key: "Enter" });
    await executeStep(makePayload(step));

    expect(keys).toContain("down:Enter");
    expect(keys).toContain("up:Enter");
  });

  it("fails when key is missing", async () => {
    const step = makeStep({ action: "press-key", key: undefined });

    const result = await executeStep(makePayload(step));

    assertFailed(result);
    expect(result.error).toContain("missing key");
  });
});

describe("executeStep — scroll", () => {
  it("calls window.scrollTo", async () => {
    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const step = makeStep({
      action: "scroll",
      scrollPosition: { x: 0, y: 500 },
    });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("success");
    expect(scrollSpy).toHaveBeenCalledWith(
      expect.objectContaining({ left: 0, top: 500 }),
    );

    scrollSpy.mockRestore();
  });
});

describe("executeStep — assert", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("assert visible — success when element exists", async () => {
    document.body.innerHTML = '<div id="target">hello</div>';
    const step = makeStep({
      action: "assert",
      assertion: { operator: "visible" },
    });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("success");
  });

  it("assert visible — fails when element not found", async () => {
    document.body.innerHTML = "";
    const step = makeStep({
      action: "assert",
      selector: "#missing",
      assertion: { operator: "visible" },
    });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("failed");
  });

  it("assert exists — success when element exists", async () => {
    document.body.innerHTML = '<div id="target">x</div>';
    const step = makeStep({
      action: "assert",
      assertion: { operator: "exists" },
    });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("success");
  });

  it("assert exists — fails when element missing", async () => {
    document.body.innerHTML = "";
    const step = makeStep({
      action: "assert",
      selector: "#missing",
      assertion: { operator: "exists" },
    });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("failed");
  });

  it("assert equals — checks input value", async () => {
    document.body.innerHTML = '<input id="target" value="test" />';
    const step = makeStep({
      action: "assert",
      assertion: { operator: "equals", expected: "test" },
    });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("success");
  });

  it("assert equals — fails on mismatch", async () => {
    document.body.innerHTML = '<input id="target" value="test" />';
    const step = makeStep({
      action: "assert",
      assertion: { operator: "equals", expected: "other" },
    });

    const result = await executeStep(makePayload(step));

    assertFailed(result);
    expect(result.error).toContain("other");
  });

  it("assert contains — checks text content", async () => {
    document.body.innerHTML = '<div id="target">Hello World</div>';
    const step = makeStep({
      action: "assert",
      assertion: { operator: "contains", expected: "World" },
    });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("success");
  });

  it("skipped when no assertion config", async () => {
    const step = makeStep({
      action: "assert",
      assertion: undefined,
    });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("skipped");
  });
});

describe("executeStep — unknown action", () => {
  it("returns skipped for unknown action", async () => {
    const step = makeStep({ action: "unknown" as FlowStep["action"] });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("skipped");
  });
});

describe("executeStep — error handling", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns skipped for optional steps that fail", async () => {
    const step = makeStep({
      action: "click",
      selector: "#missing",
      optional: true,
    });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("skipped");
    if (result.status === "skipped") {
      expect(result.reason).toBeDefined();
    }
  });

  it("returns failed for required steps that fail", async () => {
    const step = makeStep({
      action: "click",
      selector: "#missing",
    });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.error).toBeDefined();
    }
  });
});

describe("executeStep — smart selectors", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("uses smart selectors when primary selector fails", async () => {
    document.body.innerHTML = '<button data-testid="btn">Click</button>';
    let clicked = false;
    document
      .querySelector("[data-testid='btn']")!
      .addEventListener("click", () => (clicked = true));

    const step = makeStep({
      action: "click",
      selector: "#nonexistent",
      smartSelectors: [
        { value: "[data-testid='btn']", strategy: "data-testid" },
      ],
    });

    const result = await executeStep(makePayload(step));

    expect(result.status).toBe("success");
    expect(clicked).toBe(true);
  });
});

describe("highlightElement", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("applies highlight outline and reverts after duration", () => {
    document.body.innerHTML = '<div id="target"></div>';
    const step = makeStep();

    highlightElement(step, 300);

    const el = document.querySelector("#target") as HTMLElement;
    expect(el.style.outline).toContain("#4285f4");
    expect(el.style.outline).toContain("3px");
    expect(el.style.outline).toContain("solid");

    vi.advanceTimersByTime(300);
    expect(el.style.outline).toBe("");
  });

  it("does nothing when durationMs <= 0", () => {
    document.body.innerHTML = '<div id="target"></div>';
    const step = makeStep();

    highlightElement(step, 0);

    const el = document.querySelector("#target") as HTMLElement;
    expect(el.style.outline).toBe("");
  });

  it("does nothing when element not found", () => {
    document.body.innerHTML = "";
    const step = makeStep({ selector: "#missing" });

    expect(() => highlightElement(step, 300)).not.toThrow();
  });
});
