import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  lte,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { getDb } from "@/db";
import {
  categories,
  freelancerProfiles,
  portfolioItems,
  profileSkills,
  proposals,
  skills,
  users,
  type Availability,
  type Category,
  type FreelancerProfile,
  type PortfolioItem,
} from "@/db/schema";
import { LIMITS, PAGE_SIZE } from "@/lib/constants";
import type { PortfolioItemInput, ProfileInput } from "@/lib/validation";
import { ConflictError, InvalidInputError, NotFoundError } from "../errors";
import { ensureSkillIds, getCategoryById } from "./catalog";
import { likeAny, outer, searchTerms, type Paginated } from "./query";
import { assertRole, type SessionUser } from "./users";

export const FREELANCER_SORTS = [
  "relevance",
  "rate_asc",
  "rate_desc",
  "newest",
] as const;
export type FreelancerSort = (typeof FREELANCER_SORTS)[number];

export type FreelancerFilters = {
  q?: string;
  category?: string;
  skill?: string;
  minRate?: number;
  maxRate?: number;
  availability?: Availability;
  sort?: FreelancerSort;
  page?: number;
};

export type SkillTag = { name: string; slug: string };

export type FreelancerSummary = {
  profileId: number;
  userId: number;
  name: string;
  headline: string;
  hourlyRate: number;
  availability: Availability;
  location: string | null;
  category: Pick<Category, "name" | "slug">;
  skills: SkillTag[];
  hires: number;
  portfolioCount: number;
};

const hiresCount = sql<number>`(
  SELECT count(*) FROM ${proposals}
  WHERE ${proposals.freelancerId} = ${outer(freelancerProfiles.userId)}
    AND ${proposals.status} = 'accepted'
)`.mapWith(Number);

const portfolioCount = sql<number>`(
  SELECT count(*) FROM ${portfolioItems}
  WHERE ${portfolioItems.profileId} = ${outer(freelancerProfiles.id)}
)`.mapWith(Number);

const availabilityRank = sql`CASE ${freelancerProfiles.availability}
  WHEN 'available' THEN 0 WHEN 'limited' THEN 1 ELSE 2 END`;

function hasSkill(slug: string): SQL {
  return sql`EXISTS (
    SELECT 1 FROM ${profileSkills}
    INNER JOIN ${skills} ON ${skills.id} = ${profileSkills.skillId}
    WHERE ${profileSkills.profileId} = ${outer(freelancerProfiles.id)} AND ${skills.slug} = ${slug}
  )`;
}

function matchesTerm(term: string): SQL {
  const skillMatch = sql`EXISTS (
    SELECT 1 FROM ${profileSkills}
    INNER JOIN ${skills} ON ${skills.id} = ${profileSkills.skillId}
    WHERE ${profileSkills.profileId} = ${outer(freelancerProfiles.id)} AND ${likeAny([skills.name], term)}
  )`;
  return or(
    likeAny(
      [users.name, freelancerProfiles.headline, freelancerProfiles.bio, categories.name],
      term,
    ),
    skillMatch,
  )!;
}

function filterConditions(
  filters: FreelancerFilters & { excludeUnavailable?: boolean },
): SQL | undefined {
  const conditions: SQL[] = [];
  for (const term of searchTerms(filters.q)) conditions.push(matchesTerm(term));
  if (filters.category) conditions.push(eq(categories.slug, filters.category));
  if (filters.skill) conditions.push(hasSkill(filters.skill));
  if (filters.minRate !== undefined)
    conditions.push(gte(freelancerProfiles.hourlyRate, filters.minRate));
  if (filters.maxRate !== undefined)
    conditions.push(lte(freelancerProfiles.hourlyRate, filters.maxRate));
  if (filters.availability)
    conditions.push(eq(freelancerProfiles.availability, filters.availability));
  if (filters.excludeUnavailable)
    conditions.push(ne(freelancerProfiles.availability, "unavailable"));
  return conditions.length ? and(...conditions) : undefined;
}

