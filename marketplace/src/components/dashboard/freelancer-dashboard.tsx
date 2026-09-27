import { Mail, Send, Sparkles, UserRoundPlus } from "lucide-react";
import Link from "next/link";
import { ActionForm } from "@/components/forms/action-form";
import { ProjectCard } from "@/components/marketplace/project-card";
import { AvailabilityBadge, ProposalStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, PageHeader, StatCard } from "@/components/ui/layout";
import { DURATION_LABELS } from "@/lib/constants";
import { formatBid, formatCurrency, formatRelative, pluralize } from "@/lib/format";
import { withdrawProposalAction } from "@/server/actions/proposals";
import { getProfileByUserId } from "@/server/services/freelancers";
import { getRecommendedProjects } from "@/server/services/projects";
import { isPending, listFreelancerProposals } from "@/server/services/proposals";
import type { SessionUser } from "@/server/services/users";

export async function FreelancerDashboard({ user }: { user: SessionUser }) {
  const [profile, applications, recommended] = await Promise.all([
    getProfileByUserId(user.id),
    listFreelancerProposals(user.id),
    getRecommendedProjects(user.id, 4),
  ]);
  const pending = applications.filter((a) => isPending(a.status));
  const shortlisted = applications.filter((a) => a.status === "shortlisted").length;
  const hired = applications.filter((a) => a.status === "accepted").length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Freelancer dashboard"
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Keep your profile sharp and track every proposal you've sent."
        actions={<ButtonLink href="/projects">Find work</ButtonLink>}
      />

      {!profile ? (
        <Card className="flex flex-col gap-5 border-l-4 border-brand-600 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <UserRoundPlus aria-hidden="true" className="size-6" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">Create your freelancer profile</h2>
              <p className="mt-1 text-sm text-slate-600">
                You need a profile before you can send proposals, and it&apos;s how clients find you in search.
              </p>
            </div>
          </div>
          <ButtonLink href="/dashboard/profile">Create profile</ButtonLink>
        </Card>
      ) : (
        <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Your public profile</p>
            <p className="mt-1 truncate font-semibold text-slate-900">{profile.headline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">{formatCurrency(profile.hourlyRate)}/hr</span>
              <AvailabilityBadge availability={profile.availability} />
              <span>{pluralize(profile.skills.length, "skill")}</span>
              <span>{pluralize(profile.portfolio.length, "portfolio item")}</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <ButtonLink href={`/freelancers/${profile.id}`} variant="ghost" size="sm">
              View public profile
            </ButtonLink>
            <ButtonLink href="/dashboard/profile" variant="secondary" size="sm">
              Edit profile
            </ButtonLink>
          </div>
        </Card>
      )}

      <dl className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active proposals" value={pending.length} hint="Awaiting a client decision" />
        <StatCard label="Shortlisted" value={shortlisted} hint="Clients are interested" />
        <StatCard label="Hired" value={hired} hint="Accepted proposals" />
      </dl>

      <section aria-labelledby="applications-heading">
        <h2 id="applications-heading" className="text-lg font-semibold text-slate-900">
          Your proposals
        </h2>
        {applications.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<Send className="size-6" />}
            title="You haven't sent any proposals yet"
            description={
              profile
                ? "Browse open projects and send a proposal when you find a good fit."
                : "Create your profile first, then browse open projects."
            }
            action={
              <ButtonLink href={profile ? "/projects" : "/dashboard/profile"} variant="secondary">
                {profile ? "Browse projects" : "Create profile"}
              </ButtonLink>
            }
          />
        ) : (
          <ul className="mt-4 space-y-3">
            {applications.map((application) => (
              <li key={application.id}>
                <Card className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900">
                        <Link href={`/projects/${application.project.id}`} className="hover:text-brand-800">
                          {application.project.title}
                        </Link>
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {application.project.clientCompany ?? application.project.clientName}
                        <span aria-hidden="true"> · </span>
                        {formatBid(application.project.budgetType, application.bidAmount)}
                        <span aria-hidden="true"> · </span>
                        {DURATION_LABELS[application.estimatedDuration]}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Sent {formatRelative(application.createdAt)}
                        {application.updatedAt.getTime() !== application.createdAt.getTime() &&
                          ` · updated ${formatRelative(application.updatedAt)}`}
                      </p>
                    </div>
                    <ProposalStatusBadge status={application.status} />
                  </div>
                  {application.status === "accepted" && application.project.clientEmail && (
                    <p className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 ring-1 ring-emerald-200">
                      <Mail aria-hidden="true" className="size-4" />
                      You&apos;re hired! Contact {application.project.clientName} at{" "}
                      <a href={`mailto:${application.project.clientEmail}`} className="font-medium underline">
                        {application.project.clientEmail}
                      </a>
                    </p>
                  )}
                  {isPending(application.status) && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-500">
                        {application.project.status === "open"
                          ? "The client can still shortlist, decline, or hire."
                          : "The client has paused this project."}
                      </p>
                      <ActionForm
                        action={withdrawProposalAction}
                        fields={{ proposalId: application.id }}
                        label="Withdraw"
                        pendingText="Withdrawing…"
                        variant="ghost"
                        confirm={{
                          title: "Withdraw this proposal?",
                          description: `Your proposal for “${application.project.title}” will be removed from the client's list.`,
                          confirmLabel: "Withdraw proposal",
                        }}
                      />
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {profile && (
        <section aria-labelledby="recommended-heading">
          <div className="flex items-center gap-2">
            <Sparkles aria-hidden="true" className="size-5 text-amber-500" />
            <h2 id="recommended-heading" className="text-lg font-semibold text-slate-900">
              Recommended for you
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">Open projects that match your skills and category.</p>
          {recommended.length === 0 ? (
            <EmptyState
              className="mt-4"
              title="No matching projects right now"
              description="Add more skills to your profile or browse all open projects."
              action={
                <ButtonLink href="/projects" variant="secondary">
                  Browse all projects
                </ButtonLink>
              }
            />
          ) : (
            <ul className="mt-4 grid gap-4 xl:grid-cols-2">
              {recommended.map((project) => (
                <li key={project.id}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
