import { sql } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { slugify } from "@/lib/format";
import { getDb } from "./index";
import {
  categories,
  freelancerProfiles,
  portfolioItems,
  profileSkills,
  projectSkills,
  projects,
  proposals,
  sessions,
  skills,
  users,
} from "./schema";
import {
  seedCategories,
  seedClients,
  seedFreelancers,
  seedProjects,
} from "./seed-data";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number, now: number): Date {
  // Spread times through the day so ordering looks natural.
  return new Date(now - days * DAY_MS - ((days * 37) % 600) * 60 * 1000);
}

/** Deletes every row, keeping the schema. */
export async function clearDatabase() {
  const db = getDb();
  await db.batch([
    db.delete(sessions),
    db.delete(proposals),
    db.delete(projectSkills),
    db.delete(projects),
    db.delete(portfolioItems),
    db.delete(profileSkills),
    db.delete(freelancerProfiles),
    db.delete(skills),
    db.delete(categories),
    db.delete(users),
    db.run(sql`DELETE FROM sqlite_sequence`),
  ]);
}

/**
 * Replaces all data with the demo dataset. Every demo account uses `password`.
 */
export async function seedDatabase({ password }: { password: string }) {
  const db = getDb();
  const now = Date.now();
  await clearDatabase();

  const categoryRows = await db
    .insert(categories)
    .values(seedCategories.map((c, index) => ({ ...c, sortOrder: index })))
    .returning({ id: categories.id, slug: categories.slug });
  const categoryId = new Map(categoryRows.map((c) => [c.slug, c.id]));

  const skillNames = new Map<string, string>();
  for (const name of [
    ...seedFreelancers.flatMap((f) => f.skills),
    ...seedProjects.flatMap((p) => p.skills),
  ]) {
    skillNames.set(slugify(name), name);
  }
  const skillRows = await db
    .insert(skills)
    .values([...skillNames].map(([slug, name]) => ({ slug, name })))
    .returning({ id: skills.id, slug: skills.slug });
  const skillId = new Map(skillRows.map((s) => [s.slug, s.id]));
  const skillIdsFor = (names: string[]) => names.map((n) => skillId.get(slugify(n))!);

  // Hash in parallel; scrypt runs on libuv's thread pool.
  const people = [...seedClients, ...seedFreelancers];
  const hashes = await Promise.all(people.map(() => hashPassword(password)));

  const userRows = await db
    .insert(users)
    .values([
      ...seedClients.map((c, i) => ({
        email: c.email,
        name: c.name,
        role: "client" as const,
        companyName: c.companyName,
        passwordHash: hashes[i],
        createdAt: daysAgo(c.joinedDaysAgo, now),
      })),
      ...seedFreelancers.map((f, i) => ({
        email: f.email,
        name: f.name,
        role: "freelancer" as const,
        passwordHash: hashes[seedClients.length + i],
        createdAt: daysAgo(f.joinedDaysAgo, now),
      })),
    ])
    .returning({ id: users.id, email: users.email });
  const userIdByEmail = new Map(userRows.map((u) => [u.email, u.id]));
  const userId = new Map(people.map((p) => [p.key, userIdByEmail.get(p.email)!]));

  for (const f of seedFreelancers) {
    const joined = daysAgo(f.joinedDaysAgo, now);
    const [profile] = await db
      .insert(freelancerProfiles)
      .values({
        userId: userId.get(f.key)!,
        headline: f.headline,
        bio: f.bio,
        categoryId: categoryId.get(f.category)!,
        hourlyRate: f.hourlyRate,
        availability: f.availability,
        location: f.location,
        createdAt: joined,
        updatedAt: joined,
      })
      .returning({ id: freelancerProfiles.id });
    await db
      .insert(profileSkills)
      .values(skillIdsFor(f.skills).map((id) => ({ profileId: profile.id, skillId: id })));
    if (f.portfolio.length) {
      await db.insert(portfolioItems).values(
        f.portfolio.map((item, index) => ({
          profileId: profile.id,
          title: item.title,
          description: item.description,
          url: item.url ?? null,
          createdAt: new Date(joined.getTime() + (index + 1) * DAY_MS),
        })),
      );
    }
  }

  let proposalCount = 0;
  for (const p of seedProjects) {
    const created = daysAgo(p.daysAgo, now);
    const [project] = await db
      .insert(projects)
      .values({
        clientId: userId.get(p.client)!,
        title: p.title,
        description: p.description,
        categoryId: categoryId.get(p.category)!,
        budgetType: p.budgetType,
        budgetMin: p.budgetMin,
        budgetMax: p.budgetMax,
        status: p.status,
        createdAt: created,
        updatedAt: created,
      })
      .returning({ id: projects.id });
    await db
      .insert(projectSkills)
      .values(skillIdsFor(p.skills).map((id) => ({ projectId: project.id, skillId: id })));
    if (p.proposals.length) {
      await db.insert(proposals).values(
        p.proposals.map((proposal) => {
          const sent = daysAgo(proposal.daysAgo, now);
          return {
            projectId: project.id,
            freelancerId: userId.get(proposal.freelancer)!,
            coverLetter: proposal.coverLetter,
            bidAmount: proposal.bidAmount,
            estimatedDuration: proposal.estimatedDuration,
            status: proposal.status,
            createdAt: sent,
            updatedAt: sent,
          };
        }),
      );
      proposalCount += p.proposals.length;
    }
  }

  return {
    categories: categoryRows.length,
    skills: skillRows.length,
    clients: seedClients.length,
    freelancers: seedFreelancers.length,
    projects: seedProjects.length,
    proposals: proposalCount,
  };
}
