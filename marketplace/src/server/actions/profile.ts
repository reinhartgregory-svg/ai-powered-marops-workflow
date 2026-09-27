"use server";

import type { FormState } from "@/lib/form-state";
import {
  portfolioItemSchema,
  profileSchema,
  readSkills,
  readString,
} from "@/lib/validation";
import {
  addPortfolioItem,
  deletePortfolioItem,
  getProfileIdForUser,
  saveProfile,
} from "../services/freelancers";
import { invalid, readId, runAction } from "./helpers";

export async function saveProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runAction(async (actor) => {
    const parsed = profileSchema.safeParse({
      headline: readString(formData, "headline"),
      bio: readString(formData, "bio"),
      categoryId: readString(formData, "categoryId"),
      hourlyRate: readString(formData, "hourlyRate"),
      availability: readString(formData, "availability"),
      location: readString(formData, "location"),
      skills: readSkills(formData),
    });
    if (!parsed.success) return invalid(parsed.error);

    const isNew = !(await getProfileIdForUser(actor.id));
    await saveProfile(actor, parsed.data);
    return {
      status: "success",
      message: isNew
        ? "Your profile is live. Clients can now find you in search, and you can send proposals."
        : "Profile saved.",
    };
  });
}

export async function addPortfolioItemAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runAction(async (actor) => {
    const parsed = portfolioItemSchema.safeParse({
      title: readString(formData, "title"),
      description: readString(formData, "description"),
      url: readString(formData, "url"),
    });
    if (!parsed.success) return invalid(parsed.error);
    await addPortfolioItem(actor, parsed.data);
    return { status: "success", message: `Added “${parsed.data.title}” to your portfolio.` };
  });
}

export async function deletePortfolioItemAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runAction(async (actor) => {
    const itemId = readId(formData, "itemId");
    if (!itemId) return { status: "error", message: "That portfolio item no longer exists." };
    await deletePortfolioItem(actor, itemId);
    return { status: "success", message: "Portfolio item removed." };
  });
}
