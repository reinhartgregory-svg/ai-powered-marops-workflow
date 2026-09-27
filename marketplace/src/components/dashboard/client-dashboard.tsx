import { FolderPlus, Inbox } from "lucide-react";
import Link from "next/link";
import { ProjectStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, PageHeader, StatCard } from "@/components/ui/layout";
import { formatBudget, formatDate, pluralize } from "@/lib/format";
import { listClientProjects } from "@/server/services/projects";
import { countNewProposalsForClient } from "@/server/services/proposals";
import type { SessionUser } from "@/server/services/users";

export async function ClientDashboard({ user }: { user: SessionUser }) {
  const [projects, newProposals] = await Promise.all([
    listClientProjects(user.id),
    countNewProposalsForClient(user.id),
  ]);
  const open = projects.filter((p) => p.status === "open").length;
  const active = projects.filter((p) => p.status === "in_progress").length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={user.companyName ?? "Client dashboard"}
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Manage your projects and review the proposals you've received."
        actions={<ButtonLink href="/projects/new">Post a project</ButtonLink>}
      />

      <dl className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open projects" value={open} hint="Accepting proposals" />
        <StatCard label="New proposals" value={newProposals} hint="Waiting for your review" />
        <StatCard label="In progress" value={active} hint="Projects with a hire" />
      </dl>

      <section aria-labelledby="projects-heading">
        <h2 id="projects-heading" className="text-lg font-semibold text-slate-900">
          Your projects
        </h2>
        {projects.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<FolderPlus className="size-6" />}
            title="You haven't posted a project yet"
            description="Describe what you need and your budget. Freelancers will start sending proposals right away."
            action={<ButtonLink href="/projects/new">Post your first project</ButtonLink>}
          />
        ) : (
          <ul className="mt-4 space-y-3">
            {projects.map((project) => (
              <li key={project.id}>
                <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <ProjectStatusBadge status={project.status} />
                      <span className="text-xs text-slate-500">Posted {formatDate(project.createdAt)}</span>
                    </div>
                    <h3 className="mt-2 font-semibold text-slate-900">
                      <Link href={`/dashboard/projects/${project.id}`} className="hover:text-brand-800">
                        {project.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatBudget(project.budgetType, project.budgetMin, project.budgetMax)}
                      <span aria-hidden="true"> · </span>
                      {project.hiredName ? (
                        <>Hired {project.hiredName}</>
                      ) : (
                        <>
                          {pluralize(project.proposalCount, "proposal")}
                          {project.newCount > 0 && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800 ring-1 ring-sky-200">
                              <Inbox aria-hidden="true" className="size-3" />
                              {project.newCount} new
                            </span>
                          )}
                          {project.shortlistedCount > 0 && (
                            <span className="ml-2 text-xs text-amber-700">
                              {project.shortlistedCount} shortlisted
                            </span>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <ButtonLink href={`/projects/${project.id}`} variant="ghost" size="sm">
                      View listing
                    </ButtonLink>
                    <ButtonLink href={`/dashboard/projects/${project.id}`} variant="secondary" size="sm">
                      {project.status === "open" ? "Review proposals" : "Manage"}
                    </ButtonLink>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
