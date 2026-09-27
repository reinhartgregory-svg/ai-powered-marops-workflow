import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import {
  activeFilterCount,
  buildHref,
  parseFreelancerFilters,
  parseProjectFilters,
} from "@/lib/search-params";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("Correct horse battery", hash)).toBe(false);
  });

  it("salts every hash", async () => {
    const [a, b] = await Promise.all([hashPassword("same"), hashPassword("same")]);
    expect(a).not.toBe(b);
  });

  it("treats malformed hashes as a failed match", async () => {
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("allows same-site paths only", () => {
    expect(safeNextPath("/projects/3?tab=a")).toBe("/projects/3?tab=a");
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.example")).toBe("/dashboard");
    expect(safeNextPath(undefined)).toBe("/dashboard");
  });
});

describe("search parameter parsing", () => {
  it("parses freelancer filters defensively", () => {
    const filters = parseFreelancerFilters({
      q: "  react  ",
      minRate: "120",
      maxRate: "$40",
      availability: "sometimes",
      sort: "rate_desc",
      page: "-3",
    });
    expect(filters).toMatchObject({
      q: "react",
      minRate: 40, // swapped so the range makes sense
      maxRate: 120,
      availability: undefined,
      sort: "rate_desc",
      page: 1,
    });
  });

  it("defaults projects to open status and newest first", () => {
    expect(parseProjectFilters({})).toMatchObject({ status: "open", sort: "newest", page: 1 });
    expect(parseProjectFilters({ status: "all", budgetType: "hourly" })).toMatchObject({
      status: "all",
      budgetType: "hourly",
    });
    expect(parseProjectFilters({ status: "bogus" }).status).toBe("open");
  });

  it("counts only narrowing filters", () => {
    expect(activeFilterCount(parseFreelancerFilters({ sort: "newest", page: "2" }))).toBe(0);
    expect(activeFilterCount(parseFreelancerFilters({ skill: "react", q: "x" }))).toBe(2);
  });

  it("builds clean URLs without defaults or empty values", () => {
    expect(buildHref("/freelancers", { q: "a b", skill: undefined, sort: "relevance", page: 1 }, { sort: "relevance" })).toBe(
      "/freelancers?q=a+b",
    );
    expect(buildHref("/projects", { page: 3 })).toBe("/projects?page=3");
  });
});
