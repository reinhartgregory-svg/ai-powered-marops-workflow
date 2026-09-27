import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll } from "vitest";

// A fresh database file per test file, so tests never touch your development data.
const dir = mkdtempSync(path.join(os.tmpdir(), "marketplace-test-"));
process.env.DATABASE_URL = `file:${path.join(dir, "test.db")}`;
process.env.SESSION_MAX_AGE_DAYS = "30";

beforeAll(async () => {
  const { runMigrations } = await import("@/db/migrate");
  await runMigrations();
});

afterAll(async () => {
  const { closeDb } = await import("@/db");
  closeDb();
  rmSync(dir, { recursive: true, force: true });
});
