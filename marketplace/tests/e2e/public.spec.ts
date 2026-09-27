import { expect, test } from "@playwright/test";
import { DEMO_FREELANCER, DEMO_PASSWORD } from "./helpers";

test.describe("public browsing", () => {
  test("homepage shows the value proposition, categories, featured freelancers, and CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Hire skilled freelancers.");
    await expect(page.getByRole("link", { name: "Post a project" }).first()).toHaveAttribute("href", "/signup?role=client");
    await expect(page.getByRole("link", { name: "Join as a freelancer" }).first()).toBeVisible();

    const categories = page.getByRole("region", { name: "Browse by category" });
    await expect(categories.getByRole("listitem")).toHaveCount(8);
    const featured = page.getByRole("region", { name: "Featured freelancers" });
    await expect(featured.getByRole("article")).toHaveCount(6);

    await categories.getByRole("link", { name: /Data & Analytics/ }).click();
    await expect(page).toHaveURL(/\/freelancers\?category=data/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Data & Analytics freelancers");
    await expect(page.getByRole("link", { name: "Kenji Watanabe" })).toBeVisible();
  });

  test("hero search finds freelancers by keyword", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("searchbox", { name: /Search freelancers/ }).fill("bookkeeping");
    await page.getByRole("button", { name: "Search talent" }).click();
    await expect(page).toHaveURL(/\/freelancers\?q=bookkeeping/);
    await expect(page.getByText("Showing 1–1 of 1 freelancer")).toBeVisible();
    await expect(page.getByRole("link", { name: "Nadia Petrova" })).toBeVisible();
  });

  test("freelancer filters narrow results and show a useful empty state", async ({ page }) => {
    await page.goto("/freelancers");
    // Other suites may add freelancers, so only the page size is fixed.
    await expect(page.getByText(/^Showing 1–12 of \d+ freelancers$/)).toBeVisible();

    const filters = page.getByRole("search", { name: "Filter freelancers" });
    await filters.getByRole("combobox", { name: "Skill" }).selectOption({ label: "React Native" });
    await filters.getByRole("button", { name: "Apply filters" }).click();
    await expect(page).toHaveURL(/skill=react-native/);
    await expect(page.getByText("Showing 1–1 of 1 freelancer")).toBeVisible();

    // Availability + rate range.
    await page.goto("/freelancers?availability=unavailable");
    await expect(page.getByRole("link", { name: "Tom Becker" })).toBeVisible();
    await expect(page.getByText("Showing 1–1 of 1 freelancer")).toBeVisible();

    await page.goto("/freelancers?minRate=100&sort=rate_desc");
    const names = page.getByRole("article").getByRole("heading");
    await expect(names).toHaveText(["Ivan Kowalski", "Tom Becker", "Owen Brennan"]);

    await page.goto("/freelancers?q=underwater+basket+weaving");
    await expect(page.getByRole("heading", { name: "No freelancers match these filters" })).toBeVisible();
    await page.getByRole("link", { name: "Clear all filters" }).click();
    await expect(page.getByText(/^Showing 1–12 of \d+ freelancers$/)).toBeVisible();
  });

  test("freelancer profile shows headline, rate, skills, portfolio, and availability", async ({ page }) => {
    await page.goto("/freelancers?skill=figma");
    await page.getByRole("link", { name: "Amara Osei" }).click();
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1, name: "Amara Osei" })).toBeVisible();
    await expect(main.getByText("Product designer turning complex workflows into calm interfaces")).toBeVisible();
    await expect(main.getByText("$95/hr")).toBeVisible();
    await expect(main.getByText("Limited availability").first()).toBeVisible();
    await expect(main.getByRole("link", { name: "Figma" })).toBeVisible();
    await expect(main.getByRole("heading", { name: "Clinic intake redesign" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Sign up to hire" })).toBeVisible();
  });

  test("project listings filter by budget type and link to details", async ({ page }) => {
    await page.goto("/projects");
    const filters = page.getByRole("search", { name: "Filter projects" });
    await filters.getByRole("combobox", { name: "Budget type" }).selectOption("hourly");
    await filters.getByRole("button", { name: "Apply filters" }).click();
    await expect(page).toHaveURL(/budgetType=hourly/);
    const cards = page.getByRole("article");
    await expect(cards.first()).toContainText("/hr");
    for (const card of await cards.all()) await expect(card).toContainText("Hourly rate");

    await page.getByRole("link", { name: "Patient outcomes dashboard in Power BI" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Patient outcomes dashboard in Power BI");
    await expect(page.getByText("$60–$95/hr")).toBeVisible();
    await expect(page.getByRole("heading", { name: "About the client" })).toBeVisible();
  });

  test("visitors are asked to log in to apply, then returned to the project", async ({ page }) => {
    await page.goto("/projects");
    await page.getByRole("link", { name: "Rebuild our outdoor gear storefront in Next.js" }).click();
    await page.getByRole("link", { name: "Log in to apply" }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Fprojects%2F\d+/);

    await page.getByRole("textbox", { name: "Email" }).fill(DEMO_FREELANCER);
    await page.getByLabel("Password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/projects\/\d+$/);
    await expect(page.getByRole("heading", { name: "Send a proposal" })).toBeVisible();
  });

  test("keyboard users can skip straight to the main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });

  test("the mobile menu opens, navigates, and closes with Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Open menu" });
    await toggle.click();
    const nav = page.getByRole("navigation", { name: "Mobile" });
    await expect(nav).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(nav).toBeHidden();
    await expect(toggle).toBeFocused();

    await toggle.click();
    await nav.getByRole("link", { name: "Find work" }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole("heading", { level: 1, name: "Find work" })).toBeVisible();
  });

  test("unknown pages show a helpful 404", async ({ page }) => {
    await page.goto("/projects/999999");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Browse projects" })).toBeVisible();
  });
});
