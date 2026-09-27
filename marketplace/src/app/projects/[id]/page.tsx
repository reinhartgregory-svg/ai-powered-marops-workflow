import { CalendarDays, Clock, Lock, Mail, Tag, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { ProposalForm } from "@/components/forms/proposal-form";
import { ProjectStatusBadge, ProposalStatusBadge, SkillTag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, Container } from "@/components/ui/layout";
import type { Proposal } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { BUDGET_TYPE_LABELS, DURATION_LABELS } from "@/lib/constants";
import {
  formatBid,
  formatBudget,
  formatDate,
  formatMonthYear,
  formatRelative,
  pluralize,
} from "@/lib/format";
import { withdrawProposalAction } from "@/server/actions/proposals";
import { getProfileByUserId } from "@/server/services/freelancers";
import { getProjectDetail, type ProjectDetail } from "@/server/services/projects";
import {
  getClientContactForHire,
  getProposalForFreelancer,
  isPending,
} from "@/server/services/proposals";
import type { SessionUser } from "@/server/services/users";

const loadProject = cache(async (rawId: string) => {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return getProjectDetail(id);
});

export async function generateMetadata({ params }: PageProps<"/projects/[id]">): Promise<Metadata> {
  const project = await loadProject((await params).id);
  if (!project) return { title: "Project not found" };
  return { title: project.title, description: project.description.slice(0, 160) };
}

function YourProposal({
  proposal,
  project,
  clientContact,
}: {
  proposal: Proposal;
  project: ProjectDetail;
  clientContact: { name: string; email: string } | null;
}) {
  return (
    <Card as="section" aria-labelledby="your-proposal-heading" className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="your-proposal-heading" className="text-lg font-semibold text-slate-900">
          Your proposal
        </h2>
        <ProposalStatusBadge status={proposal.status} />
      </div>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">Your bid</dt>
          <dd className="mt-0.5 font-semibold text-slate-900">{formatBid(project.budgetType, proposal.bidAmount)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Estimated duration</dt>
          <dd className="mt-0.5 font-semibold text-slate-900">{DURATION_LABELS[proposal.estimatedDuration]}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Sent</dt>
          <dd className="mt-0.5 font-semibold text-slate-900">{formatDate(proposal.createdAt)}</dd>
        </div>
      </dl>
      <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-6 whitespace-pre-line text-slate-700">
        {proposal.coverLetter}
      </p>

      {proposal.status === "accepted" && clientContact && (
        <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
          <p className="font-medium">You&apos;re hired! Reach out to {clientContact.name} to get started:</p>
          <a href={`mailto:${clientContact.email}`} className="mt-2 inline-flex items-center gap-1.5 font-medium underline">
            <Mail aria-hidden="true" className="size-4" />
            {clientContact.email}
          </a>
        </div>
      )}
      {proposal.status === "declined" && (
        <p className="mt-4 text-sm text-slate-600">
          The client went with another option this time. Keep an eye on{" "}
          <Link href="/projects" className="font-medium text-brand-700">
            new projects
          </Link>
          .
        </p>
      )}
      {isPending(proposal.status) && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-600">
            {proposal.status === "shortlisted"
              ? "Good news — the client shortlisted you."
              : "The client hasn't reviewed your proposal yet."}
          </p>
          <ActionForm
            action={withdrawProposalAction}
            fields={{ proposalId: proposal.id }}
            label="Withdraw proposal"
            pendingText="Withdrawing…"
            variant="ghost"
            confirm={{
              title: "Withdraw this proposal?",
              description:
                "The client will no longer see it. You can send a new proposal later while the project is still open.",
              confirmLabel: "Withdraw proposal",
            }}
          />
        </div>
      )}
    </Card>
  );
}

async function ProposalArea({ project, viewer }: { project: ProjectDetail; viewer: SessionUser | null }) {
  const nextPath = `/projects/${project.id}`;

  if (!viewer) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Interested in this project?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Log in with a freelancer account to send a proposal.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href={`/login?next=${encodeURIComponent(nextPath)}`}>Log in to apply</ButtonLink>
          <ButtonLink href="/signup?role=freelancer" variant="secondary">
            Join as a freelancer
          </ButtonLink>
        </div>
      </Card>
    );
  }

  if (viewer.role === "client") {
    if (viewer.id !== project.client.id) {
      return (
        <Card className="p-6 text-sm text-slate-600">
          You&apos;re signed in as a client. Only freelancer accounts can send proposals.
        </Card>
      );
    }
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">You posted this project</h2>
        <p className="mt-2 text-sm text-slate-600">
          {project.proposalCount === 0
            ? "No proposals yet. Freelancers with matching skills see it in their recommendations."
            : `You've received ${pluralize(project.proposalCount, "proposal")}.`}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href={`/dashboard/projects/${project.id}`}>Manage proposals</ButtonLink>
          {(project.status === "open" || project.status === "closed") && (
            <ButtonLink href={`/projects/${project.id}/edit`} variant="secondary">
              Edit project
            </ButtonLink>
          )}
        </div>
      </Card>
    );
  }

  const [proposal, profile] = await Promise.all([
    getProposalForFreelancer(viewer.id, project.id),
    getProfileByUserId(viewer.id),
  ]);

  if (proposal && proposal.status !== "withdrawn") {
    const clientContact =
      proposal.status === "accepted" ? await getClientContactForHire(viewer.id, project.id) : null;
    return <YourProposal proposal={proposal} project={project} clientContact={clientContact} />;
  }

  if (project.status !== "open") {
    return (
      <Card className="flex items-start gap-3 p-6 text-sm text-slate-600">
        <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        This project isn&apos;t accepting proposals right now.
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Create your profile to apply</h2>
        <p className="mt-2 text-sm text-slate-600">
          Clients review your profile alongside your proposal, so you&apos;ll need one before applying.
        </p>
        <ButtonLink href="/dashboard/profile" className="mt-4">
          Create your profile
        </ButtonLink>
      </Card>
    );
  }

  return (
    <Card as="section" aria-labelledby="apply-heading" className="p-6 sm:p-8">
      <h2 id="apply-heading" className="text-lg font-semibold text-slate-900">
        Send a proposal
      </h2>
      {proposal?.status === "withdrawn" && (
        <p className="mt-2 text-sm text-slate-600">
          You withdrew an earlier proposal for this project. You can send a new one.
        </p>
      )}
      <div className="mt-5">
        <ProposalForm
          projectId={project.id}
          budgetType={project.budgetType}
          budgetMin={project.budgetMin}
          budgetMax={project.budgetMax}
          suggestedRate={profile.hourlyRate}
        />
      </div>
    </Card>
  );
}

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const [project, viewer] = await Promise.all([loadProject((await params).id), getCurrentUser()]);
  if (!project) notFound();

  return (
    <Container className="py-10 sm:py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/projects" className="hover:text-brand-700">
              Projects
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/projects?category=${project.category.slug}`} className="hover:text-brand-700">
              {project.category.name}
            </Link>
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <Card as="article" className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <ProjectStatusBadge status={project.status} />
              <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                <Clock aria-hidden="true" className="size-4" />
                Posted {formatRelative(project.createdAt)}
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {project.title}
            </h1>
            <dl className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-slate-500">Budget</dt>
                <dd className="mt-0.5 text-base font-semibold text-slate-900">
                  {formatBudget(project.budgetType, project.budgetMin, project.budgetMax)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Type</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{BUDGET_TYPE_LABELS[project.budgetType]}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Proposals</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{project.proposalCount}</dd>
              </div>
            </dl>
            <h2 className="mt-8 text-sm font-semibold tracking-wide text-slate-500 uppercase">Description</h2>
            <p className="mt-3 leading-7 whitespace-pre-line text-slate-700">{project.description}</p>
            <h2 className="mt-8 text-sm font-semibold tracking-wide text-slate-500 uppercase">Skills required</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {project.skills.map((skill) => (
                <li key={skill.slug}>
                  <SkillTag href={`/projects?skill=${skill.slug}`}>{skill.name}</SkillTag>
                </li>
              ))}
            </ul>
          </Card>

          <ProposalArea project={project} viewer={viewer} />
        </div>

        <aside aria-label="About the client" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-900">About the client</h2>
            <p className="mt-3 font-medium text-slate-900">{project.client.companyName ?? project.client.name}</p>
            {project.client.companyName && (
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
                <UserRound aria-hidden="true" className="size-4" />
                {project.client.name}
              </p>
            )}
            <dl className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <CalendarDays aria-hidden="true" className="size-4" /> Member since
                </dt>
                <dd className="font-medium text-slate-900">{formatMonthYear(project.client.memberSince)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <Tag aria-hidden="true" className="size-4" /> Projects posted
                </dt>
                <dd className="font-medium text-slate-900">{project.client.projectsPosted}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <UserRound aria-hidden="true" className="size-4" /> Hires made
                </dt>
                <dd className="font-medium text-slate-900">{project.client.hires}</dd>
              </div>
            </dl>
          </Card>
          <p className="px-1 text-xs leading-5 text-slate-500">
            Payments aren&apos;t processed on this platform yet. After a hire, client and freelancer
            see each other&apos;s email to agree on terms and payment directly.
          </p>
        </aside>
      </div>
    </Container>
  );
}
