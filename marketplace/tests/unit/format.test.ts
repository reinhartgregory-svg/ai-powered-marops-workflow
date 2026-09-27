import { describe, expect, it } from "vitest";
import {
  excerpt,
  formatBid,
  formatBudget,
  formatCurrency,
  formatRelative,
  initials,
  pluralize,
  slugify,
} from "@/lib/format";

describe("formatting helpers", () => {
  it("formats whole-dollar currency", () => {
    expect(formatCurrency(1200)).toBe("$1,200");
    expect(formatCurrency(0)).toBe("$0");
  });

  it("formats budgets for fixed and hourly projects", () => {
    expect(formatBudget("fixed", 500, 1500)).toBe("$500–$1,500");
    expect(formatBudget("hourly", 40, 60)).toBe("$40–$60/hr");
    expect(formatBudget("fixed", 800, 800)).toBe("$800");
  });

  it("formats bids", () => {
    expect(formatBid("hourly", 85)).toBe("$85/hr");
    expect(formatBid("fixed", 3200)).toBe("$3,200 fixed");
  });

  it("creates distinct, URL-safe slugs for skill names", () => {
    expect(slugify("Next.js")).toBe("next-js");
    expect(slugify("UI/UX Design")).toBe("ui-ux-design");
    expect(slugify("C++")).toBe("cpp");
    expect(slugify("C#")).toBe("csharp");
    expect(slugify("  React  ")).toBe("react");
    expect(slugify("!!!")).toBe("");
  });

  it("pluralizes counts", () => {
    expect(pluralize(1, "proposal")).toBe("1 proposal");
    expect(pluralize(3, "proposal")).toBe("3 proposals");
    expect(pluralize(0, "category", "categories")).toBe("0 categories");
  });

  it("builds initials", () => {
    expect(initials("Alex Rivera")).toBe("AR");
    expect(initials("Mary Jane Watson")).toBe("MW");
    expect(initials("Cher")).toBe("CH");
  });

  it("truncates long text at a word boundary", () => {
    expect(excerpt("short text", 50)).toBe("short text");
    expect(excerpt("one two three four five", 12)).toBe("one two…");
  });

  it("describes relative times", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    expect(formatRelative(new Date("2026-01-10T11:59:30Z"), now)).toBe("just now");
    expect(formatRelative(new Date("2026-01-10T09:00:00Z"), now)).toBe("3 hours ago");
    expect(formatRelative(new Date("2026-01-09T12:00:00Z"), now)).toBe("yesterday");
    expect(formatRelative(new Date("2025-10-01T12:00:00Z"), now)).toBe("Oct 1, 2025");
  });
});
