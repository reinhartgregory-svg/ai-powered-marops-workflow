import { ExternalLink, Inbox, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProposalReviewCard } from "@/components/dashboard/proposal-review-card";
import { ActionForm } from "@/components/forms/action-form";
import { AccessDenied } from "@/components/marketplace/access-denied";
import { ProjectStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, Container, EmptyState } from "@/components/ui/layout";
import { requireUser } from "@/lib/auth/session";
import { PROPOSAL_STATUS_LABELS } from "@/lib/constants";
import { formatBudget, formatDate } from "@/lib/format";
import { changeProjectStatusAction } from "@/server/actions/projects";
import { AppError } from "@/server/errors";
import { getProjectDetail } from "@/server/services/projects";
import { isPending, listProposalsForProject } from "@/server/services/proposals";

export const metadata: Metadata = { title: "Manage project" };

const STATUS_HELP = {
  open: "Accepting proposals. Shortlist the strongest ones, then hire.",
  in_progress: "You've hired someone. Mark the project complete when the work is done.",
  completed: "This project is complete.",
  closed: "Closed to new proposals. Reopen it to hire from the proposals you have.",
} as const;

export default async function ManageProjectPage({ params }: PageProps<"/dashboard/projects/[id]">) {
  const { id: rawId } = await params;
  const user = await requireUser(`/dashboard/projects/${rawId}`);
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  let data;
  try {
    data = await listProposalsForProject(user, id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return (
        <AccessDenied
          title="This isn't your project"
          description="Only the client who posted a project can review its proposals."
        />
      );
    }
    throw error;
  }
  const detail = await getProjectDetail(id);
  if (!detail) notFound();

  const { project, proposals } = data;
  const requiredSkills = new Set(detail.skills.map((s) => s.slug));
  const pendingCount = proposals.filter((p) => isPending(p.status)).length;
  const counts = proposals.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});
  const visible = proposals.filter((p) => p.status !== "withdrawn");

  return (
    <Container className="py-10 sm:py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/dashboard" className="hover:text-brand-700">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="truncate text-slate-700">
            {project.title}
          </li>
        </ol>
      </nav>

      <Card className="mt-6 p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <ProjectStatusBadge status={project.status} />
              <span className="text-sm text-slate-500">Posted {formatDate(project.createdAt)}</span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{project.title}</h1>
            <p className="mt-1 text-slate-600">
              {formatBudget(project.budgetType, project.budgetMin, project.budgetMax)} · {detail.category.name}
            </p>
            <p className="mt-3 text-sm text-slate-600">{STATUS_HELP[project.status]}</p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <ButtonLink href={`/projects/${project.id}`} variant="ghost" size="sm">
              <ExternalLink aria-hidden="true" className="size-4" />
              View listing
            </ButtonLink>
            {(project.status === "open" || project.status === "closed") && (
              <ButtonLink href={`/projects/${project.id}/edit`} variant="secondary" size="sm">
                <Pencil aria-hidden="true" className="size-4" />
                Edit
              </ButtonLink>
            )}
            {project.status === "open" && (
              <ActionForm
                action={changeProjectStatusAction}
                fields={{ projectId: project.id, action: "close" }}
                label="Close project"
                pendingText="Closing…"
                confirm={{
                  title: "Close this project?",
                  description:
                    "It will stop accepting new proposals and disappear from the default project search. Existing proposals are kept, and you can reopen it at any time.",
                  confirmLabel: "Close project",
                }}
              />
            )}
            {project.status === "closed" && (
              <ActionForm
                action={changeProjectStatusAction}
                fields={{ projectId: project.id, action: "reopen" }}
                label="Reopen project"
                pendingText="Reopening…"
                variant="primary"
              />
            )}
            {project.status === "in_progress" && (
              <ActionForm
                action={changeProjectStatusAction}
                fields={{ projectId: project.id, action: "complete" }}
                label="Mark as completed"
                pendingText="Saving…"
                variant="primary"
                confirm={{
                  title: "Mark this project as completed?",
                  description: "Do this once the work has been delivered. Completed projects can't be reopened.",
                  confirmLabel: "Mark completed",
                }}
              />
            )}
          </div>
        </div>
      </Card>

      <section aria-labelledby="proposals-heading" className="mt-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="proposals-heading" className="text-lg font-semibold text-slate-900">
            Proposals ({visible.length})
          </h2>
          {visible.length > 0 && (
            <p className="text-sm text-slate-600">
              {(["submitted", "shortlisted", "accepted", "declined"] as const)
                .filter((status) => counts[status])
                .map((status) => `${counts[status]} ${status === "submitted" ? "new" : PROPOSAL_STATUS_LABELS[status].toLowerCase()}`)
                .join(" · ")}
            </p>
          )}
        </div>
        {visible.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<Inbox className="size-6" />}
            title="No proposals yet"
            description={
              project.status === "open"
                ? "Freelancers whose skills match this project see it in their recommendations. Proposals will show up here."
                : "This project isn't accepting proposals right now."
            }
          />
        ) : (
          <ul className="mt-4 space-y-4">
            {visible.map((proposal) => (
              <li key={proposal.id}>
                <ProposalReviewCard
                  proposal={proposal}
                  budgetType={project.budgetType}
                  projectStatus={project.status}
                  requiredSkills={requiredSkills}
                  otherPendingCount={pendingCount - (isPending(proposal.status) ? 1 : 0)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
