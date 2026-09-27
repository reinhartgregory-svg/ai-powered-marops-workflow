import { Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { ActionForm } from "@/components/forms/action-form";
import { Avatar } from "@/components/ui/avatar";
import { AvailabilityBadge, ProposalStatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/layout";
import type { BudgetType, ProjectStatus } from "@/db/schema";
import { cn } from "@/lib/cn";
import { DURATION_LABELS } from "@/lib/constants";
import { formatBid, formatCurrency, formatRelative, pluralize } from "@/lib/format";
import { acceptProposalAction, reviewProposalAction } from "@/server/actions/proposals";
import { isPending, type ProposalForReview } from "@/server/services/proposals";

export function ProposalReviewCard({
  proposal,
  budgetType,
  projectStatus,
  requiredSkills,
  otherPendingCount,
}: {
  proposal: ProposalForReview;
  budgetType: BudgetType;
  projectStatus: ProjectStatus;
  requiredSkills: Set<string>;
  otherPendingCount: number;
}) {
  const { freelancer } = proposal;
  const firstName = freelancer.name.split(" ")[0];
  const pending = isPending(proposal.status);
  const canReview = pending && (projectStatus === "open" || projectStatus === "closed");
  const canHire = pending && projectStatus === "open";
  const muted = proposal.status === "declined" || proposal.status === "withdrawn";

  return (
    <Card
      as="article"
      className={cn(
        "p-5 sm:p-6",
        proposal.status === "accepted" && "ring-2 ring-emerald-500",
        proposal.status === "shortlisted" && "ring-amber-300",
        muted && "bg-slate-50",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <Avatar name={freelancer.name} seed={freelancer.userId} />
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900">
              {freelancer.profileId ? (
                <Link href={`/freelancers/${freelancer.profileId}`} className="hover:text-brand-800">
                  {freelancer.name}
                </Link>
              ) : (
                freelancer.name
              )}
            </h3>
            {freelancer.headline && <p className="text-sm text-slate-600">{freelancer.headline}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              {freelancer.hourlyRate !== null && <span>Profile rate {formatCurrency(freelancer.hourlyRate)}/hr</span>}
              {freelancer.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin aria-hidden="true" className="size-3" />
                  {freelancer.location}
                </span>
              )}
              {freelancer.availability && <AvailabilityBadge availability={freelancer.availability} />}
            </div>
          </div>
        </div>
        <ProposalStatusBadge status={proposal.status} clientView />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">Bid</dt>
          <dd className="mt-0.5 font-semibold text-slate-900">{formatBid(budgetType, proposal.bidAmount)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Timeline</dt>
          <dd className="mt-0.5 font-semibold text-slate-900">{DURATION_LABELS[proposal.estimatedDuration]}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Received</dt>
          <dd className="mt-0.5 font-semibold text-slate-900">{formatRelative(proposal.createdAt)}</dd>
        </div>
      </dl>

      <p className="mt-4 text-sm leading-6 whitespace-pre-line text-slate-700">{proposal.coverLetter}</p>

      {freelancer.skills.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={`${firstName}'s skills`}>
          {freelancer.skills.map((skill) => {
            const match = requiredSkills.has(skill.slug);
            return (
              <li
                key={skill.slug}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium",
                  match ? "bg-brand-50 text-brand-800 ring-1 ring-brand-200" : "bg-slate-100 text-slate-700",
                )}
              >
                {skill.name}
                {match && <span className="sr-only"> (matches a required skill)</span>}
              </li>
            );
          })}
        </ul>
      )}

      {proposal.status === "accepted" && freelancer.email && (
        <p className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 ring-1 ring-emerald-200">
          <Mail aria-hidden="true" className="size-4" />
          Contact {firstName} at{" "}
          <a href={`mailto:${freelancer.email}`} className="font-medium underline">
            {freelancer.email}
          </a>
        </p>
      )}

      {canReview && (
        <div className="mt-5 flex flex-wrap items-start gap-2 border-t border-slate-100 pt-4">
          {canHire && (
            <ActionForm
              action={acceptProposalAction}
              fields={{ proposalId: proposal.id }}
              label={`Hire ${firstName}`}
              variant="primary"
              pendingText="Hiring…"
              confirm={{
                title: `Hire ${freelancer.name}?`,
                description: (
                  <>
                    <p>
                      The project will move to <strong>In progress</strong> and stop accepting proposals.
                      You and {firstName} will see each other&apos;s email address to arrange the work.
                    </p>
                    {otherPendingCount > 0 && (
                      <p className="mt-2">
                        The {pluralize(otherPendingCount, "other pending proposal")} on this project will be
                        declined automatically.
                      </p>
                    )}
                  </>
                ),
                confirmLabel: `Hire ${firstName}`,
              }}
            />
          )}
          {proposal.status === "submitted" ? (
            <ActionForm
              action={reviewProposalAction}
              fields={{ proposalId: proposal.id, action: "shortlist" }}
              label="Shortlist"
              pendingText="Saving…"
            />
          ) : (
            <ActionForm
              action={reviewProposalAction}
              fields={{ proposalId: proposal.id, action: "unshortlist" }}
              label="Remove from shortlist"
              pendingText="Saving…"
            />
          )}
          <ActionForm
            action={reviewProposalAction}
            fields={{ proposalId: proposal.id, action: "decline" }}
            label="Decline"
            variant="ghost"
            pendingText="Declining…"
            confirm={{
              title: `Decline ${firstName}'s proposal?`,
              description: `${firstName} will see that the proposal was declined. This can't be undone.`,
              confirmLabel: "Decline proposal",
            }}
          />
        </div>
      )}
    </Card>
  );
}
