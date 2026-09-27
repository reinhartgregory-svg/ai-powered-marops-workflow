import { describe, expect, it } from "vitest";
import {
  fieldErrorsOf,
  portfolioItemSchema,
  profileSchema,
  projectSchema,
  proposalSchema,
  readSkills,
  signupSchema,
} from "@/lib/validation";

const validProject = {
  title: "Build a booking website",
  description: "We need a booking website for our studio with online payments handled by our existing provider.",
  categoryId: "1",
  budgetType: "fixed",
  budgetMin: "1000",
  budgetMax: "2500",
  skills: ["React"],
};

describe("signupSchema", () => {
  it("normalizes email and accepts valid input", () => {
    const result = signupSchema.parse({
      role: "client",
      name: "  Ada Lovelace ",
      email: "  Ada@Example.COM ",
      password: "correct-horse",
      companyName: "",
    });
    expect(result).toMatchObject({ name: "Ada Lovelace", email: "ada@example.com", companyName: null });
  });

  it("returns a clear message for each invalid field", () => {
    const result = signupSchema.safeParse({ role: "admin", name: "", email: "nope", password: "short" });
    expect(result.success).toBe(false);
    const errors = fieldErrorsOf(result.error!);
    expect(errors.role?.[0]).toBe("Choose whether you want to hire or work.");
    expect(errors.name?.[0]).toBe("Full name is required.");
    expect(errors.email?.[0]).toMatch(/valid email/);
    expect(errors.password?.[0]).toBe("Password must be at least 8 characters.");
  });
});

describe("projectSchema", () => {
  it("coerces money fields, tolerating $ and commas", () => {
    const result = projectSchema.parse({ ...validProject, budgetMin: "$1,000", budgetMax: "2,500" });
    expect(result.budgetMin).toBe(1000);
    expect(result.budgetMax).toBe(2500);
    expect(result.categoryId).toBe(1);
  });

  it("rejects a maximum budget below the minimum", () => {
    const result = projectSchema.safeParse({ ...validProject, budgetMin: "3000", budgetMax: "1000" });
    expect(fieldErrorsOf(result.error!).budgetMax?.[0]).toMatch(/greater than or equal/);
  });

  it("distinguishes missing from non-numeric amounts", () => {
    const result = projectSchema.safeParse({ ...validProject, budgetMin: "", budgetMax: "lots" });
    const errors = fieldErrorsOf(result.error!);
    expect(errors.budgetMin?.[0]).toBe("Minimum budget is required.");
    expect(errors.budgetMax?.[0]).toBe("Maximum budget must be a number.");
  });

  it("requires at least one skill and a real category", () => {
    const result = projectSchema.safeParse({ ...validProject, skills: [], categoryId: "" });
    const errors = fieldErrorsOf(result.error!);
    expect(errors.skills?.[0]).toBe("Add at least 1 skill.");
    expect(errors.categoryId?.[0]).toBe("Choose a category.");
  });
});

describe("profileSchema", () => {
  it("enforces rate limits and the skill cap", () => {
    const result = profileSchema.safeParse({
      headline: "Designer for startups",
      bio: "x".repeat(60),
      categoryId: "2",
      hourlyRate: "2",
      availability: "available",
      skills: Array.from({ length: 16 }, (_, i) => `Skill ${i}`),
    });
    const errors = fieldErrorsOf(result.error!);
    expect(errors.hourlyRate?.[0]).toBe("Hourly rate must be at least $5.");
    expect(errors.skills?.[0]).toBe("Choose up to 15 skills.");
  });
});

describe("portfolioItemSchema", () => {
  const base = { title: "Store redesign", description: "Redesigned the checkout flow." };

  it("adds https:// to bare domains and treats empty links as none", () => {
    expect(portfolioItemSchema.parse({ ...base, url: "example.com/work" }).url).toBe("https://example.com/work");
    expect(portfolioItemSchema.parse({ ...base, url: "" }).url).toBeNull();
    expect(portfolioItemSchema.parse(base).url).toBeNull();
  });

  it("rejects non-web links such as javascript: URLs", () => {
    for (const url of ["javascript:alert(1)", "ftp://example.com", "data:text/html,hi"]) {
      expect(portfolioItemSchema.safeParse({ ...base, url }).success).toBe(false);
    }
  });
});

describe("proposalSchema", () => {
  it("requires a substantial cover letter and a known duration", () => {
    const result = proposalSchema.safeParse({ coverLetter: "Hi", bidAmount: "100", estimatedDuration: "forever" });
    const errors = fieldErrorsOf(result.error!);
    expect(errors.coverLetter?.[0]).toBe("Cover letter must be at least 50 characters.");
    expect(errors.estimatedDuration?.[0]).toBe("Choose how long the work will take.");
  });
});

describe("readSkills", () => {
  it("merges checked and typed skills without duplicates", () => {
    const form = new FormData();
    form.append("skills", "React");
    form.append("skills", "Figma");
    form.set("newSkills", "react,  Webflow , , FIGMA, Brand   Voice");
    expect(readSkills(form)).toEqual(["React", "Figma", "Webflow", "Brand Voice"]);
  });
});
