import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { clearDatabase } from "@/db/seed";
import { saveProfile } from "@/server/services/freelancers";
import { createProject } from "@/server/services/projects";
import { createUser, type SessionUser } from "@/server/services/users";
import type { ProfileInput, ProjectInput } from "@/lib/validation";

let counter = 0;
const unique = () => `${Date.now()}-${++counter}`;

/** Empties the database and adds two categories. Returns their ids. */
export async function resetWithCategories() {
  await clearDatabase();
  const rows = await getDb()
    .insert(categories)
    .values([
      { slug: "development", name: "Development & IT", description: "Code" },
      { slug: "design", name: "Design & Creative", description: "Design" },
    ])
    .returning({ id: categories.id, slug: categories.slug });
  return Object.fromEntries(rows.map((r) => [r.slug, r.id])) as Record<
    "development" | "design",
    number
  >;
}

export function makeClient(name = "Casey Client"): Promise<SessionUser> {
  return createUser({
    role: "client",
    name,
    email: `client-${unique()}@example.com`,
    password: "password123",
    companyName: "Acme Test Co",
  });
}

export function makeFreelancerUser(name = "Frankie Freelancer"): Promise<SessionUser> {
  return createUser({
    role: "freelancer",
    name,
    email: `freelancer-${unique()}@example.com`,
    password: "password123",
    companyName: null,
  });
}

export function profileInput(categoryId: number, overrides: Partial<ProfileInput> = {}): ProfileInput {
  return {
    headline: "Full-stack developer for web apps",
    bio: "I build reliable web applications with React and Node.js for small businesses and startups.",
    categoryId,
    hourlyRate: 80,
    availability: "available",
    location: "Remote",
    skills: ["React", "Node.js"],
    ...overrides,
  };
}

export async function makeFreelancer(categoryId: number, overrides: Partial<ProfileInput> = {}, name?: string) {
  const user = await makeFreelancerUser(name);
  const profileId = await saveProfile(user, profileInput(categoryId, overrides));
  return { user, profileId };
}

export function projectInput(categoryId: number, overrides: Partial<ProjectInput> = {}): ProjectInput {
  return {
    title: "Build a marketing website",
    description: "We need a fast marketing website with a blog and a contact form, built with a modern framework.",
    categoryId,
    budgetType: "fixed",
    budgetMin: 2000,
    budgetMax: 4000,
    skills: ["React", "CSS"],
    ...overrides,
  };
}

export async function makeProject(client: SessionUser, categoryId: number, overrides: Partial<ProjectInput> = {}) {
  return createProject(client, projectInput(categoryId, overrides));
}

export const proposalInput = {
  coverLetter: "I have built many similar websites and would love to help you launch this one quickly and well.",
  bidAmount: 3000,
  estimatedDuration: "2_4_weeks" as const,
};
