import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  sql,
  type SQL,
} from "drizzle-orm";
import { getDb } from "@/db";
import {
  categories,
  freelancerProfiles,
  profileSkills,
  projectSkills,
  projects,
  proposals,
  skills,
  users,
  type BudgetType,
  type Category,
  type Project,
  type ProjectStatus,
} from "@/db/schema";
import { PAGE_SIZE } from "@/lib/constants";
import type { ProjectInput } from "@/lib/validation";
import {
  ConflictError,
  ForbiddenError,
  InvalidInputError,
  NotFoundError,
} from "../errors";
import { ensureSkillIds, getCategoryById } from "./catalog";
import type { SkillTag } from "./freelancers";
import { likeAny, outer, searchTerms, type Paginated } from "./query";
import { assertRole, type SessionUser } from "./users";

export const PROJECT_SORTS = ["newest", "budget_desc", "budget_asc"] as const;
export type ProjectSort = (typeof PROJECT_SORTS)[number];

export type ProjectFilters = {
  q?: string;
  category?: string;
  skill?: string;
  budgetType?: BudgetType;
  /** Defaults to "open". */
  status?: ProjectStatus | "all";
  /** Only projects whose budget can reach at least this amount. */
  minBudget?: number;
  sort?: ProjectSort;
  page?: number;
};

export type ProjectSummary = Pick<
  Project,
  | "id"
  | "title"
  | "description"
  | "budgetType"
  | "budgetMin"
  | "budgetMax"
  | "status"
  | "createdAt"
> & {
  category: Pick<Category, "name" | "slug">;
  skills: SkillTag[];
  proposalCount: number;
  client: { name: string; companyName: string | null };
};

/** Proposals that are still meaningful to show as "received" (withdrawn ones are excluded). */
const proposalCount = sql<number>`(
  SELECT count(*) FROM ${proposals}
  WHERE ${proposals.projectId} = ${outer(projects.id)} AND ${proposals.status} != 'withdrawn'
)`.mapWith(Number);

function hasSkill(slug: string): SQL {
  return sql`EXISTS (
    SELECT 1 FROM ${projectSkills}
    INNER JOIN ${skills} ON ${skills.id} = ${projectSkills.skillId}
    WHERE ${projectSkills.projectId} = ${outer(projects.id)} AND ${skills.slug} = ${slug}
  )`;
}

function matchesTerm(term: string): SQL {
  return sql`(${likeAny([projects.title, projects.description, categories.name], term)} OR EXISTS (
    SELECT 1 FROM ${projectSkills}
    INNER JOIN ${skills} ON ${skills.id} = ${projectSkills.skillId}
    WHERE ${projectSkills.projectId} = ${outer(projects.id)} AND ${likeAny([skills.name], term)}
  ))`;
}

function filterConditions(filters: ProjectFilters): SQL | undefined {
  const conditions: SQL[] = [];
  const status = filters.status ?? "open";
  if (status !== "all") conditions.push(eq(projects.status, status));
  for (const term of searchTerms(filters.q)) conditions.push(matchesTerm(term));
  if (filters.category) conditions.push(eq(categories.slug, filters.category));
  if (filters.skill) conditions.push(hasSkill(filters.skill));
  if (filters.budgetType) conditions.push(eq(projects.budgetType, filters.budgetType));
  if (filters.minBudget !== undefined)
    conditions.push(gte(projects.budgetMax, filters.minBudget));
  return conditions.length ? and(...conditions) : undefined;
}

function orderFor(sort: ProjectSort = "newest"): SQL[] {
  switch (sort) {
    case "budget_desc":
      return [desc(projects.budgetMax), desc(projects.id)];
    case "budget_asc":
      return [asc(projects.budgetMin), desc(projects.id)];
    default:
      return [desc(projects.createdAt), desc(projects.id)];
  }
}

async function skillsForProjects(projectIds: number[]) {
  const map = new Map<number, SkillTag[]>();
  if (projectIds.length === 0) return map;
  const rows = await getDb()
    .select({
      projectId: projectSkills.projectId,
      name: skills.name,
      slug: skills.slug,
    })
    .from(projectSkills)
    .innerJoin(skills, eq(skills.id, projectSkills.skillId))
    .where(inArray(projectSkills.projectId, projectIds))
    .orderBy(sql`${skills.name} COLLATE NOCASE`);
  for (const row of rows) {
    const list = map.get(row.projectId) ?? [];
    list.push({ name: row.name, slug: row.slug });
    map.set(row.projectId, list);
  }
  return map;
}

