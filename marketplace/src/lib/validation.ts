import { z } from "zod";
import {
  AVAILABILITY,
  BUDGET_TYPES,
  DURATIONS,
  USER_ROLES,
} from "@/db/schema";
import { LIMITS } from "./constants";
import { formatCurrency, slugify } from "./format";

/* ---------- Field helpers ---------- */

function text(label: string, min: number, max: number) {
  return z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .min(min, `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be ${max} characters or fewer.`);
}

function optionalText(label: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .optional()
    .transform((value) => (value ? value : null));
}

function toNumber(value: unknown) {
  if (typeof value !== "string") return value;
  const cleaned = value.replace(/[$,\s]/g, "");
  return cleaned === "" ? undefined : Number(cleaned);
}

function wholeDollars(label: string, min: number, max: number) {
  return z.preprocess(
    toNumber,
    z
      .number({
        error: (issue) =>
          issue.input === undefined
            ? `${label} is required.`
            : `${label} must be a number.`,
      })
      .int(`${label} must be a whole dollar amount.`)
      .min(min, `${label} must be at least ${formatCurrency(min)}.`)
      .max(max, `${label} can't be more than ${formatCurrency(max)}.`),
  );
}

const categoryId = z.preprocess(
  toNumber,
  z
    .number({ error: "Choose a category." })
    .int("Choose a category.")
    .positive("Choose a category."),
);

const email = z
  .string({ error: "Email is required." })
  .trim()
  .toLowerCase()
  .min(1, "Email is required.")
  .pipe(z.email("Enter a valid email address, like name@example.com."));

const skillName = z
  .string()
  .trim()
  .min(1)
  .max(40, "Skill names must be 40 characters or fewer.")
  .refine((value) => slugify(value).length > 0, {
    message: "Skill names need at least one letter or number.",
  });

function skillList(min: number, max: number) {
  return z
    .array(skillName)
    .min(min, `Add at least ${min} skill${min === 1 ? "" : "s"}.`)
    .max(max, `Choose up to ${max} skills.`);
}

/* ---------- Auth ---------- */

export const signupSchema = z.object({
  role: z.enum(USER_ROLES, { error: "Choose whether you want to hire or work." }),
  name: text("Full name", 2, 80),
  email,
  password: z
    .string({ error: "Password is required." })
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be 128 characters or fewer."),
  companyName: optionalText("Company name", 100),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email,
  password: z
    .string({ error: "Password is required." })
    .min(1, "Password is required."),
});
export type LoginInput = z.infer<typeof loginSchema>;

/* ---------- Freelancer profile ---------- */

export const profileSchema = z.object({
  headline: text("Headline", 10, 120),
  bio: text("Bio", 50, 3000),
  categoryId,
  hourlyRate: wholeDollars("Hourly rate", 5, 1000),
  availability: z.enum(AVAILABILITY, { error: "Choose your availability." }),
  location: optionalText("Location", 80),
  skills: skillList(1, LIMITS.maxSkills),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const portfolioItemSchema = z.object({
  title: text("Title", 3, 100),
  description: text("Description", 10, 500),
  url: z
    .string()
    .trim()
    .optional()
    // Accept "example.com" by assuming https; anything with another scheme is rejected below.
    .transform((value) =>
      !value ? null : /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`,
    )
    .pipe(
      z
        .url({
          protocol: /^https?$/,
          hostname: z.regexes.domain,
          error: "Enter a full link that starts with https://",
        })
        .max(300, "Links must be 300 characters or fewer.")
        .nullable(),
    ),
});
export type PortfolioItemInput = z.infer<typeof portfolioItemSchema>;

/* ---------- Projects ---------- */

export const projectSchema = z
  .object({
    title: text("Title", 10, 120),
    description: text("Description", 50, 5000),
    categoryId,
    budgetType: z.enum(BUDGET_TYPES, { error: "Choose a budget type." }),
    budgetMin: wholeDollars("Minimum budget", 5, 1_000_000),
    budgetMax: wholeDollars("Maximum budget", 5, 1_000_000),
    skills: skillList(1, LIMITS.maxProjectSkills),
  })
  .refine((data) => data.budgetMax >= data.budgetMin, {
    path: ["budgetMax"],
    message: "Maximum budget must be greater than or equal to the minimum.",
  });
export type ProjectInput = z.infer<typeof projectSchema>;

/* ---------- Proposals ---------- */

export const proposalSchema = z.object({
  coverLetter: text("Cover letter", 50, 3000),
  bidAmount: wholeDollars("Your bid", 5, 1_000_000),
  estimatedDuration: z.enum(DURATIONS, {
    error: "Choose how long the work will take.",
  }),
});
export type ProposalInput = z.infer<typeof proposalSchema>;

/* ---------- Form parsing ---------- */

/**
 * Combines checked skill boxes (`skills`) with a free-text, comma-separated list
 * (`newSkills`) and removes duplicates by slug.
 */
export function readSkills(formData: FormData): string[] {
  const picked = formData
    .getAll("skills")
    .filter((v): v is string => typeof v === "string");
  const typed = String(formData.get("newSkills") ?? "")
    .split(",")
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const name of [...picked, ...typed]) {
    const slug = slugify(name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    result.push(name.trim());
  }
  return result;
}

export function readString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export type FieldErrors = Record<string, string[] | undefined>;

export function fieldErrorsOf(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}
