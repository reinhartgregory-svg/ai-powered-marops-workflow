import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/db";
import { sessions } from "@/db/schema";
import { ConflictError } from "@/server/errors";
import { createSession, deleteSession, getUserForSessionToken } from "@/server/services/sessions";
import { createUser, EMAIL_TAKEN_MESSAGE, verifyCredentials } from "@/server/services/users";
import { resetWithCategories } from "./helpers";

beforeEach(async () => {
  await resetWithCategories();
});

describe("accounts", () => {
  it("creates users and never stores the plain password", async () => {
    const user = await createUser({
      role: "client",
      name: "Dana",
      email: "dana@example.com",
      password: "hunter2hunter2",
      companyName: "Dana Co",
    });
    expect(user).toMatchObject({ role: "client", companyName: "Dana Co" });
    const row = await getDb().query.users.findFirst({ where: (u, { eq }) => eq(u.id, user.id) });
    expect(row?.passwordHash).not.toContain("hunter2");
  });

  it("drops the company name for freelancers", async () => {
    const user = await createUser({
      role: "freelancer",
      name: "Fran",
      email: "fran@example.com",
      password: "password123",
      companyName: "Should be ignored",
    });
    expect(user.companyName).toBeNull();
  });

  it("rejects duplicate emails with a friendly message", async () => {
    const input = { role: "client" as const, name: "A", email: "dup@example.com", password: "password123", companyName: null };
    await createUser(input);
    await expect(createUser(input)).rejects.toThrow(new ConflictError(EMAIL_TAKEN_MESSAGE));
  });

  it("verifies credentials case-insensitively by email", async () => {
    await createUser({ role: "freelancer", name: "Lee", email: "lee@example.com", password: "password123", companyName: null });
    expect(await verifyCredentials("LEE@example.com ", "password123")).toMatchObject({ email: "lee@example.com" });
    expect(await verifyCredentials("lee@example.com", "wrong-password")).toBeNull();
    expect(await verifyCredentials("nobody@example.com", "password123")).toBeNull();
  });
});

describe("sessions", () => {
  it("resolves a token to its user until it is deleted", async () => {
    const user = await createUser({ role: "client", name: "Sam", email: "sam@example.com", password: "password123", companyName: null });
    const { token } = await createSession(user.id);

    // Only a hash of the token is stored.
    const stored = await getDb().select().from(sessions).where(eq(sessions.userId, user.id));
    expect(stored).toHaveLength(1);
    expect(stored[0].id).not.toBe(token);

    expect(await getUserForSessionToken(token)).toMatchObject({ id: user.id, role: "client" });
    await deleteSession(token);
    expect(await getUserForSessionToken(token)).toBeNull();
  });

  it("ignores expired sessions and unknown tokens", async () => {
    const user = await createUser({ role: "client", name: "Kim", email: "kim@example.com", password: "password123", companyName: null });
    const { token } = await createSession(user.id);
    await getDb().update(sessions).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(sessions.userId, user.id));
    expect(await getUserForSessionToken(token)).toBeNull();
    expect(await getUserForSessionToken("made-up-token")).toBeNull();
  });
});
