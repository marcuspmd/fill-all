// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { SavedForm } from "@/types";
import {
  renderTypeBadge,
  renderMethodBadge,
  renderConfidenceBadge,
  renderFieldsTableHeader,
  renderFieldRow,
  renderFormCard,
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

  it("renderFieldRow renders with all options", () => {
    const field = {
      selector: "#myfield",
      id: "myfield",
      name: "myfield",
      label: "My Field",
      fieldType: "email" as const,
      contextualType: undefined,
      detectionMethod: "keyword" as const,
      detectionConfidence: 0.9,
    };
    const html = renderFieldRow(field, 1, { prefix: "p-", showActions: true });
    expect(html).toContain("p-cell-num");
    expect(html).toContain("1");
    expect(html).toContain("myfield");
    expect(html).toContain("My Field");
  });

  it("renderFieldRow with ignored selector", () => {
    const field = {
      selector: "#ignored",
      id: "ignored",
      name: "ignored",
      label: "Ignored",
      fieldType: "text" as const,
      contextualType: undefined,
      detectionMethod: undefined,
      detectionConfidence: undefined,
    };
    const html = renderFieldRow(field, 2, {
      ignoredSelectors: new Set(["#ignored"]),
      showActions: false,
    });
    expect(html).toContain("row-ignored");
    expect(html).not.toContain("cell-actions");
  });

  it("renderFieldRow uses contextualType when present", () => {
    const field = {
      selector: "#f",
      id: "f",
      name: "f",
      label: "F",
      fieldType: "unknown" as const,
      contextualType: "cpf" as const,
      detectionMethod: "html-type" as const,
      detectionConfidence: 1,
    };
    const html = renderFieldRow(field, 3);
    expect(html).toContain("cpf");
  });

  it("renderFormCard renders with prefix", () => {
    const form: SavedForm = {
      id: "form-1",
      name: "My Form",
      urlPattern: "*example.com*",
      fields: { "#a": "value1", "#b": "value2" },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const html = renderFormCard(form, "pre-");
    expect(html).toContain("pre-form-card");
    expect(html).toContain("My Form");
    expect(html).toContain("2 campos");
    expect(html).toContain("*example.com*");
    expect(html).toContain('data-form-id="form-1"');
  });

  it("renderFieldRow falls back to '-' when id and name are empty", () => {
    const field = {
      selector: "#f",
      id: "",
      name: "",
      label: "",
      fieldType: "text" as const,
      contextualType: undefined,
      detectionMethod: undefined,
      detectionConfidence: undefined,
    };
    const html = renderFieldRow(field, 1);
    // Should show "-" for both id/name and label
    expect(html).toContain("cell-mono");
    expect(html).toMatch(/<td class="cell-mono">-<\/td>/);
  });

  it("renderFieldRow falls back to name when id is empty", () => {
    const field = {
      selector: "#f",
      id: "",
      name: "fieldname",
      label: "",
      fieldType: "text" as const,
      contextualType: undefined,
      detectionMethod: undefined,
      detectionConfidence: undefined,
    };
    const html = renderFieldRow(field, 1);
    expect(html).toContain("fieldname");
  });

  it("renderFieldRow shows '-' for missing detection method", () => {
    const field = {
      selector: "#f",
      id: "f",
      name: "",
      label: "",
      fieldType: "text" as const,
      contextualType: undefined,
      detectionMethod: undefined,
      detectionConfidence: undefined,
    };
    const html = renderFieldRow(field, 1);
    expect(html).toContain("-");
  });

  it("renderActionCard renders secondary variant", () => {
    const html = renderActionCard({
      id: "btn2",
      icon: "Y",
      label: "Sec",
      desc: "Secondary",
      variant: "secondary",
    });
    expect(html).toContain("card-secondary");
    expect(html).not.toContain("card-primary");
    expect(html).not.toContain(" active");
  });

  it("renderActionCard renders outline variant", () => {
    const html = renderActionCard({
      id: "btn3",
      icon: "Z",
      label: "Out",
      desc: "Outline",
      variant: "outline",
    });
    expect(html).toContain("card-outline");
    expect(html).not.toContain("card-primary");
    expect(html).not.toContain("card-secondary");
  });

  it("renderTabBar renders inactive tabs without active class", () => {
    const html = renderTabBar([
      { id: "tab1", label: "Tab 1", active: true },
      { id: "tab2", label: "Tab 2", active: false },
      { id: "tab3", label: "Tab 3" },
    ]);
    expect(html).toContain('data-tab="tab1"');
    expect(html).toContain('data-tab="tab2"');
    expect(html).toContain('data-tab="tab3"');
    // Only tab1 should have "active"
    const buttons = html.split("</button>");
    expect(buttons[0]).toContain("active");
    expect(buttons[1]).not.toMatch(/\bactive\b/);
    expect(buttons[2]).not.toMatch(/\bactive\b/);
  });

  it("renderConfidenceBadge defaults to 0 when undefined", () => {
    const html = renderConfidenceBadge(undefined);
    expect(html).toContain("0%");
    expect(html).toContain("width:0%");
  });

  it("renderFieldsTableHeader defaults to showing actions", () => {
    const html = renderFieldsTableHeader();
    expect(html).toContain("<th>Ações</th>");
  });
});