async function querySummaries(
  where: SQL | undefined,
  order: SQL[],
  limit: number,
  offset = 0,
): Promise<ProjectSummary[]> {
  const rows = await getDb()
    .select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      budgetType: projects.budgetType,
      budgetMin: projects.budgetMin,
      budgetMax: projects.budgetMax,
      status: projects.status,
      createdAt: projects.createdAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
      clientName: users.name,
      clientCompany: users.companyName,
      proposalCount,
    })
    .from(projects)
    .innerJoin(categories, eq(categories.id, projects.categoryId))
    .innerJoin(users, eq(users.id, projects.clientId))
    .where(where)
    .orderBy(...order)
    .limit(limit)
    .offset(offset);

  const skillMap = await skillsForProjects(rows.map((r) => r.id));
  return rows.map(
    ({ categoryName, categorySlug, clientName, clientCompany, ...row }) => ({
      ...row,
      category: { name: categoryName, slug: categorySlug },
      client: { name: clientName, companyName: clientCompany },
      skills: skillMap.get(row.id) ?? [],
    }),
  );
}

export async function searchProjects(
  filters: ProjectFilters,
): Promise<Paginated<ProjectSummary>> {
  const where = filterConditions(filters);
  const [{ total }] = await getDb()
    .select({ total: count() })
    .from(projects)
    .innerJoin(categories, eq(categories.id, projects.categoryId))
    .where(where);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page ?? 1), pageCount);
  const items = await querySummaries(
    where,
    orderFor(filters.sort),
    PAGE_SIZE,
    (page - 1) * PAGE_SIZE,
  );
  return { items, total, page, pageCount };
}

export function getLatestOpenProjects(limit = 4) {
  return querySummaries(eq(projects.status, "open"), orderFor("newest"), limit);
}

export async function countOpenProjects(): Promise<number> {
  const [{ total }] = await getDb()
    .select({ total: count() })
    .from(projects)
    .where(eq(projects.status, "open"));
  return total;
}

/**
 * Open projects that share skills (or the category) with the freelancer's profile
 * and that they haven't applied to yet, best matches first.
 */
export async function getRecommendedProjects(
  freelancerUserId: number,
  limit = 4,
): Promise<ProjectSummary[]> {
  const profile = await getDb()
    .select({ id: freelancerProfiles.id, categoryId: freelancerProfiles.categoryId })
    .from(freelancerProfiles)
    .where(eq(freelancerProfiles.userId, freelancerUserId))
    .get();
  if (!profile) return [];

  const matchingSkills = sql<number>`(
    SELECT count(*) FROM ${projectSkills}
    WHERE ${projectSkills.projectId} = ${outer(projects.id)}
      AND ${projectSkills.skillId} IN (
        SELECT ${profileSkills.skillId} FROM ${profileSkills}
        WHERE ${profileSkills.profileId} = ${profile.id}
      )
  )`;
  const where = and(
    eq(projects.status, "open"),
    sql`NOT EXISTS (
      SELECT 1 FROM ${proposals}
      WHERE ${proposals.projectId} = ${outer(projects.id)} AND ${proposals.freelancerId} = ${freelancerUserId}
    )`,
    sql`(${matchingSkills} > 0 OR ${projects.categoryId} = ${profile.categoryId})`,
  );
  return querySummaries(
    where,
    [sql`${matchingSkills} DESC`, desc(projects.createdAt), desc(projects.id)],
    limit,
  );
}

/* ---------- Single project ---------- */

export type ProjectDetail = Project & {
  category: Category;
  skills: SkillTag[];
  proposalCount: number;
  client: {
    id: number;
    name: string;
    companyName: string | null;
    memberSince: Date;
    projectsPosted: number;
    hires: number;
  };
};

export async function getProjectDetail(
  projectId: number,
): Promise<ProjectDetail | null> {
  const db = getDb();
  const row = await db
    .select({
      project: projects,
      category: categories,
      proposalCount,
      clientName: users.name,
      clientCompany: users.companyName,
      clientSince: users.createdAt,
    })
    .from(projects)
    .innerJoin(categories, eq(categories.id, projects.categoryId))
    .innerJoin(users, eq(users.id, projects.clientId))
    .where(eq(projects.id, projectId))
    .get();
  if (!row) return null;

  const clientId = row.project.clientId;
  const [skillMap, stats] = await Promise.all([
    skillsForProjects([projectId]),
    db
      .select({
        projectsPosted: count(),
        hires: sql<number>`sum(CASE WHEN ${projects.status} IN ('in_progress', 'completed') THEN 1 ELSE 0 END)`.mapWith(
          Number,
        ),
      })
      .from(projects)
      .where(eq(projects.clientId, clientId))
      .get(),
  ]);

  return {
    ...row.project,
    category: row.category,
    proposalCount: row.proposalCount,
    skills: skillMap.get(projectId) ?? [],
    client: {
      id: clientId,
      name: row.clientName,
      companyName: row.clientCompany,
      memberSince: row.clientSince,
      projectsPosted: stats?.projectsPosted ?? 0,
      hires: stats?.hires ?? 0,
    },
  };
}

