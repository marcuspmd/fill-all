// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { initTabs } from "../tabs";

describe("tabs.initTabs", () => {
  it("activates correct content on tab click", () => {
    document.body.innerHTML = `
      <button class="tab" data-tab="one">One</button>
      <button class="tab" data-tab="two">Two</button>
      <div id="tab-one" class="tab-content">One</div>
      <div id="tab-two" class="tab-content">Two</div>
    `;

    initTabs();

    const tabs = Array.from(document.querySelectorAll<HTMLElement>(".tab"));
    const contents = Array.from(
      document.querySelectorAll<HTMLElement>(".tab-content"),
    );

    // click second tab
    tabs[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(tabs[1].classList.contains("active")).toBe(true);
    expect(contents[1].classList.contains("active")).toBe(true);
    // first tab should be inactive
    expect(tabs[0].classList.contains("active")).toBe(false);
    expect(contents[0].classList.contains("active")).toBe(false);
  });

  it("does nothing when clicked tab has no data-tab attribute", () => {
    document.body.innerHTML = `
      <button class="tab">No Data</button>
      <div id="tab-none" class="tab-content">None</div>
    `;

    initTabs();

    const tab = document.querySelector<HTMLElement>(".tab")!;
    // Should not throw
    expect(() =>
      tab.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    ).not.toThrow();
  });

  it("activates tab even when matching content element does not exist", () => {
    document.body.innerHTML = `
      <button class="tab" data-tab="missing">Missing</button>
    `;

    initTabs();

    const tab = document.querySelector<HTMLElement>(".tab")!;
    // Should not throw even though #tab-missing doesn't exist
    expect(() =>
      tab.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    ).not.toThrow();
    expect(tab.classList.contains("active")).toBe(true);
  });
});
