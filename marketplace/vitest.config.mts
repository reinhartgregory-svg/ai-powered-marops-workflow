import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    // Each test file gets its own throwaway SQLite database (see tests/setup.ts).
    setupFiles: ["tests/setup.ts"],
    // scrypt hashing makes auth-heavy tests slower than typical unit tests.
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
