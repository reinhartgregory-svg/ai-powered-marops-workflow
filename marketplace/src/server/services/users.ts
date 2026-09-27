import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, type User, type UserRole } from "@/db/schema";
import {
  burnPasswordCheck,
  hashPassword,
  verifyPassword,
} from "@/lib/auth/password";
import type { SignupInput } from "@/lib/validation";
import { ConflictError, ForbiddenError } from "../errors";

export type SessionUser = Pick<
  User,
  "id" | "name" | "email" | "role" | "companyName"
>;

export const EMAIL_TAKEN_MESSAGE =
  "An account with this email already exists. Try logging in instead.";

function isUniqueViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const cause = (error as { cause?: unknown })?.cause;
  const causeMessage = cause instanceof Error ? cause.message : "";
  return /UNIQUE constraint failed/i.test(`${message} ${causeMessage}`);
}

export async function createUser(input: SignupInput): Promise<SessionUser> {
  const db = getDb();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .get();
  if (existing) throw new ConflictError(EMAIL_TAKEN_MESSAGE);

  const passwordHash = await hashPassword(input.password);
  try {
    const [created] = await db
      .insert(users)
      .values({
        email: input.email,
        name: input.name,
        role: input.role,
        companyName: input.role === "client" ? input.companyName : null,
        passwordHash,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        companyName: users.companyName,
      });
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) throw new ConflictError(EMAIL_TAKEN_MESSAGE);
    throw error;
  }
}

/** Returns the user when the email/password pair is valid, otherwise null. */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const user = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .get();
  if (!user) {
    await burnPasswordCheck(password);
    return null;
  }
  if (!(await verifyPassword(password, user.passwordHash))) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyName: user.companyName,
  };
}

export function assertRole(
  user: Pick<SessionUser, "role">,
  role: UserRole,
  message?: string,
) {
  if (user.role !== role) {
    throw new ForbiddenError(
      message ??
        (role === "client"
          ? "Only client accounts can do that."
          : "Only freelancer accounts can do that."),
    );
  }
}
