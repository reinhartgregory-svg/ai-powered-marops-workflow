import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  freelancerProfiles,
  profileSkills,
  projects,
  proposals,
  skills,
  users,
  type Availability,
  type BudgetType,
  type Project,
  type ProjectStatus,
  type Proposal,
  type ProposalStatus,
} from "@/db/schema";
import type { ProposalInput } from "@/lib/validation";
import { ConflictError, ForbiddenError, NotFoundError } from "../errors";
import { getProfileIdForUser, type SkillTag } from "./freelancers";
import { getOwnedProject } from "./projects";
import { assertRole, type SessionUser } from "./users";

const PENDING: ProposalStatus[] = ["submitted", "shortlisted"];

export function isPending(status: ProposalStatus): boolean {
  return PENDING.includes(status);
}

function isUniqueViolation(error: unknown): boolean {
  const cause = (error as { cause?: unknown })?.cause;
  const text = `${error instanceof Error ? error.message : ""} ${cause instanceof Error ? cause.message : ""}`;
  return /UNIQUE constraint failed/i.test(text);
}

/* ---------- Freelancer side ---------- */

export async function submitProposal(
  actor: SessionUser,
  projectId: number,
  input: ProposalInput,
): Promise<number> {
  assertRole(actor, "freelancer", "Only freelancer accounts can send proposals.");
  if (!(await getProfileIdForUser(actor.id))) {
    throw new ConflictError(
      "Create your freelancer profile before sending proposals — clients use it to evaluate you.",
    );
  }

  const db = getDb();
  const project = await db
    .select({ id: projects.id, status: projects.status })
    .from(projects)
    .where(eq(projects.id, projectId))
    .get();
  if (!project) throw new NotFoundError("That project doesn't exist.");
  if (project.status !== "open") {
    throw new ConflictError("This project is no longer accepting proposals.");
  }

  const existing = await db
    .select({ id: proposals.id, status: proposals.status })
    .from(proposals)
    .where(and(eq(proposals.projectId, projectId), eq(proposals.freelancerId, actor.id)))
    .get();

  if (existing && existing.status !== "withdrawn") {
    throw new ConflictError("You've already sent a proposal for this project.");
  }

  if (existing) {
    // A withdrawn proposal can be replaced with a fresh one while the project is open.
    const now = new Date();
    await db
      .update(proposals)
      .set({ ...input, status: "submitted", createdAt: now, updatedAt: now })
      .where(eq(proposals.id, existing.id));
    return existing.id;
  }

  try {
    const [created] = await db
      .insert(proposals)
      .values({ ...input, projectId, freelancerId: actor.id })
      .returning({ id: proposals.id });
    return created.id;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError("You've already sent a proposal for this project.");
    }
    throw error;
  }
}

export async function withdrawProposal(
  actor: SessionUser,
  proposalId: number,
): Promise<void> {
  assertRole(actor, "freelancer");
  const db = getDb();
  const proposal = await db
    .select({ freelancerId: proposals.freelancerId, status: proposals.status })
    .from(proposals)
    .where(eq(proposals.id, proposalId))
    .get();
  if (!proposal || proposal.freelancerId !== actor.id) {
    throw new NotFoundError("That proposal doesn't exist.");
  }
  if (!isPending(proposal.status)) {
    throw new ConflictError("Only proposals that are still under review can be withdrawn.");
  }
  await db
    .update(proposals)
    .set({ status: "withdrawn", updatedAt: new Date() })
    .where(and(eq(proposals.id, proposalId), inArray(proposals.status, PENDING)));
}

export async function getProposalForFreelancer(
  freelancerId: number,
  projectId: number,
): Promise<Proposal | null> {
  const row = await getDb()
    .select()
    .from(proposals)
    .where(and(eq(proposals.projectId, projectId), eq(proposals.freelancerId, freelancerId)))
    .get();
  return row ?? null;
}

/** The client's email, shared with a freelancer only after the client hires them. */
export async function getClientContactForHire(
  freelancerId: number,
  projectId: number,
): Promise<{ name: string; email: string } | null> {
  const row = await getDb()
    .select({ name: users.name, email: users.email })
    .from(proposals)
    .innerJoin(projects, eq(projects.id, proposals.projectId))
    .innerJoin(users, eq(users.id, projects.clientId))
    .where(
      and(
        eq(proposals.projectId, projectId),
        eq(proposals.freelancerId, freelancerId),
        eq(proposals.status, "accepted"),
      ),
    )
    .get();
  return row ?? null;
}