function orderFor(sort: FreelancerSort = "relevance"): SQL[] {
  switch (sort) {
    case "rate_asc":
      return [asc(freelancerProfiles.hourlyRate), desc(freelancerProfiles.id)];
    case "rate_desc":
      return [desc(freelancerProfiles.hourlyRate), desc(freelancerProfiles.id)];
    case "newest":
      return [desc(freelancerProfiles.createdAt), desc(freelancerProfiles.id)];
    default:
      return [
        asc(availabilityRank),
        desc(hiresCount),
        desc(portfolioCount),
        desc(freelancerProfiles.createdAt),
        desc(freelancerProfiles.id),
      ];
  }
}

async function skillsForProfiles(profileIds: number[]) {
  const map = new Map<number, SkillTag[]>();
  if (profileIds.length === 0) return map;
  const rows = await getDb()
    .select({
      profileId: profileSkills.profileId,
      name: skills.name,
      slug: skills.slug,
    })
    .from(profileSkills)
    .innerJoin(skills, eq(skills.id, profileSkills.skillId))
    .where(inArray(profileSkills.profileId, profileIds))
    .orderBy(sql`${skills.name} COLLATE NOCASE`);
  for (const row of rows) {
    const list = map.get(row.profileId) ?? [];
    list.push({ name: row.name, slug: row.slug });
    map.set(row.profileId, list);
  }
  return map;
}

async function querySummaries(
  where: SQL | undefined,
  order: SQL[],
  limit: number,
  offset = 0,
): Promise<FreelancerSummary[]> {
  const rows = await getDb()
    .select({
      profileId: freelancerProfiles.id,
      userId: users.id,
      name: users.name,
      headline: freelancerProfiles.headline,
      hourlyRate: freelancerProfiles.hourlyRate,
      availability: freelancerProfiles.availability,
      location: freelancerProfiles.location,
      categoryName: categories.name,
      categorySlug: categories.slug,
      hires: hiresCount,
      portfolioCount,
    })
    .from(freelancerProfiles)
    .innerJoin(users, eq(users.id, freelancerProfiles.userId))
    .innerJoin(categories, eq(categories.id, freelancerProfiles.categoryId))
    .where(where)
    .orderBy(...order)
    .limit(limit)
    .offset(offset);

  const skillMap = await skillsForProfiles(rows.map((r) => r.profileId));
  return rows.map(({ categoryName, categorySlug, ...row }) => ({
    ...row,
    category: { name: categoryName, slug: categorySlug },
    skills: skillMap.get(row.profileId) ?? [],
  }));
}

