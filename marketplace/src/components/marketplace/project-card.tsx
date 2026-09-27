import { Clock, MessageSquareText, Tag } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ProjectStatusBadge, SkillTag } from "@/components/ui/badge";
import { Card } from "@/components/ui/layout";
import { BUDGET_TYPE_LABELS } from "@/lib/constants";
import { excerpt, formatBudget, formatRelative, pluralize } from "@/lib/format";
import type { ProjectSummary } from "@/server/services/projects";

export function ProjectCard({
  project,
  href = `/projects/${project.id}`,
  footer,
  headingLevel = "h3",
}: {
  project: ProjectSummary;
  href?: string;
  footer?: ReactNode;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <Card as="article" className="group relative p-5 transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Heading className="text-base font-semibold text-slate-900">
            <Link
              href={href}
              className="after:absolute after:inset-0 after:rounded-xl hover:text-brand-800 focus-visible:outline-none"
            >
              {project.title}
            </Link>
          </Heading>
          <p className="mt-1 text-sm text-slate-500">
            {project.client.companyName ?? project.client.name}
            <span aria-hidden="true"> · </span>
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden="true" className="size-3.5" />
              Posted {formatRelative(project.createdAt)}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <span className="text-base font-semibold text-slate-900">
            {formatBudget(project.budgetType, project.budgetMin, project.budgetMax)}
          </span>
          <span className="text-xs text-slate-500">{BUDGET_TYPE_LABELS[project.budgetType]}</span>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{excerpt(project.description, 220)}</p>

      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Required skills">
        {project.skills.map((skill) => (
          <li key={skill.slug}>
            <SkillTag>{skill.name}</SkillTag>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        {project.status !== "open" && <ProjectStatusBadge status={project.status} />}
        <span className="inline-flex items-center gap-1">
          <Tag aria-hidden="true" className="size-3.5" />
          {project.category.name}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquareText aria-hidden="true" className="size-3.5" />
          {project.proposalCount === 0
            ? "No proposals yet"
            : pluralize(project.proposalCount, "proposal")}
        </span>
      </div>
      {footer && <div className="relative z-10 mt-4 border-t border-slate-100 pt-4">{footer}</div>}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl group-has-[a:focus-visible]:outline-2 group-has-[a:focus-visible]:outline-offset-2 group-has-[a:focus-visible]:outline-brand-600"
      />
    </Card>
  );
}
