import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

/**
 * End-to-end tests run against a production build with its own freshly seeded
 * database (data/e2e.db), so they never touch your development data.
 * Set E2E_SKIP_BUILD=1 to reuse an existing `next build`.
 */
export default defineConfig({
  testDir: "tests/e2e",
  // The journeys share one database, so run them one at a time.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: [
      process.env.E2E_SKIP_BUILD ? null : "npm run build",
      "npm run db:seed",
      `npm run start -- --port ${PORT}`,
    ]
      .filter(Boolean)
      .join(" && "),
    url: baseURL,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: "file:./data/e2e.db",
      SEED_DEMO_PASSWORD: "demo-password",
      SHOW_DEMO_ACCOUNTS: "true",
      SESSION_COOKIE_SECURE: "false",
    },
  },
});