export async function searchFreelancers(
  filters: FreelancerFilters,
): Promise<Paginated<FreelancerSummary>> {
  const where = filterConditions(filters);
  const [{ total }] = await getDb()
    .select({ total: count() })
    .from(freelancerProfiles)
    .innerJoin(users, eq(users.id, freelancerProfiles.userId))
    .innerJoin(categories, eq(categories.id, freelancerProfiles.categoryId))
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

/** Freelancers who are open to work, ranked by track record. */
export async function getFeaturedFreelancers(
  limit = 6,
): Promise<FreelancerSummary[]> {
  return querySummaries(
    filterConditions({ excludeUnavailable: true }),
    orderFor("relevance"),
    limit,
  );
}

export async function countFreelancers(): Promise<number> {
  const [{ total }] = await getDb()
    .select({ total: count() })
    .from(freelancerProfiles);
  return total;
}

/* ---------- Single profile ---------- */

export type ProfileDetail = FreelancerProfile & {
  name: string;
  memberSince: Date;
  category: Category;
  skills: SkillTag[];
  portfolio: PortfolioItem[];
  hires: number;
};

async function loadProfile(where: SQL): Promise<ProfileDetail | null> {
  const db = getDb();
  const row = await db
    .select({
      profile: freelancerProfiles,
      name: users.name,
      memberSince: users.createdAt,
      category: categories,
      hires: hiresCount,
    })
    .from(freelancerProfiles)
    .innerJoin(users, eq(users.id, freelancerProfiles.userId))
    .innerJoin(categories, eq(categories.id, freelancerProfiles.categoryId))
    .where(where)
    .get();
  if (!row) return null;

  const [skillMap, portfolio] = await Promise.all([
    skillsForProfiles([row.profile.id]),
    db
      .select()
      .from(portfolioItems)
      .where(eq(portfolioItems.profileId, row.profile.id))
      .orderBy(desc(portfolioItems.createdAt), desc(portfolioItems.id)),
  ]);
  return {
    ...row.profile,
    name: row.name,
    memberSince: row.memberSince,
    category: row.category,
    hires: row.hires,
    skills: skillMap.get(row.profile.id) ?? [],
    portfolio,
  };
}

export function getProfileById(profileId: number) {
  return loadProfile(eq(freelancerProfiles.id, profileId));
}

export function getProfileByUserId(userId: number) {
  return loadProfile(eq(freelancerProfiles.userId, userId));
}

export async function getProfileIdForUser(
  userId: number,
): Promise<number | null> {
  const row = await getDb()
    .select({ id: freelancerProfiles.id })
    .from(freelancerProfiles)
    .where(eq(freelancerProfiles.userId, userId))
    .get();
  return row?.id ?? null;
}

/** Creates the freelancer's profile or updates it. Skills are replaced wholesale. */
export async function saveProfile(
  actor: SessionUser,
  input: ProfileInput,
): Promise<number> {
  assertRole(actor, "freelancer", "Only freelancer accounts have a public profile.");
  if (!(await getCategoryById(input.categoryId))) {
    throw new InvalidInputError("Choose a category from the list.", {
      categoryId: ["Choose a category from the list."],
    });
  }
  const skillIds = await ensureSkillIds(input.skills);
  const fields = {
    headline: input.headline,
    bio: input.bio,
    categoryId: input.categoryId,
    hourlyRate: input.hourlyRate,
    availability: input.availability,
    location: input.location,
  };

  return getDb().transaction(async (tx) => {
    const existing = await tx
      .select({ id: freelancerProfiles.id })
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, actor.id))
      .get();

    let profileId: number;
    if (existing) {
      profileId = existing.id;
      await tx
        .update(freelancerProfiles)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(freelancerProfiles.id, profileId));
      await tx.delete(profileSkills).where(eq(profileSkills.profileId, profileId));
    } else {
      const [created] = await tx
        .insert(freelancerProfiles)
        .values({ ...fields, userId: actor.id })
        .returning({ id: freelancerProfiles.id });
      profileId = created.id;
    }
    await tx
      .insert(profileSkills)
      .values(skillIds.map((skillId) => ({ profileId, skillId })));
    return profileId;
  });
}

export async function addPortfolioItem(
  actor: SessionUser,
  input: PortfolioItemInput,
): Promise<number> {
  assertRole(actor, "freelancer");
  const profileId = await getProfileIdForUser(actor.id);
  if (!profileId) {
    throw new ConflictError("Create your profile before adding portfolio items.");
  }
  const db = getDb();
  const [{ total }] = await db
    .select({ total: count() })
    .from(portfolioItems)
    .where(eq(portfolioItems.profileId, profileId));
  if (total >= LIMITS.maxPortfolioItems) {
    throw new ConflictError(
      `You can showcase up to ${LIMITS.maxPortfolioItems} portfolio items. Remove one to add another.`,
    );
  }
  const [created] = await db
    .insert(portfolioItems)
    .values({ profileId, ...input })
    .returning({ id: portfolioItems.id });
  return created.id;
}

export async function deletePortfolioItem(
  actor: SessionUser,
  itemId: number,
): Promise<void> {
  assertRole(actor, "freelancer");
  const profileId = await getProfileIdForUser(actor.id);
  const deleted = profileId
    ? await getDb()
        .delete(portfolioItems)
        .where(
          and(eq(portfolioItems.id, itemId), eq(portfolioItems.profileId, profileId)),
        )
        .returning({ id: portfolioItems.id })
    : [];
  if (deleted.length === 0) throw new NotFoundError("That portfolio item no longer exists.");
}
