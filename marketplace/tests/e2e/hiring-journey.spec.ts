import { expect, test, type Browser, type Page } from "@playwright/test";
import { logIn, pickSkill, signUp, uniqueEmail } from "./helpers";

/**
 * The core marketplace loop with brand-new accounts:
 * client posts a project → freelancer builds a profile and applies →
 * client shortlists and hires → both see the outcome and each other's contact details.
 */
test.describe.serial("posting, applying, and hiring", () => {
  const runId = Date.now();
  const client = { name: "Quinn Harper", email: uniqueEmail("quinn"), password: "client-pass-123", company: "Harper Home Goods" };
  const freelancer = { name: "Jordan Vega", email: uniqueEmail("jordan"), password: "freelancer-pass-123" };
  const projectTitle = `Redesign checkout flow ${runId}`;
  let projectPath = "";

  async function newPage(browser: Browser): Promise<Page> {
    const context = await browser.newContext();
    return context.newPage();
  }

  test("a client signs up and posts a project", async ({ browser }) => {
    const page = await newPage(browser);
    await signUp(page, { role: "client", ...client });
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("You haven't posted a project yet")).toBeVisible();
    await page.getByRole("link", { name: "Post your first project" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Post a project" })).toBeVisible();

    // Submitting an empty form explains what's missing.
    await page.getByRole("button", { name: "Post project" }).click();
    await expect(page.getByText("Title is required.")).toBeVisible();
    await expect(page.getByText("Choose a category.")).toBeVisible();
    await expect(page.getByText("Add at least 1 skill.")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Project title" })).toBeFocused();

    await page.getByRole("textbox", { name: "Project title" }).fill(projectTitle);
    await page
      .getByRole("textbox", { name: "Description" })
      .fill("Our checkout has five steps and customers drop off. We want a faster, mobile-friendly checkout with clear shipping costs.");
    await page.getByRole("combobox", { name: "Category" }).selectOption({ label: "Development & IT" });
    await page.getByRole("radio", { name: /Fixed price/ }).check();
    await page.getByRole("spinbutton", { name: "Minimum" }).fill("3000");
    await page.getByRole("spinbutton", { name: "Maximum" }).fill("1500");
    await pickSkill(page, /Required skills/, "React");
    await pickSkill(page, /Required skills/, "E-commerce");
    await page.getByRole("textbox", { name: /Other skills/ }).fill("Checkout UX");
    await page.getByRole("button", { name: "Post project" }).click();
    await expect(page.getByText("Maximum budget must be greater than or equal to the minimum.")).toBeVisible();
    // Other fields kept their values.
    await expect(page.getByRole("textbox", { name: "Project title" })).toHaveValue(projectTitle);

    await page.getByRole("spinbutton", { name: "Maximum" }).fill("5000");
    await page.getByRole("button", { name: "Post project" }).click();
    await expect(page).toHaveURL(/\/dashboard\/projects\/\d+$/);
    await expect(page.getByRole("heading", { level: 1, name: projectTitle })).toBeVisible();
    await expect(page.getByText("Your project is live.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "No proposals yet" })).toBeVisible();
    projectPath = new URL(page.url()).pathname.replace("/dashboard", "");

    // It's publicly listed with its skills, including the custom one.
    await page.goto(projectPath);
    await expect(page.getByRole("link", { name: "Checkout UX" })).toBeVisible();
    await expect(page.getByText("$3,000–$5,000")).toBeVisible();
    await page.context().close();
  });

  test("a freelancer creates a profile and sends a proposal", async ({ browser }) => {
    const page = await newPage(browser);
    await signUp(page, { role: "freelancer", ...freelancer });
    await expect(page).toHaveURL(/\/dashboard\/profile$/);
    await expect(page.getByRole("heading", { level: 1, name: "Create your freelancer profile" })).toBeVisible();

    // Can't apply before having a profile.
    await page.goto(projectPath);
    await expect(page.getByRole("heading", { name: "Create your profile to apply" })).toBeVisible();
    await page.getByRole("link", { name: "Create your profile" }).click();

    await page.getByRole("textbox", { name: "Professional headline" }).fill("Front-end developer for fast online stores");
    await page
      .getByRole("textbox", { name: "Bio" })
      .fill("I help small retailers build quick, accessible storefronts and checkouts that convert on mobile.");
    await page.getByRole("combobox", { name: "Primary category" }).selectOption({ label: "Development & IT" });
    await page.getByRole("spinbutton", { name: "Hourly rate (USD)" }).fill("70");
    await page.getByRole("radio", { name: /Available now/ }).check();
    await page.getByRole("textbox", { name: /Location/ }).fill("Denver, CO");
    await pickSkill(page, /^Skills/, "React");
    await pickSkill(page, /^Skills/, "E-commerce");
    await page.getByRole("button", { name: "Publish profile" }).click();
    await expect(page.getByText("Your profile is live.")).toBeVisible();

    await page.getByRole("textbox", { name: "Title" }).fill("One-page checkout for a tea shop");
    await page.getByRole("textbox", { name: "What you did and the result" }).fill("Cut checkout time in half.");
    await page.getByRole("textbox", { name: /^Link/ }).fill("example.com/tea-shop");
    await page.getByRole("button", { name: "Add to portfolio" }).click();
    await expect(page.getByText("Added “One-page checkout for a tea shop” to your portfolio.")).toBeVisible();
    await expect(page.getByRole("link", { name: /https:\/\/example\.com\/tea-shop/ })).toBeVisible();
    // The form clears for the next item.
    await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue("");

    // The profile is now searchable.
    await page.goto(`/freelancers?q=${encodeURIComponent("Jordan Vega")}`);
    await expect(page.getByRole("link", { name: "Jordan Vega" })).toBeVisible();

    // Find the project through search and apply.
    await page.goto(`/projects?q=${runId}`);
    await page.getByRole("link", { name: projectTitle }).click();
    await page.getByRole("textbox", { name: "Cover letter" }).fill("I can help!");
    await page.getByRole("button", { name: "Send proposal" }).click();
    await expect(page.getByText("Cover letter must be at least 50 characters.")).toBeVisible();

    await page
      .getByRole("textbox", { name: "Cover letter" })
      .fill("I recently rebuilt a tea shop's checkout into a single page and cut completion time in half. Happy to share details.");
    await page.getByRole("spinbutton", { name: "Your fixed price" }).fill("4200");
    await page.getByRole("combobox", { name: "Estimated duration" }).selectOption("2_4_weeks");
    await page.getByRole("button", { name: "Send proposal" }).click();
    await expect(page.getByText("Proposal sent!")).toBeVisible();
    const yourProposal = page.getByRole("region", { name: "Your proposal" });
    await expect(yourProposal.getByText("Submitted")).toBeVisible();
    await expect(yourProposal.getByText("$4,200 fixed")).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: projectTitle })).toBeVisible();
    await expect(page.getByText("Awaiting a client decision")).toBeVisible();
    await page.context().close();
  });

  test("the client reviews, shortlists, and hires the freelancer", async ({ browser }) => {
    const page = await newPage(browser);
    await logIn(page, client.email, client.password);
    await expect(page.getByText("1 new")).toBeVisible();
    await page.getByRole("link", { name: "Review proposals" }).click();

    const card = page.getByRole("article").filter({ hasText: freelancer.name });
    await expect(card.getByText("New")).toBeVisible();
    await expect(card.getByText("$4,200 fixed")).toBeVisible();
    // Contact details stay private until a hire.
    await expect(card.getByText(freelancer.email)).toHaveCount(0);

    await card.getByRole("button", { name: "Shortlist" }).click();
    await expect(page.getByText("Added to your shortlist.")).toBeVisible();
    await expect(card.getByText("Shortlisted")).toBeVisible();

    await card.getByRole("button", { name: "Hire Jordan" }).click();
    const dialog = page.getByRole("dialog", { name: "Hire Jordan Vega?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Hire Jordan" }).click();
    await expect(page.getByText("Hired! The project is now in progress.")).toBeVisible();
    await expect(card.getByText("Hired")).toBeVisible();
    await expect(card.getByRole("link", { name: freelancer.email })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark as completed" })).toBeVisible();

    // The listing no longer accepts proposals and has left the default search.
    await page.goto(`/projects?q=${runId}`);
    await expect(page.getByRole("heading", { name: "No projects match these filters" })).toBeVisible();
    await page.context().close();
  });

  test("the freelancer sees the hire and the client's contact details", async ({ browser }) => {
    const page = await newPage(browser);
    await logIn(page, freelancer.email, freelancer.password);
    const application = page.getByRole("listitem").filter({ hasText: projectTitle });
    await expect(application.getByText("Hired", { exact: true })).toBeVisible();
    await expect(application.getByRole("link", { name: client.email })).toBeVisible();

    await page.goto(projectPath);
    await expect(page.getByText(`You're hired! Reach out to ${client.name}`)).toBeVisible();
    await page.context().close();
  });

  test("the client marks the project as completed", async ({ browser }) => {
    const page = await newPage(browser);
    await logIn(page, client.email, client.password);
    await page.getByRole("link", { name: "Manage" }).click();
    await page.getByRole("button", { name: "Mark as completed" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Mark completed" }).click();
    await expect(page.getByText("Project marked as completed.")).toBeVisible();
    await expect(page.getByText("This project is complete.")).toBeVisible();
    await page.context().close();
  });
});

test("a freelancer can withdraw a pending proposal", async ({ page }) => {
  await logIn(page, "freelancer@example.com");
  const application = page.getByRole("listitem").filter({ hasText: "Build a REST API for our manuscript submission portal" });
  await application.getByRole("button", { name: "Withdraw" }).click();
  const dialog = page.getByRole("dialog", { name: "Withdraw this proposal?" });
  await dialog.getByRole("button", { name: "Withdraw proposal" }).click();
  await expect(page.getByText("Proposal withdrawn.")).toBeVisible();
  await expect(application.getByText("Withdrawn")).toBeVisible();
});
