import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = "demo-password";
export const DEMO_CLIENT = "client@example.com";
export const DEMO_FREELANCER = "freelancer@example.com";

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

export async function logIn(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function signUp(
  page: Page,
  user: { role: "client" | "freelancer"; name: string; email: string; password?: string; company?: string },
) {
  await page.goto("/signup");
  await page.getByRole("radio", { name: user.role === "client" ? /I want to hire/ : /I want to work/ }).check();
  await page.getByRole("textbox", { name: "Full name" }).fill(user.name);
  if (user.company) await page.getByRole("textbox", { name: /Company or team name/ }).fill(user.company);
  await page.getByRole("textbox", { name: "Email" }).fill(user.email);
  await page.getByLabel("Password").fill(user.password ?? "a-strong-password");
  await page.getByRole("button", { name: "Create account" }).click();
}

/** Picks a skill pill inside the given skills fieldset. */
export async function pickSkill(page: Page, group: RegExp, skill: string) {
  await page.getByRole("group", { name: group }).getByText(skill, { exact: true }).click();
}