export type FreelancerApplication = Proposal & {
  project: {
    id: number;
    title: string;
    status: ProjectStatus;
    budgetType: BudgetType;
    clientName: string;
    clientCompany: string | null;
    /** Only revealed once the client has hired this freelancer. */
    clientEmail: string | null;
  };
};

export async function listFreelancerProposals(
  freelancerId: number,
): Promise<FreelancerApplication[]> {
  const rows = await getDb()
    .select({
      proposal: proposals,
      projectTitle: projects.title,
      projectStatus: projects.status,
      budgetType: projects.budgetType,
      clientName: users.name,
      clientCompany: users.companyName,
      clientEmail: users.email,
    })
    .from(proposals)
    .innerJoin(projects, eq(projects.id, proposals.projectId))
    .innerJoin(users, eq(users.id, projects.clientId))
    .where(eq(proposals.freelancerId, freelancerId))
    .orderBy(desc(proposals.updatedAt), desc(proposals.id));

  return rows.map((row) => ({
    ...row.proposal,
    project: {
      id: row.proposal.projectId,
      title: row.projectTitle,
      status: row.projectStatus,
      budgetType: row.budgetType,
      clientName: row.clientName,
      clientCompany: row.clientCompany,
      clientEmail: row.proposal.status === "accepted" ? row.clientEmail : null,
    },
  }));
}

/* ---------- Client side ---------- */

export type ProposalForReview = Proposal & {
  freelancer: {
    userId: number;
    name: string;
    /** Only revealed once this proposal is accepted. */
    email: string | null;
    profileId: number | null;
    headline: string | null;
    hourlyRate: number | null;
    availability: Availability | null;
    location: string | null;
    skills: SkillTag[];
  };
};

const REVIEW_ORDER = sql`CASE ${proposals.status}
  WHEN 'accepted' THEN 0 WHEN 'shortlisted' THEN 1 WHEN 'submitted' THEN 2
  WHEN 'declined' THEN 3 ELSE 4 END`;

export async function listProposalsForProject(
  actor: SessionUser,
  projectId: number,
): Promise<{ project: Project; proposals: ProposalForReview[] }> {
  const project = await getOwnedProject(actor, projectId);
  const db = getDb();
  const rows = await db
    .select({
      proposal: proposals,
      name: users.name,
      email: users.email,
      profileId: freelancerProfiles.id,
      headline: freelancerProfiles.headline,
      hourlyRate: freelancerProfiles.hourlyRate,
      availability: freelancerProfiles.availability,
      location: freelancerProfiles.location,
    })
    .from(proposals)
    .innerJoin(users, eq(users.id, proposals.freelancerId))
    .leftJoin(freelancerProfiles, eq(freelancerProfiles.userId, proposals.freelancerId))
    .where(eq(proposals.projectId, projectId))
    .orderBy(asc(REVIEW_ORDER), asc(proposals.createdAt), asc(proposals.id));

  const profileIds = rows.map((r) => r.profileId).filter((id): id is number => id !== null);
  const skillRows = profileIds.length
    ? await db
        .select({ profileId: profileSkills.profileId, name: skills.name, slug: skills.slug })
        .from(profileSkills)
        .innerJoin(skills, eq(skills.id, profileSkills.skillId))
        .where(inArray(profileSkills.profileId, profileIds))
        .orderBy(sql`${skills.name} COLLATE NOCASE`)
    : [];

  return {
    project,
    proposals: rows.map((row) => ({
      ...row.proposal,
      freelancer: {
        userId: row.proposal.freelancerId,
        name: row.name,
        email: row.proposal.status === "accepted" ? row.email : null,
        profileId: row.profileId,
        headline: row.headline,
        hourlyRate: row.hourlyRate,
        availability: row.availability,
        location: row.location,
        skills: skillRows
          .filter((s) => s.profileId === row.profileId)
          .map(({ name, slug }) => ({ name, slug })),
      },
    })),
  };
}

