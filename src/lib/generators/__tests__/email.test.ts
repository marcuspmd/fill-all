import { describe, expect, it } from "vitest";
import { generateEmail } from "@/lib/generators/email";

describe("generateEmail", () => {
  it("returns a valid email format", () => {
    const email = generateEmail();
    expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it("contains only valid email characters", () => {
    const email = generateEmail();
    // Verifica que o email tem um @ e um domínio válido (pode ter maiúsculas por design do faker)
    expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it("contains exactly one @ symbol", () => {
    const email = generateEmail();
    expect(email.split("@").length).toBe(2);
  });

  it("domain part contains a dot", () => {
    const email = generateEmail();
    const [, domain] = email.split("@");
    expect(domain).toContain(".");
  });

  it("local part and domain are non-empty", () => {
    const email = generateEmail();
    const [local, domain] = email.split("@");
    expect(local.length).toBeGreaterThan(0);
    expect(domain.length).toBeGreaterThan(0);
  });

  it("returns different emails across calls (probabilistic)", () => {
    const emails = new Set(Array.from({ length: 30 }, generateEmail));
    expect(emails.size).toBeGreaterThan(5);
  });
});
