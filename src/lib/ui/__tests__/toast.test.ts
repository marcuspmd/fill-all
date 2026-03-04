// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from "vitest";
import { showToast } from "../toast";

describe("toast.showToast", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("appends a toast element and removes it after timeout", () => {
    vi.useFakeTimers();
    showToast("Hello", "info");
    const t = document.querySelector(".toast") as HTMLElement;
    expect(t).toBeTruthy();
    expect(t.classList.contains("toast-info")).toBe(true);

    // advance past initial delay (2500) and fade (300)
    vi.advanceTimersByTime(2500 + 300 + 10);
    expect(document.querySelector(".toast")).toBeNull();
  });

  it("replaces existing toast when called again", () => {
    vi.useFakeTimers();
    showToast("First", "success");
    expect(document.querySelectorAll(".toast").length).toBe(1);
    showToast("Second", "error");
    expect(document.querySelectorAll(".toast").length).toBe(1);
    const t = document.querySelector(".toast")!;
    expect(t.textContent).toBe("Second");
  });

  it("uses success as default type when no type is provided", () => {
    showToast("Default type");
    const t = document.querySelector(".toast") as HTMLElement;
    expect(t).toBeTruthy();
    expect(t.classList.contains("toast-success")).toBe(true);
  });
});
