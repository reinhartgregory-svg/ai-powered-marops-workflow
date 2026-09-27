import type { BudgetType } from "@/db/schema";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return currency.format(amount);
}

export function formatBudget(
  budgetType: BudgetType,
  min: number,
  max: number,
): string {
  const suffix = budgetType === "hourly" ? "/hr" : "";
  if (min === max) return `${formatCurrency(min)}${suffix}`;
  return `${formatCurrency(min)}–${formatCurrency(max)}${suffix}`;
}

export function formatBid(budgetType: BudgetType, amount: number): string {
  return budgetType === "hourly"
    ? `${formatCurrency(amount)}/hr`
    : `${formatCurrency(amount)} fixed`;
}

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatDate(date: Date): string {
  return dateFormat.format(date);
}

const monthYear = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

export function formatMonthYear(date: Date): string {
  return monthYear.format(date);
}

const relative = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

export function formatRelative(date: Date, now: Date = new Date()): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return "just now";
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), "hour");
  if (abs < 86400 * 30)
    return relative.format(Math.round(seconds / 86400), "day");
  return formatDate(date);
}

export function pluralize(count: number, singular: string, plural?: string) {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length === 1
      ? parts[0].slice(0, 2)
      : `${parts[0][0]}${parts[parts.length - 1][0]}`;
  return letters.toUpperCase();
}

/**
 * Turns a skill or category name into a stable URL slug.
 * Symbols that carry meaning in tech names are spelled out so "C++" and "C#" stay distinct.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\+/g, "p")
    .replace(/#/g, "sharp")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function excerpt(text: string, maxLength: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).replace(/\s+\S*$/, "")}…`;
}
