"use server";

import type { FormState } from "@/lib/form-state";
import { pluralize } from "@/lib/format";
import { proposalSchema, readString } from "@/lib/validation";
import {
  acceptProposal,
  REVIEW_ACTIONS,
  reviewProposal,
  submitProposal,
  withdrawProposal,
  type ReviewAction,
} from "../services/proposals";
import { invalid, readId, runAction } from "./helpers";

export async function submitProposalAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const projectId = readId(formData, "projectId");
  if (!projectId) return { status: "error", message: "That project doesn't exist." };

  return runAction(async (actor) => {
    const parsed = proposalSchema.safeParse({
      coverLetter: readString(formData, "coverLetter"),
      bidAmount: readString(formData, "bidAmount"),
      estimatedDuration: readString(formData, "estimatedDuration"),
    });
    if (!parsed.success) return invalid(parsed.error);
    await submitProposal(actor, projectId, parsed.data);
    return { status: "success", redirectTo: `/projects/${projectId}?notice=proposal-sent` };
  });
}

export async function withdrawProposalAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runAction(async (actor) => {
    const proposalId = readId(formData, "proposalId");
    if (!proposalId) return { status: "error", message: "That proposal doesn't exist." };
    await withdrawProposal(actor, proposalId);
    return { status: "success", message: "Proposal withdrawn." };
  });
}

const REVIEW_MESSAGES: Record<ReviewAction, string> = {
  shortlist: "Added to your shortlist.",
  unshortlist: "Removed from your shortlist.",
  decline: "Proposal declined.",
};

export async function reviewProposalAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runAction(async (actor) => {
    const proposalId = readId(formData, "proposalId");
    const action = readString(formData, "action") as ReviewAction;
    if (!proposalId || !REVIEW_ACTIONS.includes(action)) {
      return { status: "error", message: "That action isn't available." };
    }
    await reviewProposal(actor, proposalId, action);
    return { status: "success", message: REVIEW_MESSAGES[action] };
  });
}

export async function acceptProposalAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runAction(async (actor) => {
    const proposalId = readId(formData, "proposalId");
    if (!proposalId) return { status: "error", message: "That proposal doesn't exist." };
    const { declinedCount } = await acceptProposal(actor, proposalId);
    return {
      status: "success",
      message:
        declinedCount > 0
          ? `Hired! The project is now in progress and ${pluralize(declinedCount, "other proposal")} ${declinedCount === 1 ? "was" : "were"} declined.`
          : "Hired! The project is now in progress.",
    };
  });
}
