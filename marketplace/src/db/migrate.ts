import path from "node:path";
import { migrate } from "drizzle-orm/libsql/migrator";
import { getDb } from "./index";

export const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

export async function runMigrations() {
  await migrate(getDb(), { migrationsFolder: MIGRATIONS_FOLDER });
}