/** Loads a project and checks that `actor` is the client who posted it. */
export async function getOwnedProject(
  actor: SessionUser,
  projectId: number,
): Promise<Project> {
  const project = await getDb()
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .get();
  if (!project) throw new NotFoundError("That project doesn't exist.");
  if (project.clientId !== actor.id) {
    throw new ForbiddenError("Only the client who posted this project can manage it.");
  }
  return project;
}

async function validateCategory(categoryId: number) {
  if (!(await getCategoryById(categoryId))) {
    throw new InvalidInputError("Choose a category from the list.", {
      categoryId: ["Choose a category from the list."],
    });
  }
}

export async function createProject(
  actor: SessionUser,
  input: ProjectInput,
): Promise<number> {
  assertRole(actor, "client", "Only client accounts can post projects.");
  await validateCategory(input.categoryId);
  const skillIds = await ensureSkillIds(input.skills);

  return getDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(projects)
      .values({
        clientId: actor.id,
        title: input.title,
        description: input.description,
        categoryId: input.categoryId,
        budgetType: input.budgetType,
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,
      })
      .returning({ id: projects.id });
    await tx
      .insert(projectSkills)
      .values(skillIds.map((skillId) => ({ projectId: created.id, skillId })));
    return created.id;
  });
}

export async function updateProject(
  actor: SessionUser,
  projectId: number,
  input: ProjectInput,
): Promise<void> {
  const project = await getOwnedProject(actor, projectId);
  if (project.status === "in_progress" || project.status === "completed") {
    throw new ConflictError(
      "This project can't be edited because you've already hired someone for it.",
    );
  }
  await validateCategory(input.categoryId);
  const skillIds = await ensureSkillIds(input.skills);

  await getDb().transaction(async (tx) => {
    await tx
      .update(projects)
      .set({
        title: input.title,
        description: input.description,
        categoryId: input.categoryId,
        budgetType: input.budgetType,
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));
    await tx.delete(projectSkills).where(eq(projectSkills.projectId, projectId));
    await tx
      .insert(projectSkills)
      .values(skillIds.map((skillId) => ({ projectId, skillId })));
  });
}

export const PROJECT_ACTIONS = ["close", "reopen", "complete"] as const;
export type ProjectAction = (typeof PROJECT_ACTIONS)[number];

const TRANSITIONS: Record<
  ProjectAction,
  { from: ProjectStatus; to: ProjectStatus; error: string }
> = {
  close: {
    from: "open",
    to: "closed",
    error: "Only open projects can be closed.",
  },
  reopen: {
    from: "closed",
    to: "open",
    error: "Only closed projects can be reopened.",
  },
  complete: {
    from: "in_progress",
    to: "completed",
    error: "Only projects that are in progress can be marked complete.",
  },
};

export async function changeProjectStatus(
  actor: SessionUser,
  projectId: number,
  action: ProjectAction,
): Promise<ProjectStatus> {
  const project = await getOwnedProject(actor, projectId);
  const transition = TRANSITIONS[action];
  if (project.status !== transition.from) throw new ConflictError(transition.error);
  const updated = await getDb()
    .update(projects)
    .set({ status: transition.to, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.status, transition.from)))
    .returning({ id: projects.id });
  if (updated.length === 0) throw new ConflictError(transition.error);
  return transition.to;
}

/* ---------- Client dashboard ---------- */

export type ClientProjectRow = ProjectSummary & {
  newCount: number;
  shortlistedCount: number;
  hiredName: string | null;
};

export async function listClientProjects(
  clientId: number,
): Promise<ClientProjectRow[]> {
  const summaries = await querySummaries(
    eq(projects.clientId, clientId),
    [
      sql`CASE ${projects.status} WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'closed' THEN 2 ELSE 3 END`,
      desc(projects.createdAt),
      desc(projects.id),
    ],
    500,
  );
  if (summaries.length === 0) return [];

  const rows = await getDb()
    .select({
      projectId: proposals.projectId,
      status: proposals.status,
      freelancerName: users.name,
    })
    .from(proposals)
    .innerJoin(users, eq(users.id, proposals.freelancerId))
    .where(
      inArray(
        proposals.projectId,
        summaries.map((p) => p.id),
      ),
    );

  return summaries.map((summary) => {
    const mine = rows.filter((r) => r.projectId === summary.id);
    return {
      ...summary,
      newCount: mine.filter((r) => r.status === "submitted").length,
      shortlistedCount: mine.filter((r) => r.status === "shortlisted").length,
      hiredName: mine.find((r) => r.status === "accepted")?.freelancerName ?? null,
    };
  });
}
