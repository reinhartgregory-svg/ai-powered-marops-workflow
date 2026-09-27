"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { endSession, startSession } from "@/lib/auth/session";
import type { FormState } from "@/lib/form-state";
import { loginSchema, readString, signupSchema } from "@/lib/validation";
import { createUser, verifyCredentials, type SessionUser } from "../services/users";
import { fromError, invalid } from "./helpers";

export async function signupAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    role: readString(formData, "role"),
    name: readString(formData, "name"),
    email: readString(formData, "email"),
    password: readString(formData, "password"),
    companyName: readString(formData, "companyName"),
  });
  if (!parsed.success) return invalid(parsed.error);

  let user: SessionUser;
  try {
    user = await createUser(parsed.data);
  } catch (error) {
    const state = fromError(error);
    return { ...state, fieldErrors: { email: [state.message ?? ""] } };
  }

  await startSession(user.id);
  revalidatePath("/", "layout");
  redirect(
    user.role === "freelancer"
      ? "/dashboard/profile?notice=welcome-freelancer"
      : "/dashboard?notice=welcome-client",
  );
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: readString(formData, "email"),
    password: readString(formData, "password"),
  });
  if (!parsed.success) return invalid(parsed.error);

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    return {
      status: "error",
      message: "That email and password combination didn't match an account.",
    };
  }

  await startSession(user.id);
  revalidatePath("/", "layout");
  redirect(safeNextPath(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  await endSession();
  revalidatePath("/", "layout");
  redirect("/?notice=signed-out");
}
