// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  getRecordingSession,
  getRecordingStatus,
  addManualStep,
  getCapturedResponses,
  setOnStepAdded,
  setOnStepUpdated,
  removeStep,
  updateStep,
  clearSession,
} from "@/lib/e2e-export/action-recorder";
import type { RecordedStep } from "@/lib/e2e-export/e2e-export.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInput(attrs: Record<string, string> = {}): HTMLInputElement {
  const el = document.createElement("input");
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  document.body.appendChild(el);
  return el;
}

function makeSelect(
  attrs: Record<string, string> = {},
  options: string[] = [],
): HTMLSelectElement {
  const sel = document.createElement("select");
  Object.entries(attrs).forEach(([k, v]) => sel.setAttribute(k, v));
  for (const optVal of options) {
    const opt = document.createElement("option");
    opt.value = optVal;
    opt.textContent = optVal;
    sel.appendChild(opt);
  }
  document.body.appendChild(sel);
  return sel;
}

function makeButton(
  text: string,
  attrs: Record<string, string> = {},
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.textContent = text;
  Object.entries(attrs).forEach(([k, v]) => btn.setAttribute(k, v));
  document.body.appendChild(btn);
  return btn;
}

function fireInput(el: HTMLElement): void {
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function fireChange(el: HTMLElement): void {
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function fireClick(el: HTMLElement): void {
  el.dispatchEvent(new Event("click", { bubbles: true }));
}

function fireSubmit(form: HTMLFormElement): void {
  form.dispatchEvent(new Event("submit", { bubbles: true }));
}

function fireKeyDown(el: HTMLElement, key: string): void {
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("action-recorder", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    stopRecording();
    vi.useRealTimers();
  });

  // ── Session lifecycle ──────────────────────────────────────────────

  describe("session lifecycle", () => {
    it("starts a recording session with initial navigate step", () => {
      const session = startRecording();

      expect(session.status).toBe("recording");
      expect(session.startUrl).toBe(window.location.href);
      expect(session.steps).toHaveLength(1);
      expect(session.steps[0].type).toBe("navigate");
      expect(session.steps[0].url).toBe(window.location.href);
    });

    it("stops recording and returns final session", () => {
      startRecording();
      const result = stopRecording();

      expect(result).not.toBeNull();
      expect(result!.status).toBe("stopped");
      // Session is preserved after stop so it can be exported;
      // only clearSession() / startRecording() resets it to null.
      expect(getRecordingSession()).not.toBeNull();
      expect(getRecordingSession()!.status).toBe("stopped");
    });

    it("returns null when stopping without active session", () => {
      expect(stopRecording()).toBeNull();
    });

    it("pauses and resumes recording", () => {
      startRecording();

      pauseRecording();
      expect(getRecordingStatus()).toBe("paused");

      resumeRecording();
      expect(getRecordingStatus()).toBe("recording");
    });

    it("returns null when pausing without active session", () => {
      expect(pauseRecording()).toBeNull();
    });

    it("returns null when resuming non-paused session", () => {
      startRecording();
      expect(resumeRecording()).toBeNull();
    });

    it("getRecordingStatus returns stopped when no session", () => {
      expect(getRecordingStatus()).toBe("stopped");
    });

    it("starting a new recording stops the previous one", () => {
      startRecording();
      const second = startRecording();

      expect(second.steps).toHaveLength(1);
      expect(second.status).toBe("recording");
    });
  });

  // ── Input capture ──────────────────────────────────────────────────

  describe("input capture", () => {
    it("captures text input as fill step", () => {
      startRecording();
      const input = makeInput({ id: "name", type: "text" });
      input.value = "John";
      fireInput(input);

      const session = getRecordingSession()!;
      const fillSteps = session.steps.filter((s) => s.type === "fill");
      expect(fillSteps).toHaveLength(1);
      expect(fillSteps[0].value).toBe("John");
      expect(fillSteps[0].selector).toBe("#name");
    });

    it("debounces rapid typing into same field", () => {
      startRecording();
      const input = makeInput({ id: "name", type: "text" });

      input.value = "J";
      fireInput(input);
      input.value = "Jo";
      fireInput(input);
      input.value = "Joh";
      fireInput(input);
      input.value = "John";
      fireInput(input);

      const session = getRecordingSession()!;
      const fillSteps = session.steps.filter((s) => s.type === "fill");
      expect(fillSteps).toHaveLength(1);
      expect(fillSteps[0].value).toBe("John");
    });

    it("captures select change as select step", () => {
      startRecording();
      const select = makeSelect({ id: "state", name: "state" }, [
        "",
        "SP",
        "RJ",
      ]);
      select.value = "SP";
      fireInput(select);

      const session = getRecordingSession()!;
      const selectSteps = session.steps.filter((s) => s.type === "select");
      expect(selectSteps).toHaveLength(1);
      expect(selectSteps[0].value).toBe("SP");
    });

    it("captures checkbox toggle as check/uncheck steps", () => {
      startRecording();
      const cb = makeInput({ id: "agree", type: "checkbox" });

      (cb as HTMLInputElement).checked = true;
      fireInput(cb);

      vi.advanceTimersByTime(600);

      (cb as HTMLInputElement).checked = false;
      fireInput(cb);

      const session = getRecordingSession()!;
      const checkSteps = session.steps.filter(
        (s) => s.type === "check" || s.type === "uncheck",
      );
      expect(checkSteps).toHaveLength(2);
      expect(checkSteps[0].type).toBe("check");
      expect(checkSteps[1].type).toBe("uncheck");
    });

    it("captures radio button as check step with value", () => {
      startRecording();
      const radio = makeInput({
        name: "gender",
        type: "radio",
        value: "male",
      });
      (radio as HTMLInputElement).checked = true;
      fireInput(radio);

      const session = getRecordingSession()!;
      const checkSteps = session.steps.filter((s) => s.type === "check");
      expect(checkSteps).toHaveLength(1);
      expect(checkSteps[0].value).toBe("male");
    });

    it("ignores input events when paused", () => {
      startRecording();
      pauseRecording();

      const input = makeInput({ id: "name" });
      input.value = "ignored";
      fireInput(input);

      const session = getRecordingSession()!;
      expect(session.steps.filter((s) => s.type === "fill")).toHaveLength(0);
    });
  });

  // ── Click capture ──────────────────────────────────────────────────

  describe("click capture", () => {
    it("captures non-field click as click step", () => {
      startRecording();
      const btn = makeButton("Next", { type: "button" });
      fireClick(btn);

      const session = getRecordingSession()!;
      const clickSteps = session.steps.filter((s) => s.type === "click");
      expect(clickSteps).toHaveLength(1);
      expect(clickSteps[0].label).toBe("Next");
    });

    it("captures submit button click as submit step", () => {
      startRecording();
      const btn = makeButton("Submit", { type: "submit" });
      fireClick(btn);

      const session = getRecordingSession()!;
      const submitSteps = session.steps.filter((s) => s.type === "submit");
      expect(submitSteps).toHaveLength(1);
      expect(submitSteps[0].label).toBe("Submit");
    });

    it("ignores clicks on form fields (handled by input)", () => {
      startRecording();
      const input = makeInput({ id: "email", type: "text" });
      fireClick(input);

      const session = getRecordingSession()!;
      const clickSteps = session.steps.filter((s) => s.type === "click");
      expect(clickSteps).toHaveLength(0);
    });
  });

  // ── Form submit capture ────────────────────────────────────────────

  describe("form submit", () => {
    it("captures form submit event", () => {
      startRecording();
      const form = document.createElement("form");
      form.setAttribute("action", "/api/register");
      document.body.appendChild(form);
      fireSubmit(form);

      const session = getRecordingSession()!;
      const submitSteps = session.steps.filter((s) => s.type === "submit");
      expect(submitSteps).toHaveLength(1);
      expect(submitSteps[0].url).toBe("/api/register");
    });

    it("avoids duplicate submit when button click just fired", () => {
      startRecording();
      const form = document.createElement("form");
      document.body.appendChild(form);
      const btn = document.createElement("button");
      btn.type = "submit";
      btn.textContent = "Save";
      form.appendChild(btn);

      fireClick(btn);
      fireSubmit(form);

      const session = getRecordingSession()!;
      const submitSteps = session.steps.filter((s) => s.type === "submit");
      expect(submitSteps).toHaveLength(1);
    });
  });

  // ── Key press capture ──────────────────────────────────────────────

  describe("key press capture", () => {
    it("captures Enter key press", () => {
      startRecording();
      const input = makeInput({ id: "search" });
      fireKeyDown(input, "Enter");

      const session = getRecordingSession()!;
      const keySteps = session.steps.filter((s) => s.type === "press-key");
      expect(keySteps).toHaveLength(1);
      expect(keySteps[0].key).toBe("Enter");
    });

    it("captures Tab key press", () => {
      startRecording();
      const input = makeInput({ id: "name" });
      fireKeyDown(input, "Tab");

      const session = getRecordingSession()!;
      const keySteps = session.steps.filter((s) => s.type === "press-key");
      expect(keySteps).toHaveLength(1);
      expect(keySteps[0].key).toBe("Tab");
    });

    it("captures Escape key press", () => {
      startRecording();
      fireKeyDown(document.body, "Escape");

      const session = getRecordingSession()!;
      const keySteps = session.steps.filter((s) => s.type === "press-key");
      expect(keySteps).toHaveLength(1);
      expect(keySteps[0].key).toBe("Escape");
    });

    it("ignores non-meaningful keys", () => {
      startRecording();
      const input = makeInput({ id: "name" });
      fireKeyDown(input, "a");
      fireKeyDown(input, "Shift");
      fireKeyDown(input, "ArrowDown");

      const session = getRecordingSession()!;
      const keySteps = session.steps.filter((s) => s.type === "press-key");
      expect(keySteps).toHaveLength(0);
    });
  });

  // ── Manual step ────────────────────────────────────────────────────

  describe("addManualStep", () => {
    it("adds a custom step to the recording", () => {
      startRecording();
      const step: RecordedStep = {
        type: "assert",
        timestamp: Date.now(),
        selector: "#result",
        value: "Success",
        label: "Verify result",
      };
      addManualStep(step);

      const session = getRecordingSession()!;
      const assertSteps = session.steps.filter((s) => s.type === "assert");
      expect(assertSteps).toHaveLength(1);
      expect(assertSteps[0].value).toBe("Success");
    });

    it("does not add step when not recording", () => {
      const step: RecordedStep = {
        type: "fill",
        timestamp: Date.now(),
        selector: "#name",
        value: "test",
      };
      // addManualStep is a no-op unless a recording is active
      addManualStep(step);

      expect(getRecordingStatus()).toBe("stopped");
    });
  });

  // ── Cleanup ────────────────────────────────────────────────────────

  describe("cleanup", () => {
    it("removes all event listeners on stop", () => {
      startRecording();
      stopRecording();

      const stepsBeforeInteraction = getRecordingSession()!.steps.length;

      // After stopping, new interactions should not create steps
      const input = makeInput({ id: "after-stop" });
      input.value = "test";
      fireInput(input);

      // Stopped session is preserved for export, but no new steps were added
      expect(getRecordingSession()!.steps.length).toBe(stepsBeforeInteraction);
    });

    it("handles multiple start/stop cycles cleanly", () => {
      startRecording();
      stopRecording();

      const session2 = startRecording();
      expect(session2.steps).toHaveLength(1);

      const input = makeInput({ id: "field" });
      input.value = "v";
      fireInput(input);

      const result = stopRecording();
      expect(result!.steps).toHaveLength(2); // navigate + fill
    });
  });

  // ── Selector resolution ────────────────────────────────────────────

  describe("selector resolution", () => {
    it("uses id-based selector when available", () => {
      startRecording();
      const input = makeInput({ id: "email", type: "email" });
      input.value = "test@test.com";
      fireInput(input);

      const session = getRecordingSession()!;
      const fill = session.steps.find((s) => s.type === "fill")!;
      expect(fill.selector).toBe("#email");
    });

    it("uses data-testid selector when available", () => {
      startRecording();
      const input = makeInput({ "data-testid": "my-input", type: "text" });
      input.value = "hello";
      fireInput(input);

      const session = getRecordingSession()!;
      const fill = session.steps.find((s) => s.type === "fill")!;
      expect(fill.selector).toBe('[data-testid="my-input"]');
    });

    it("uses name-based selector as fallback", () => {
      startRecording();
      const input = makeInput({ name: "username", type: "text" });
      input.value = "user1";
      fireInput(input);

      const session = getRecordingSession()!;
      const fill = session.steps.find((s) => s.type === "fill")!;
      expect(fill.selector).toBe('input[name="username"]');
    });
  });

  // ── Label resolution ───────────────────────────────────────────────

  describe("label resolution", () => {
    it("resolves label from for attribute", () => {
      startRecording();
      const label = document.createElement("label");
      label.setAttribute("for", "fullname");
      label.textContent = "Full Name";
      document.body.appendChild(label);

      const input = makeInput({ id: "fullname", type: "text" });
      input.value = "Jane Doe";
      fireInput(input);

      const session = getRecordingSession()!;
      const fill = session.steps.find((s) => s.type === "fill")!;
      expect(fill.label).toBe("Full Name");
    });

    it("resolves label from aria-label", () => {
      startRecording();
      const input = makeInput({ "aria-label": "Search query", type: "text" });
      input.value = "test";
      fireInput(input);

      const session = getRecordingSession()!;
      const fill = session.steps.find((s) => s.type === "fill")!;
      expect(fill.label).toBe("Search query");
    });

    it("resolves label from placeholder", () => {
      startRecording();
      const input = makeInput({
        placeholder: "Enter your email",
        type: "text",
      });
      input.value = "hello@test.com";
      fireInput(input);

      const session = getRecordingSession()!;
      const fill = session.steps.find((s) => s.type === "fill")!;
      expect(fill.label).toBe("Enter your email");
    });
  });

  // ── Extension UI filtering ─────────────────────────────────────────

  describe("extension UI filtering", () => {
    it("ignores input events from elements inside #fill-all-notification", () => {
      startRecording();
      const panel = document.createElement("div");
      panel.id = "fill-all-notification";
      document.body.appendChild(panel);

      const input = document.createElement("input");
      input.type = "text";
      input.id = "panel-input";
      panel.appendChild(input);
      input.value = "ignored";
      fireInput(input);

      const session = getRecordingSession()!;
      const fillSteps = session.steps.filter((s) => s.type === "fill");
      expect(fillSteps).toHaveLength(0);
    });

    it("ignores click events on extension UI elements", () => {
      startRecording();
      const btn = document.createElement("button");
      btn.id = "fa-btn-record";
      btn.textContent = "Record";
      document.body.appendChild(btn);

      fireClick(btn);

      const session = getRecordingSession()!;
      const clickSteps = session.steps.filter((s) => s.type === "click");
      expect(clickSteps).toHaveLength(0);
    });

    it("ignores clicks on elements inside extension UI containers", () => {
      startRecording();
      const dialog = document.createElement("div");
      dialog.classList.add("fa-record-dialog");
      document.body.appendChild(dialog);

      const innerBtn = document.createElement("button");
      innerBtn.textContent = "Export";
      dialog.appendChild(innerBtn);

      fireClick(innerBtn);

      const session = getRecordingSession()!;
      const clickSteps = session.steps.filter((s) => s.type === "click");
      expect(clickSteps).toHaveLength(0);
    });

    it("ignores keydown events on extension UI elements", () => {
      startRecording();
      const container = document.createElement("div");
      container.id = "fill-all-record-indicator";
      document.body.appendChild(container);

      const input = document.createElement("input");
      container.appendChild(input);
      fireKeyDown(input, "Enter");

      const session = getRecordingSession()!;
      const keySteps = session.steps.filter((s) => s.type === "press-key");
      expect(keySteps).toHaveLength(0);
    });

    it("ignores submit events on extension UI forms", () => {
      startRecording();
      const panel = document.createElement("div");
      panel.id = "fill-all-field-icon";
      document.body.appendChild(panel);

      const form = document.createElement("form");
      panel.appendChild(form);
      fireSubmit(form);

      const session = getRecordingSession()!;
      const submitSteps = session.steps.filter((s) => s.type === "submit");
      expect(submitSteps).toHaveLength(0);
    });

    it("ignores change events on extension UI selects", () => {
      startRecording();
      const overlay = document.createElement("div");
      overlay.classList.add("fa-record-overlay");
      document.body.appendChild(overlay);

      const select = document.createElement("select");
      overlay.appendChild(select);
      const opt = document.createElement("option");
      opt.value = "test";
      select.appendChild(opt);
      select.value = "test";
      fireChange(select);

      const session = getRecordingSession()!;
      const selectSteps = session.steps.filter((s) => s.type === "select");
      expect(selectSteps).toHaveLength(0);
    });

    it("still captures events on regular page elements", () => {
      startRecording();
      const input = makeInput({ id: "normal-field", type: "text" });
      input.value = "captured";
      fireInput(input);

      const session = getRecordingSession()!;
      const fillSteps = session.steps.filter((s) => s.type === "fill");
      expect(fillSteps).toHaveLength(1);
      expect(fillSteps[0].value).toBe("captured");
    });
  });

  // ── Network monitoring ─────────────────────────────────────────────

  describe("network monitoring", () => {
    let origFetchRef: typeof globalThis.fetch;

    beforeEach(() => {
      origFetchRef = globalThis.fetch;
    });

    afterEach(() => {
      // Ensure fetch is restored even if stop didn't run
      if (globalThis.fetch !== origFetchRef) {
        globalThis.fetch = origFetchRef;
      }
    });

    it("intercepts fetch and restores it on stop", () => {
      const beforeFetch = globalThis.fetch;
      startRecording();

      // fetch should be patched now
      expect(globalThis.fetch).not.toBe(beforeFetch);

      stopRecording();

      // fetch should be restored
      expect(globalThis.fetch).toBe(beforeFetch);
    });

    it("captures HTTP responses via fetch", async () => {
      // Mock fetch to resolve immediately
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
      } as Response);
      globalThis.fetch = mockFetch;

      startRecording();

      // The recorder patches fetch, so calling it captures the response
      await globalThis.fetch("/api/data");

      const responses = getCapturedResponses();
      expect(responses).toHaveLength(1);
      expect(responses[0].url).toBe("/api/data");
      expect(responses[0].method).toBe("GET");
      expect(responses[0].status).toBe(200);
    });

    it("captures POST method correctly", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 201,
        ok: true,
      } as Response);
      globalThis.fetch = mockFetch;

      startRecording();

      await globalThis.fetch("/api/users", { method: "POST" });

      const responses = getCapturedResponses();
      expect(responses).toHaveLength(1);
      expect(responses[0].method).toBe("POST");
      expect(responses[0].status).toBe(201);
    });

    it("captures failed fetch with status 0", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("network error"));
      globalThis.fetch = mockFetch;

      startRecording();

      try {
        await globalThis.fetch("/api/fail");
      } catch {
        // expected
      }

      const responses = getCapturedResponses();
      expect(responses).toHaveLength(1);
      expect(responses[0].status).toBe(0);
    });

    it("clears captured responses on stop", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
      } as Response);
      globalThis.fetch = mockFetch;

      startRecording();
      await globalThis.fetch("/api/data");
      expect(getCapturedResponses()).toHaveLength(1);

      stopRecording();
      expect(getCapturedResponses()).toHaveLength(0);
    });

    it("inserts wait-for-network-idle step after requests settle", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
      } as Response);
      globalThis.fetch = mockFetch;

      startRecording();

      // Trigger a user action first (network idle only fires after recent user action)
      const input = makeInput({ id: "trigger", type: "text" });
      input.value = "typed";
      fireInput(input);

      await globalThis.fetch("/api/search?q=typed");

      // Advance past NETWORK_IDLE_THRESHOLD_MS (500ms)
      await vi.advanceTimersByTimeAsync(600);

      const session = getRecordingSession()!;
      const idleSteps = session.steps.filter(
        (s) => s.type === "wait-for-network-idle",
      );
      expect(idleSteps).toHaveLength(1);
      expect(idleSteps[0].label).toContain("network");
    });

    it("returns a copy of captured responses (not the internal array)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
      } as Response);
      globalThis.fetch = mockFetch;

      startRecording();
      await globalThis.fetch("/api/data");

      const responses1 = getCapturedResponses();
      const responses2 = getCapturedResponses();
      expect(responses1).not.toBe(responses2);
      expect(responses1).toEqual(responses2);
    });

    it("does not insert network-idle step when last action was too long ago", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
      } as Response);
      globalThis.fetch = mockFetch;

      startRecording();

      // Advance time enough that the "last user action" is considered stale (>10s)
      await vi.advanceTimersByTimeAsync(15_000);

      await globalThis.fetch("/api/search");

      // Advance past NETWORK_IDLE_THRESHOLD_MS (500ms)
      await vi.advanceTimersByTimeAsync(600);

      const s = getRecordingSession()!;
      const idleSteps = s.steps.filter(
        (st) => st.type === "wait-for-network-idle",
      );
      expect(idleSteps).toHaveLength(0);
    });

    it("skips fetch tracking when not recording", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ status: 200 } as Response);
      globalThis.fetch = mockFetch;

      startRecording();
      pauseRecording();

      // Fetch while paused — should not be tracked
      await globalThis.fetch("/api/data");

      expect(getCapturedResponses()).toHaveLength(0);
    });

    it("intercepts fetch with URL object as input", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ status: 200 } as Response);
      globalThis.fetch = mockFetch;

      startRecording();
      await globalThis.fetch(new URL("https://example.com/api"));

      const responses = getCapturedResponses();
      expect(responses[0].url).toBe("https://example.com/api");
    });

    it("intercepts fetch with Request object as input", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ status: 200 } as Response);
      globalThis.fetch = mockFetch;

      startRecording();
      await globalThis.fetch(new Request("https://example.com/request"));

      const responses = getCapturedResponses();
      expect(responses[0].url).toBe("https://example.com/request");
    });
  });

  // ── XHR monitoring ─────────────────────────────────────────────────

  describe("XHR monitoring", () => {
    it("intercepts XHR and captures response on loadend", async () => {
      startRecording();

      const xhr = new XMLHttpRequest();
      xhr.open("GET", "/api/xhr-test");
      xhr.send();

      // Manually fire loadend to simulate completion
      Object.defineProperty(xhr, "status", { value: 200 });
      xhr.dispatchEvent(new Event("loadend"));

      await vi.advanceTimersByTimeAsync(10);

      const responses = getCapturedResponses();
      expect(responses.some((r) => r.url === "/api/xhr-test")).toBe(true);
      expect(responses.find((r) => r.url === "/api/xhr-test")?.method).toBe(
        "GET",
      );
    });

    it("restores XHR prototype on stop", () => {
      const origOpen = XMLHttpRequest.prototype.open;
      const origSend = XMLHttpRequest.prototype.send;

      startRecording();

      // Should be patched
      expect(XMLHttpRequest.prototype.open).not.toBe(origOpen);

      stopRecording();

      // Should be restored
      expect(XMLHttpRequest.prototype.open).toBe(origOpen);
      expect(XMLHttpRequest.prototype.send).toBe(origSend);
    });

    it("does not track XHR when session is not recording", () => {
      startRecording();
      pauseRecording();

      const xhr = new XMLHttpRequest();
      xhr.open("GET", "/api/paused");
      xhr.send();

      expect(getCapturedResponses()).toHaveLength(0);
    });
  });

  // ── Navigation event handlers ────────────────────────────────────

  describe("navigation event handlers", () => {
    it("onBeforeUnload adds a navigate step", () => {
      startRecording();
      window.dispatchEvent(new Event("beforeunload"));

      const s = getRecordingSession()!;
      const navSteps = s.steps.filter((st) => st.type === "navigate");
      expect(navSteps.length).toBeGreaterThanOrEqual(2); // initial + beforeunload
      expect(navSteps[navSteps.length - 1].label).toBe("Page navigation");
    });

    it("onBeforeUnload is ignored when not recording", () => {
      startRecording();
      pauseRecording();

      const s = getRecordingSession()!;
      const countBefore = s.steps.length;

      window.dispatchEvent(new Event("beforeunload"));

      expect(s.steps.length).toBe(countBefore);
    });

    it("onHashChange adds a wait-for-url step with hash value", () => {
      startRecording();
      window.dispatchEvent(new HashChangeEvent("hashchange"));

      const s = getRecordingSession()!;
      const hashSteps = s.steps.filter((st) => st.type === "wait-for-url");
      expect(hashSteps.length).toBeGreaterThanOrEqual(1);
      expect(hashSteps[hashSteps.length - 1].label).toContain("hash");
    });

    it("onHashChange is ignored when not recording", () => {
      startRecording();
      pauseRecording();

      const s = getRecordingSession()!;
      const countBefore = s.steps.length;

      window.dispatchEvent(new HashChangeEvent("hashchange"));

      expect(s.steps.length).toBe(countBefore);
    });

    it("onPopState adds a wait-for-url step", () => {
      startRecording();
      window.dispatchEvent(new PopStateEvent("popstate"));

      const s = getRecordingSession()!;
      const popSteps = s.steps.filter((st) => st.type === "wait-for-url");
      expect(popSteps.length).toBeGreaterThanOrEqual(1);
      expect(popSteps[popSteps.length - 1].label).toContain("popstate");
    });

    it("onPopState is ignored when not recording", () => {
      startRecording();
      pauseRecording();

      const s = getRecordingSession()!;
      const countBefore = s.steps.length;

      window.dispatchEvent(new PopStateEvent("popstate"));

      expect(s.steps.length).toBe(countBefore);
    });
  });

  // ── Step management API ─────────────────────────────────────────────

  describe("step management API", () => {
    it("setOnStepAdded callback fires when step is added", () => {
      const cb = vi.fn();
      setOnStepAdded(cb);
      startRecording();

      const input = makeInput({ id: "name", type: "text" });
      input.value = "Alice";
      fireInput(input);

      expect(cb).toHaveBeenCalled();
      const [step, index] = cb.mock.calls[cb.mock.calls.length - 1];
      expect(step.type).toBe("fill");
      expect(typeof index).toBe("number");

      setOnStepAdded(null);
    });

    it("setOnStepAdded(null) clears the callback", () => {
      const cb = vi.fn();
      setOnStepAdded(cb);
      setOnStepAdded(null);
      startRecording();

      const input = makeInput({ type: "text" });
      input.value = "test";
      fireInput(input);

      expect(cb).not.toHaveBeenCalled();
    });

    it("setOnStepUpdated callback fires when debounced step is updated", () => {
      const cb = vi.fn();
      setOnStepUpdated(cb);
      startRecording();

      const input = makeInput({ id: "u", type: "text" });

      // First input
      input.value = "a";
      fireInput(input);

      // Second rapid input — triggers debounce update callback
      input.value = "ab";
      fireInput(input);

      expect(cb).toHaveBeenCalled();
      const [step] = cb.mock.calls[0];
      expect(step.value).toBe("ab");

      setOnStepUpdated(null);
    });

    it("setOnStepUpdated(null) clears the callback", () => {
      const cb = vi.fn();
      setOnStepUpdated(cb);
      setOnStepUpdated(null);
      startRecording();

      const input = makeInput({ id: "x", type: "text" });
      input.value = "a";
      fireInput(input);
      input.value = "ab";
      fireInput(input);

      expect(cb).not.toHaveBeenCalled();
    });

    it("removeStep removes step at given index", () => {
      startRecording();

      const input = makeInput({ type: "text" });
      input.value = "hello";
      fireInput(input);

      const s = getRecordingSession()!;
      const lenBefore = s.steps.length;
      const result = removeStep(lenBefore - 1);

      expect(result).toBe(true);
      expect(s.steps.length).toBe(lenBefore - 1);
    });

    it("removeStep returns false for invalid index", () => {
      startRecording();

      expect(removeStep(-1)).toBe(false);
      expect(removeStep(999)).toBe(false);
    });

    it("removeStep returns false when no active session", () => {
      // removeStep operates on the active (recording) session, not the stopped one
      expect(removeStep(0)).toBe(false);
    });

    it("updateStep patches value and waitTimeout", () => {
      startRecording();

      const input = makeInput({ type: "text" });
      input.value = "original";
      fireInput(input);

      const s = getRecordingSession()!;
      const idx = s.steps.length - 1;

      const result = updateStep(idx, { value: "updated", waitTimeout: 3000 });

      expect(result).toBe(true);
      expect(s.steps[idx].value).toBe("updated");
      expect(s.steps[idx].waitTimeout).toBe(3000);
    });

    it("updateStep fires onStepUpdatedCallback", () => {
      const cb = vi.fn();
      setOnStepUpdated(cb);
      startRecording();

      const input = makeInput({ type: "text" });
      input.value = "v";
      fireInput(input);

      const s = getRecordingSession()!;
      updateStep(s.steps.length - 1, { value: "new" });

      expect(cb).toHaveBeenCalled();
      setOnStepUpdated(null);
    });

    it("updateStep returns false for invalid index", () => {
      startRecording();
      expect(updateStep(-1, { value: "x" })).toBe(false);
      expect(updateStep(999, { value: "x" })).toBe(false);
    });

    it("updateStep returns false when no session", () => {
      expect(updateStep(0, { value: "x" })).toBe(false);
    });

    it("clearSession resets session to null", () => {
      startRecording();
      expect(getRecordingSession()).not.toBeNull();

      clearSession();

      expect(getRecordingSession()).toBeNull();
      expect(getCapturedResponses()).toHaveLength(0);
    });

    it("clearSession with no active session is safe", () => {
      // No session running
      expect(() => clearSession()).not.toThrow();
      expect(getRecordingSession()).toBeNull();
    });
  });

  // ── Label resolution — parentLabel branch ──────────────────────────

  describe("resolveLabel — parentLabel branch", () => {
    it("resolves label when input is wrapped directly inside a label", () => {
      const label = document.createElement("label");
      label.textContent = "Username";
      const input = document.createElement("input");
      input.type = "text";
      label.appendChild(input);
      document.body.appendChild(label);

      startRecording();
      input.value = "alice";
      fireInput(input);

      const s = getRecordingSession()!;
      const fillStep = s.steps.find((st) => st.type === "fill");
      expect(fillStep?.label).toBe("Username");
    });
  });

  // ── Input event from non-form-field elements ──────────────────────

  describe("input event from non-form-field elements", () => {
    it("ignores input events on non-form elements (div)", () => {
      startRecording();
      const div = document.createElement("div");
      document.body.appendChild(div);

      div.dispatchEvent(new Event("input", { bubbles: true }));

      const s = getRecordingSession()!;
      // Only the initial navigate step
      expect(s.steps).toHaveLength(1);
    });
  });

  // ── onChange edge cases ───────────────────────────────────────────

  describe("onChange edge cases", () => {
    it("ignores change events on non-select elements", () => {
      startRecording();
      const input = makeInput({ type: "text" });
      input.dispatchEvent(new Event("change", { bubbles: true }));

      const s = getRecordingSession()!;
      expect(s.steps).toHaveLength(1);
    });

    it("updates existing select step value when same selector fires change again", () => {
      const sel = makeSelect({ id: "country" }, ["us", "br"]);
      startRecording();

      // First — add a select step via onInput (or onChange)
      sel.value = "us";
      fireChange(sel); // adds select step

      const s = getRecordingSession()!;
      const selectStepsBefore = s.steps.filter((st) => st.type === "select");
      expect(selectStepsBefore).toHaveLength(1);

      // Second change on same selector — should UPDATE in place, not add new step
      sel.value = "br";
      fireChange(sel);

      const selectStepsAfter = s.steps.filter((st) => st.type === "select");
      expect(selectStepsAfter).toHaveLength(1);
      expect(selectStepsAfter[0].value).toBe("br");
    });
  });

  // ── onClick — submit input type ─────────────────────────────────

  describe("onClick — HTMLInputElement submit", () => {
    it("input[type=submit] is handled by isFormField (onClick early-exits)", () => {
      // input[type=submit] matches FORM_FIELD_SELECTOR so onClick returns early.
      // The submit detection for HTMLInputElement inside onClick is dead code;
      // button[type=submit] is the supported path (tested in click-capture suite).
      startRecording();

      const submitInput = makeInput({ type: "submit", value: "Go" });
      fireClick(submitInput);

      const s = getRecordingSession()!;
      // No submit step — input[type=submit] treated as form field, not a submit trigger
      const submitStep = s.steps.find((st) => st.type === "submit");
      expect(submitStep).toBeUndefined();
    });
  });

  // ── onInput — select element via input event ─────────────────────

  describe("onInput — select element fires input event", () => {
    it("captures select step from input event on select element", () => {
      const sel = makeSelect({ id: "lang" }, ["en", "pt"]);
      startRecording();

      sel.value = "pt";
      fireInput(sel);

      const s = getRecordingSession()!;
      const step = s.steps.find((st) => st.type === "select");
      expect(step).toBeDefined();
      expect(step?.value).toBe("pt");
    });
  });

  // ── Mutation observer ──────────────────────────────────────────────

  describe("mutation observer", () => {
    it("inserts wait-for-element step when a new visible form field appears", async () => {
      startRecording();

      // Dynamically add a new input to trigger MutationObserver
      const newInput = document.createElement("input");
      newInput.type = "text";
      newInput.id = "dynamic-field";
      document.body.appendChild(newInput);

      // Wait for MutationObserver callback + debounce
      await vi.advanceTimersByTimeAsync(500);

      const s = getRecordingSession()!;
      const waitStep = s.steps.find((st) => st.type === "wait-for-element");
      expect(waitStep).toBeDefined();
      expect(waitStep?.label).toContain("field");
    });

    it("inserts wait-for-hidden step when a spinner element is removed", async () => {
      // Add a spinner first, then record + remove it
      const spinner = document.createElement("div");
      spinner.className = "spinner";
      document.body.appendChild(spinner);

      startRecording();

      // Remove the spinner to trigger the MutationObserver
      document.body.removeChild(spinner);

      await vi.advanceTimersByTimeAsync(500);

      const s = getRecordingSession()!;
      const waitHiddenStep = s.steps.find(
        (st) => st.type === "wait-for-hidden",
      );
      expect(waitHiddenStep).toBeDefined();
      expect(waitHiddenStep?.label).toContain("loading");
    });

    it("does not process mutations when paused", async () => {
      startRecording();
      pauseRecording();

      const newInput = document.createElement("input");
      newInput.type = "text";
      document.body.appendChild(newInput);

      await vi.advanceTimersByTimeAsync(500);

      const s = getRecordingSession()!;
      expect(
        s.steps.filter((st) => st.type === "wait-for-element"),
      ).toHaveLength(0);
    });
  });
});
