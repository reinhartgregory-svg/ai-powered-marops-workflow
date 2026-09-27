import "./load-env";
import { closeDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { seedDatabase } from "@/db/seed";
import { DEMO_CLIENT_EMAIL, DEMO_FREELANCER_EMAIL } from "@/db/seed-data";

async function main() {
  if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
    throw new Error(
      "Refusing to seed with NODE_ENV=production: seeding deletes all existing data. Pass --force to override.",
    );
  }
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("Set SEED_DEMO_PASSWORD (8+ characters) in your .env file before seeding.");
  }

  await runMigrations();
  const counts = await seedDatabase({ password });

  console.log("✔ Demo data loaded (all previous data was replaced):");
  console.table(counts);
  console.log("Demo accounts (password is SEED_DEMO_PASSWORD from your .env):");
  console.log(`  Client:     ${DEMO_CLIENT_EMAIL}`);
  console.log(`  Freelancer: ${DEMO_FREELANCER_EMAIL}`);
}

main()
  .catch((error) => {
    console.error("✖ Seeding failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closeDb);