async function loadForClient(actor: SessionUser, proposalId: number) {
  assertRole(actor, "client", "Only clients can review proposals.");
  const row = await getDb()
    .select({ proposal: proposals, project: projects })
    .from(proposals)
    .innerJoin(projects, eq(projects.id, proposals.projectId))
    .where(eq(proposals.id, proposalId))
    .get();
  if (!row) throw new NotFoundError("That proposal doesn't exist.");
  if (row.project.clientId !== actor.id) {
    throw new ForbiddenError("Only the client who posted this project can review its proposals.");
  }
  return row;
}

export const REVIEW_ACTIONS = ["shortlist", "unshortlist", "decline"] as const;
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

const REVIEW_TRANSITIONS: Record<
  ReviewAction,
  { from: ProposalStatus[]; to: ProposalStatus; error: string }
> = {
  shortlist: {
    from: ["submitted"],
    to: "shortlisted",
    error: "Only new proposals can be shortlisted.",
  },
  unshortlist: {
    from: ["shortlisted"],
    to: "submitted",
    error: "This proposal isn't on your shortlist.",
  },
  decline: {
    from: PENDING,
    to: "declined",
    error: "Only proposals that are still under review can be declined.",
  },
};

export async function reviewProposal(
  actor: SessionUser,
  proposalId: number,
  action: ReviewAction,
): Promise<ProposalStatus> {
  const { proposal, project } = await loadForClient(actor, proposalId);
  if (project.status !== "open" && project.status !== "closed") {
    throw new ConflictError("You've already hired someone for this project.");
  }
  const transition = REVIEW_TRANSITIONS[action];
  if (!transition.from.includes(proposal.status)) throw new ConflictError(transition.error);

  const updated = await getDb()
    .update(proposals)
    .set({ status: transition.to, updatedAt: new Date() })
    .where(and(eq(proposals.id, proposalId), inArray(proposals.status, transition.from)))
    .returning({ id: proposals.id });
  if (updated.length === 0) throw new ConflictError(transition.error);
  return transition.to;
}

/**
 * Hires the freelancer behind a proposal: the proposal becomes "accepted", the project moves
 * to "in progress", and every other pending proposal on the project is declined.
 */
export async function acceptProposal(
  actor: SessionUser,
  proposalId: number,
): Promise<{ projectId: number; declinedCount: number }> {
  const { proposal } = await loadForClient(actor, proposalId);

  return getDb().transaction(async (tx) => {
    // Re-read inside the write transaction so two concurrent hires can't both succeed.
    const project = await tx
      .select({ status: projects.status })
      .from(projects)
      .where(eq(projects.id, proposal.projectId))
      .get();
    const current = await tx
      .select({ status: proposals.status })
      .from(proposals)
      .where(eq(proposals.id, proposalId))
      .get();
    if (project?.status !== "open") {
      throw new ConflictError(
        project?.status === "closed"
          ? "Reopen this project before hiring."
          : "You've already hired someone for this project.",
      );
    }
    if (!current || !isPending(current.status)) {
      throw new ConflictError("Only proposals that are still under review can be accepted.");
    }

    const now = new Date();
    await tx
      .update(proposals)
      .set({ status: "accepted", updatedAt: now })
      .where(eq(proposals.id, proposalId));
    const declined = await tx
      .update(proposals)
      .set({ status: "declined", updatedAt: now })
      .where(
        and(
          eq(proposals.projectId, proposal.projectId),
          ne(proposals.id, proposalId),
          inArray(proposals.status, PENDING),
        ),
      )
      .returning({ id: proposals.id });
    await tx
      .update(projects)
      .set({ status: "in_progress", updatedAt: now })
      .where(eq(projects.id, proposal.projectId));

    return { projectId: proposal.projectId, declinedCount: declined.length };
  });
}

/** Number of proposals across the client's projects that are waiting for a first look. */
export async function countNewProposalsForClient(clientId: number): Promise<number> {
  const row = await getDb()
    .select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(proposals)
    .innerJoin(projects, eq(projects.id, proposals.projectId))
    .where(and(eq(projects.clientId, clientId), eq(proposals.status, "submitted")))
    .get();
  return row?.total ?? 0;
}
