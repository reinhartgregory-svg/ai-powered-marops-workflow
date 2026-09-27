import { beforeAll, describe, expect, it } from "vitest";
import { seedDatabase } from "@/db/seed";
import { DEMO_FREELANCER_EMAIL, seedFreelancers, seedProjects } from "@/db/seed-data";
import { getDb } from "@/db";
import { listCategoriesWithCounts } from "@/server/services/catalog";
import { countFreelancers, getFeaturedFreelancers, searchFreelancers } from "@/server/services/freelancers";
import { getRecommendedProjects, searchProjects } from "@/server/services/projects";
import { listFreelancerProposals } from "@/server/services/proposals";

let demoFreelancerId: number;

beforeAll(async () => {
  await seedDatabase({ password: "password123" });
  const user = await getDb().query.users.findFirst({ where: (u, { eq }) => eq(u.email, DEMO_FREELANCER_EMAIL) });
  demoFreelancerId = user!.id;
});

describe("seed data", () => {
  it("creates the full demo dataset", async () => {
    expect(await countFreelancers()).toBe(seedFreelancers.length);
    const all = await searchProjects({ status: "all" });
    expect(all.total).toBe(seedProjects.length);
  });

  it("gives the demo freelancer proposals in several states", async () => {
    const statuses = (await listFreelancerProposals(demoFreelancerId)).map((p) => p.status).sort();
    expect(statuses).toEqual(["accepted", "shortlisted", "submitted"]);
  });
});

describe("freelancer search", () => {
  it("filters by skill", async () => {
    const result = await searchFreelancers({ skill: "react-native" });
    expect(result.items.map((f) => f.name)).toEqual(["Diego Martins"]);
    expect(result.items[0].skills.map((s) => s.slug)).toContain("react-native");
  });

  it("filters by category", async () => {
    const result = await searchFreelancers({ category: "data" });
    expect(result.items.map((f) => f.name).sort()).toEqual(["Ivan Kowalski", "Kenji Watanabe"]);
  });

  it("filters by rate range and availability, sorted by rate", async () => {
    const result = await searchFreelancers({ minRate: 50, maxRate: 80, availability: "available", sort: "rate_asc" });
    const rates = result.items.map((f) => f.hourlyRate);
    expect(rates.length).toBeGreaterThan(0);
    expect(rates).toEqual([...rates].sort((a, b) => a - b));
    expect(rates.every((r) => r >= 50 && r <= 80)).toBe(true);
    expect(result.items.every((f) => f.availability === "available")).toBe(true);
  });

  it("matches every keyword across name, headline, bio, and skills", async () => {
    const result = await searchFreelancers({ q: "shopify liquid" });
    expect(result.items.map((f) => f.name)).toEqual(["Rafael Souza"]);
    expect((await searchFreelancers({ q: "weiss" })).items.map((f) => f.name)).toEqual(["Hannah Weiss"]);
  });

  it("treats % and _ in queries literally", async () => {
    // Unescaped, "%" would match every profile; only one bio contains a literal percent sign.
    expect((await searchFreelancers({ q: "%" })).items.map((f) => f.name)).toEqual(["Tom Becker"]);
    expect((await searchFreelancers({ q: "_" })).total).toBe(0);
  });

  it("paginates results", async () => {
    const page1 = await searchFreelancers({ page: 1 });
    const page2 = await searchFreelancers({ page: 2 });
    expect(page1.pageCount).toBe(2);
    expect(page1.items).toHaveLength(12);
    expect(page2.items).toHaveLength(seedFreelancers.length - 12);
    const ids = new Set([...page1.items, ...page2.items].map((f) => f.profileId));
    expect(ids.size).toBe(seedFreelancers.length);
    // Out-of-range pages clamp to the last page.
    expect((await searchFreelancers({ page: 99 })).page).toBe(2);
  });

  it("features only freelancers who can take work", async () => {
    const featured = await getFeaturedFreelancers(20);
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.some((f) => f.availability === "unavailable")).toBe(false);
  });

  it("counts freelancers and open projects per category", async () => {
    const counts = await listCategoriesWithCounts();
    const dev = counts.find((c) => c.slug === "development")!;
    expect(dev.freelancerCount).toBe(seedFreelancers.filter((f) => f.category === "development").length);
    expect(dev.openProjectCount).toBe(
      seedProjects.filter((p) => p.category === "development" && p.status === "open").length,
    );
  });
});

describe("project search", () => {
  it("shows only open projects by default", async () => {
    const result = await searchProjects({});
    expect(result.total).toBe(seedProjects.filter((p) => p.status === "open").length);
    expect(result.items.every((p) => p.status === "open")).toBe(true);
  });

  it("filters by status, budget type, skill, and minimum budget", async () => {
    expect((await searchProjects({ status: "completed" })).items.map((p) => p.title)).toEqual([
      "90-second animated explainer video",
    ]);
    const hourly = await searchProjects({ budgetType: "hourly" });
    expect(hourly.items.every((p) => p.budgetType === "hourly")).toBe(true);
    expect((await searchProjects({ skill: "power-bi" })).items).toHaveLength(1);
    const big = await searchProjects({ minBudget: 10000 });
    expect(big.items.map((p) => p.title)).toEqual(["React Native app for patient appointment reminders"]);
  });

  it("sorts by budget", async () => {
    const result = await searchProjects({ sort: "budget_desc" });
    const maxes = result.items.map((p) => p.budgetMax);
    expect(maxes).toEqual([...maxes].sort((a, b) => b - a));
  });

  it("recommends matching open projects the freelancer hasn't applied to", async () => {
    const recommended = await getRecommendedProjects(demoFreelancerId, 10);
    const applied = new Set((await listFreelancerProposals(demoFreelancerId)).map((p) => p.projectId));
    expect(recommended.length).toBeGreaterThan(0);
    expect(recommended.every((p) => p.status === "open" && !applied.has(p.id))).toBe(true);
  });
});
