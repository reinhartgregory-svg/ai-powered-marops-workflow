import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import type { FormState } from "@/lib/form-state";
import { fieldErrorsOf } from "@/lib/validation";
import { AppError, InvalidInputError } from "../errors";
import type { SessionUser } from "../services/users";

export const SIGNED_OUT: FormState = {
  status: "error",
  message: "Your session has ended. Please log in again.",
};

export function invalid(error: z.ZodError): FormState {
  return {
    status: "error",
    message: "Please fix the highlighted fields.",
    fieldErrors: fieldErrorsOf(error),
  };
}

/** Converts expected service errors into form feedback; unexpected errors propagate. */
export function fromError(error: unknown): FormState {
  if (error instanceof InvalidInputError) {
    return { status: "error", message: error.message, fieldErrors: error.fieldErrors };
  }
  if (error instanceof AppError) return { status: "error", message: error.message };
  throw error;
}

export function readId(formData: FormData, key: string): number | null {
  const id = Number(formData.get(key));
  return Number.isInteger(id) && id > 0 ? id : null;
}

type Outcome = FormState & { redirectTo?: string };

/**
 * Runs a mutation for the signed-in user. Expected failures become form state;
 * on success every page is revalidated and, if `redirectTo` is set, the user is redirected.
 */
export async function runAction(
  fn: (actor: SessionUser) => Promise<Outcome>,
): Promise<FormState> {
  const actor = await getCurrentUser();
  if (!actor) return SIGNED_OUT;

  let outcome: Outcome;
  try {
    outcome = await fn(actor);
  } catch (error) {
    return fromError(error);
  }

  if (outcome.status === "success") revalidatePath("/", "layout");
  // redirect() throws, so it has to happen outside the try/catch above.
  if (outcome.status === "success" && outcome.redirectTo) redirect(outcome.redirectTo);
  return { status: outcome.status, message: outcome.message, fieldErrors: outcome.fieldErrors };
}
