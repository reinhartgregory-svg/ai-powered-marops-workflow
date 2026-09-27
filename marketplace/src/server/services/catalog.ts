import { asc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  categories,
  freelancerProfiles,
  profileSkills,
  projectSkills,
  projects,
  skills,
  type Category,
  type Skill,
} from "@/db/schema";
import { slugify } from "@/lib/format";
import { outer } from "./query";

export async function listCategories(): Promise<Category[]> {
  return getDb()
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export type CategoryWithCounts = Category & {
  freelancerCount: number;
  openProjectCount: number;
};

export async function listCategoriesWithCounts(): Promise<CategoryWithCounts[]> {
  return getDb()
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      description: categories.description,
      sortOrder: categories.sortOrder,
      freelancerCount: sql<number>`(
        SELECT count(*) FROM ${freelancerProfiles}
        WHERE ${freelancerProfiles.categoryId} = ${outer(categories.id)}
      )`.mapWith(Number),
      openProjectCount: sql<number>`(
        SELECT count(*) FROM ${projects}
        WHERE ${projects.categoryId} = ${outer(categories.id)} AND ${projects.status} = 'open'
      )`.mapWith(Number),
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getCategoryById(id: number): Promise<Category | undefined> {
  return getDb().select().from(categories).where(eq(categories.id, id)).get();
}

export async function listSkills(): Promise<Skill[]> {
  return getDb()
    .select()
    .from(skills)
    .orderBy(sql`${skills.name} COLLATE NOCASE`);
}

/** Skills ordered by how many profiles and projects use them. */
export async function listPopularSkills(limit: number): Promise<Skill[]> {
  const usage = sql<number>`(
    (SELECT count(*) FROM ${profileSkills} WHERE ${profileSkills.skillId} = ${outer(skills.id)}) +
    (SELECT count(*) FROM ${projectSkills} WHERE ${projectSkills.skillId} = ${outer(skills.id)})
  )`;
  return getDb()
    .select({ id: skills.id, name: skills.name, slug: skills.slug })
    .from(skills)
    .orderBy(sql`${usage} DESC`, asc(skills.name))
    .limit(limit);
}

/**
 * Resolves skill names to ids, creating skills that don't exist yet.
 * Matching is by slug, so "react" and "React" are the same skill.
 */
export async function ensureSkillIds(names: string[]): Promise<number[]> {
  const bySlug = new Map<string, string>();
  for (const name of names) {
    const slug = slugify(name);
    if (slug && !bySlug.has(slug)) bySlug.set(slug, name.trim());
  }
  if (bySlug.size === 0) return [];

  const db = getDb();
  await db
    .insert(skills)
    .values([...bySlug].map(([slug, name]) => ({ slug, name })))
    .onConflictDoNothing({ target: skills.slug });

  const rows = await db
    .select({ id: skills.id, slug: skills.slug })
    .from(skills)
    .where(inArray(skills.slug, [...bySlug.keys()]));
  const idBySlug = new Map(rows.map((row) => [row.slug, row.id]));
  return [...bySlug.keys()].map((slug) => idBySlug.get(slug)!);
}
