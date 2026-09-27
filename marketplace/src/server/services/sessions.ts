import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import type { SessionUser } from "./users";

const DAY_MS = 24 * 60 * 60 * 1000;

export function sessionMaxAgeMs(): number {
  const days = Number(process.env.SESSION_MAX_AGE_DAYS ?? 30);
  return (Number.isFinite(days) && days > 0 ? days : 30) * DAY_MS;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Creates a session and returns the raw token to store in the cookie. */
export async function createSession(
  userId: number,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionMaxAgeMs());
  const db = getDb();
  // Opportunistically clear this user's expired sessions.
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), lte(sessions.expiresAt, new Date())));
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  return { token, expiresAt };
}

export async function getUserForSessionToken(
  token: string,
): Promise<SessionUser | null> {
  const row = await getDb()
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      companyName: users.companyName,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .get();
  return row ?? null;
}

export async function deleteSession(token: string): Promise<void> {
  await getDb().delete(sessions).where(eq(sessions.id, hashToken(token)));
}
