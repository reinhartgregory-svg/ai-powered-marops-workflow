import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE } from "./cookie";
import {
  createSession,
  deleteSession,
  getUserForSessionToken,
} from "@/server/services/sessions";
import type { SessionUser } from "@/server/services/users";


function shouldUseSecureCookies(): boolean {
  if (process.env.SESSION_COOKIE_SECURE === "false") return false;
  if (process.env.SESSION_COOKIE_SECURE === "true") return true;
  return process.env.NODE_ENV === "production";
}

export async function startSession(userId: number): Promise<void> {
  const { token, expiresAt } = await createSession(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  cookieStore.delete(SESSION_COOKIE);
}

/** The signed-in user for this request, or null. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getUserForSessionToken(token);
});

/** Redirects to the login page (then back to `returnTo`) when nobody is signed in. */
export async function requireUser(returnTo: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}
