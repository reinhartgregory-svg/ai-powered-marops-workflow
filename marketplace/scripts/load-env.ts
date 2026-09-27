import { loadEnvConfig } from "@next/env";

// Load .env / .env.local the same way `next dev` does, so scripts and the app share configuration.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Copy .env.example to .env (cp .env.example .env) and try again.",
  );
  process.exit(1);
}
