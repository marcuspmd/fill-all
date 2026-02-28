// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  renderTypeBadge,
  renderMethodBadge,
  renderConfidenceBadge,
  renderFieldsTableHeader,
  renderLogEntry,
  renderActionCard,
  renderTabBar,
} from "../renderers";

describe("renderers", () => {
  it("renderTypeBadge works", () => {
    const html = renderTypeBadge("email", "pre-");
    expect(html).toContain("pre-type-badge");
    expect(html).toContain("email");
  });

  it("renderMethodBadge works", () => {
    const html = renderMethodBadge("keyword");
    expect(html).toContain("keyword");
  });

  it("renderConfidenceBadge works", () => {
    const html = renderConfidenceBadge(0.8);
    expect(html).toContain("80%");
  });

  it("renderFieldsTableHeader works", () => {
    const html = renderFieldsTableHeader({ showActions: false });
    expect(html).not.toContain("<th>Ações</th>");
    const html2 = renderFieldsTableHeader({ showActions: true });
    expect(html2).toContain("<th>Ações</th>");
  });

  it("renderLogEntry works", () => {
    const html = renderLogEntry({ time: "10:00", text: "Hello", type: "info" });
    expect(html).toContain("10:00");
    expect(html).toContain("Hello");
  });

  it("renderActionCard works", () => {
    const html = renderActionCard({
      id: "btn",
      icon: "X",
      label: "Button",
      desc: "Desc",
      variant: "primary",
      active: true,
    });
    expect(html).toContain('id="btn"');
    expect(html).toContain("card-primary");
    expect(html).toContain(" active");
  });

  it("renderTabBar works", () => {
    const html = renderTabBar([{ id: "t1", label: "T1", active: true }]);
    expect(html).toContain('data-tab="t1"');
    expect(html).toContain("active");
  });
});
