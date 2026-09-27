import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type Db = LibSQLDatabase<typeof schema>;

type DbHandle = { url: string; client: Client; db: Db };

// Reuse one client per process (and across dev hot reloads).
const globalForDb = globalThis as unknown as { __marketplaceDb?: DbHandle };

function readDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env (or set the variable) before starting the app.",
    );
  }
  return url;
}

function ensureLocalDirectory(url: string) {
  if (!url.startsWith("file:")) return;
  const filePath = url.slice("file:".length);
  if (!filePath || filePath === ":memory:") return;
  mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
}

export function getDb(): Db {
  const url = readDatabaseUrl();
  const existing = globalForDb.__marketplaceDb;
  if (existing && existing.url === url) return existing.db;

  existing?.client.close();
  ensureLocalDirectory(url);
  const client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
    // Wait for locks instead of failing immediately when two requests write at once.
    timeout: 5000,
  });
  const db = drizzle(client, { schema });
  globalForDb.__marketplaceDb = { url, client, db };
  return db;
}

export function closeDb() {
  globalForDb.__marketplaceDb?.client.close();
  globalForDb.__marketplaceDb = undefined;
}

export { schema };
