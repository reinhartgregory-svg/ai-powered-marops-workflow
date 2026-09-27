import { expect, test } from "@playwright/test";
import { DEMO_CLIENT, DEMO_FREELANCER, logIn, signUp, uniqueEmail } from "./helpers";

test.describe("authentication and access control", () => {
  test("sign-up shows clear validation messages and focuses the first problem", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Please fix the highlighted fields.")).toBeVisible();
    await expect(page.getByText("Choose whether you want to hire or work.")).toBeVisible();
    await expect(page.getByText("Full name is required.")).toBeVisible();
    await expect(page.getByText("Password must be at least 8 characters.")).toBeVisible();
    await expect(page.getByRole("radio", { name: /I want to hire/ })).toBeFocused();

    // Values the user typed survive a failed submission.
    await page.getByRole("radio", { name: /I want to hire/ }).check();
    await page.getByRole("textbox", { name: "Full name" }).fill("Morgan Lee");
    await page.getByRole("textbox", { name: "Email" }).fill("not-an-email");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText(/Enter a valid email address/)).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Full name" })).toHaveValue("Morgan Lee");
    await expect(page.getByRole("textbox", { name: "Email" })).toHaveAttribute("aria-invalid", "true");
  });

  test("sign-up rejects an email that is already registered", async ({ page }) => {
    await signUp(page, { role: "client", name: "Copy Cat", email: DEMO_CLIENT });
    await expect(page.getByText("An account with this email already exists").first()).toBeVisible();
  });

  test("login reports wrong credentials without revealing which part was wrong", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Email" }).fill(DEMO_CLIENT);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("That email and password combination didn't match an account.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("protected pages redirect to login", async ({ page }) => {
    for (const path of ["/dashboard", "/projects/new", "/dashboard/profile"]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path)}$`));
    }
  });

  test("each role only sees the tools meant for it", async ({ page }) => {
    await logIn(page, DEMO_FREELANCER);
    await page.goto("/projects/new");
    await expect(page.getByRole("heading", { name: "Only clients can post projects" }).first()).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "Post a project" })).toHaveCount(0);

    await page.goto("/dashboard/projects/1");
    await expect(page.getByRole("heading", { name: "This isn't your project" }).first()).toBeVisible();

    await page.context().clearCookies();
    await logIn(page, DEMO_CLIENT);
    await page.goto("/dashboard/profile");
    await expect(page.getByRole("heading", { name: "Profiles are for freelancers" }).first()).toBeVisible();
    await page.goto("/projects/1");
    await expect(page.getByRole("heading", { name: "You posted this project" })).toBeVisible();
  });

  test("a new user can sign up, log out, and log back in", async ({ page }) => {
    const email = uniqueEmail("roundtrip");
    await signUp(page, { role: "client", name: "Riley Round", email, password: "roundtrip-pass" });
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Welcome back, Riley" })).toBeVisible();

    await page.getByRole("button", { name: /account menu/ }).click();
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText("You've been logged out.")).toBeVisible();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);

    await logIn(page, email, "roundtrip-pass");
    await expect(page.getByRole("heading", { name: "Welcome back, Riley" })).toBeVisible();
  });
});
