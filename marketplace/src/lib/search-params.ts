import { AVAILABILITY, BUDGET_TYPES, PROJECT_STATUSES } from "@/db/schema";
import type { FreelancerFilters, FreelancerSort } from "@/server/services/freelancers";
import { FREELANCER_SORTS } from "@/server/services/freelancers";
import type { ProjectFilters, ProjectSort } from "@/server/services/projects";
import { PROJECT_SORTS } from "@/server/services/projects";

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  const trimmed = v?.trim();
  return trimmed ? trimmed : undefined;
}

function wholeNumber(value: string | undefined, max = 1_000_000): number | undefined {
  if (!value) return undefined;
  const n = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.min(Math.floor(n), max) : undefined;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function page(value: string | undefined): number {
  const n = wholeNumber(value, 10_000);
  return n && n > 0 ? n : 1;
}

export function parseFreelancerFilters(raw: RawSearchParams): FreelancerFilters {
  let minRate = wholeNumber(first(raw.minRate), 10_000);
  let maxRate = wholeNumber(first(raw.maxRate), 10_000);
  // Be forgiving if someone enters the range backwards.
  if (minRate !== undefined && maxRate !== undefined && minRate > maxRate) {
    [minRate, maxRate] = [maxRate, minRate];
  }
  return {
    q: first(raw.q)?.slice(0, 100),
    category: first(raw.category),
    skill: first(raw.skill),
    minRate,
    maxRate,
    availability: oneOf(first(raw.availability), AVAILABILITY),
    sort: oneOf<FreelancerSort>(first(raw.sort), FREELANCER_SORTS) ?? "relevance",
    page: page(first(raw.page)),
  };
}

export function parseProjectFilters(raw: RawSearchParams): ProjectFilters {
  const status = first(raw.status);
  return {
    q: first(raw.q)?.slice(0, 100),
    category: first(raw.category),
    skill: first(raw.skill),
    budgetType: oneOf(first(raw.budgetType), BUDGET_TYPES),
    status: status === "all" ? "all" : (oneOf(status, PROJECT_STATUSES) ?? "open"),
    minBudget: wholeNumber(first(raw.minBudget)),
    sort: oneOf<ProjectSort>(first(raw.sort), PROJECT_SORTS) ?? "newest",
    page: page(first(raw.page)),
  };
}

/** Number of filters that narrow the results (ignores sort and page). */
export function activeFilterCount(filters: object, ignore: string[] = []): number {
  return Object.entries(filters).filter(
    ([key, value]) =>
      !["sort", "page", ...ignore].includes(key) && value !== undefined && value !== "",
  ).length;
}

/** Builds a URL for `path` from filters, dropping empty values and defaults. */
export function buildHref(
  path: string,
  params: Record<string, string | number | undefined>,
  defaults: Record<string, string | number> = {},
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || defaults[key] === value) continue;
    if (key === "page" && value === 1) continue;
    query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}
