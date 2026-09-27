import { defineConfig } from "drizzle-kit";

// Used only for `npm run db:generate`, which writes SQL migrations from src/db/schema.ts.
// Migrations are applied with `npm run db:migrate` (scripts/migrate.ts).
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
