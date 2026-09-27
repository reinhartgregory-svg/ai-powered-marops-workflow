import "./load-env";
import { closeDb } from "@/db";
import { runMigrations } from "@/db/migrate";

async function main() {
  await runMigrations();
  console.log(`✔ Database schema is up to date (${process.env.DATABASE_URL}).`);
}

main()
  .catch((error) => {
    console.error("✖ Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(closeDb);
