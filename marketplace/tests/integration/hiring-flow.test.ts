import { beforeEach, describe, expect, it } from "vitest";
import { ConflictError, ForbiddenError, InvalidInputError, NotFoundError } from "@/server/errors";
import {
  addPortfolioItem,
  deletePortfolioItem,
  getProfileById,
  saveProfile,
} from "@/server/services/freelancers";
import {
  changeProjectStatus,
  createProject,
  getProjectDetail,
  listClientProjects,
  updateProject,
} from "@/server/services/projects";
import {
  acceptProposal,
  getClientContactForHire,
  listFreelancerProposals,
  listProposalsForProject,
  reviewProposal,
  submitProposal,
  withdrawProposal,
} from "@/server/services/proposals";
import {
  makeClient,
  makeFreelancer,
  makeFreelancerUser,
  makeProject,
  profileInput,
  projectInput,
  proposalInput,
  resetWithCategories,
} from "./helpers";

let cat: Awaited<ReturnType<typeof resetWithCategories>>;

beforeEach(async () => {
  cat = await resetWithCategories();
});

describe("freelancer profiles", () => {
  it("creates, then updates a profile and replaces its skills", async () => {
    const user = await makeFreelancerUser();
    const id = await saveProfile(user, profileInput(cat.development, { skills: ["React", "react", "TypeScript"] }));
    let profile = await getProfileById(id);
    expect(profile?.skills.map((s) => s.name)).toEqual(["React", "TypeScript"]);

    const sameId = await saveProfile(user, profileInput(cat.design, { skills: ["Figma"], hourlyRate: 95 }));
    expect(sameId).toBe(id);
    profile = await getProfileById(id);
    expect(profile).toMatchObject({ hourlyRate: 95, category: { slug: "design" } });
    expect(profile?.skills.map((s) => s.name)).toEqual(["Figma"]);
  });

  it("only lets freelancers have profiles, with a valid category", async () => {
    const client = await makeClient();
    await expect(saveProfile(client, profileInput(cat.development))).rejects.toBeInstanceOf(ForbiddenError);
    const user = await makeFreelancerUser();
    await expect(saveProfile(user, profileInput(9999))).rejects.toBeInstanceOf(InvalidInputError);
  });

  it("manages portfolio items owned by the freelancer", async () => {
    const { user } = await makeFreelancer(cat.development);
    const other = await makeFreelancer(cat.development);
    const itemId = await addPortfolioItem(user, { title: "Shop", description: "Built a shop.", url: null });
    await expect(deletePortfolioItem(other.user, itemId)).rejects.toBeInstanceOf(NotFoundError);
    await deletePortfolioItem(user, itemId);
    await expect(deletePortfolioItem(user, itemId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("requires a profile before adding portfolio items", async () => {
    const user = await makeFreelancerUser();
    await expect(addPortfolioItem(user, { title: "X", description: "Something.", url: null })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });
});

describe("projects", () => {
  it("lets only clients post projects", async () => {
    const { user } = await makeFreelancer(cat.development);
    await expect(createProject(user, projectInput(cat.development))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("stores project details and skills", async () => {
    const client = await makeClient();
    const id = await makeProject(client, cat.development, { skills: ["Next.js", "React"] });
    const project = await getProjectDetail(id);
    expect(project).toMatchObject({ status: "open", budgetMin: 2000, client: { id: client.id, projectsPosted: 1 } });
    expect(project?.skills.map((s) => s.slug)).toEqual(["next-js", "react"]);
  });

  it("only lets the owner edit, and locks editing after a hire", async () => {
    const owner = await makeClient();
    const stranger = await makeClient();
    const { user: freelancer } = await makeFreelancer(cat.development);
    const id = await makeProject(owner, cat.development);

    await expect(updateProject(stranger, id, projectInput(cat.development))).rejects.toBeInstanceOf(ForbiddenError);
    await updateProject(owner, id, projectInput(cat.development, { title: "Build a marketing website v2" }));
    expect((await getProjectDetail(id))?.title).toBe("Build a marketing website v2");

    const proposalId = await submitProposal(freelancer, id, proposalInput);
    await acceptProposal(owner, proposalId);
    await expect(updateProject(owner, id, projectInput(cat.development))).rejects.toBeInstanceOf(ConflictError);
  });

  it("follows the status lifecycle: open → closed → open, in progress → completed", async () => {
    const client = await makeClient();
    const id = await makeProject(client, cat.development);

    await expect(changeProjectStatus(client, id, "complete")).rejects.toBeInstanceOf(ConflictError);
    expect(await changeProjectStatus(client, id, "close")).toBe("closed");
    await expect(changeProjectStatus(client, id, "close")).rejects.toBeInstanceOf(ConflictError);
    expect(await changeProjectStatus(client, id, "reopen")).toBe("open");

    const { user: freelancer } = await makeFreelancer(cat.development);
    const proposalId = await submitProposal(freelancer, id, proposalInput);
    await acceptProposal(client, proposalId);
    expect(await changeProjectStatus(client, id, "complete")).toBe("completed");
    await expect(changeProjectStatus(client, id, "reopen")).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("proposals and hiring", () => {
  it("runs the full journey from proposal to hire", async () => {
    const client = await makeClient();
    const projectId = await makeProject(client, cat.development);
    const alice = await makeFreelancer(cat.development, {}, "Alice Adams");
    const bob = await makeFreelancer(cat.development, {}, "Bob Brown");
    const cara = await makeFreelancer(cat.development, {}, "Cara Cruz");

    const aliceProposal = await submitProposal(alice.user, projectId, proposalInput);
    const bobProposal = await submitProposal(bob.user, projectId, { ...proposalInput, bidAmount: 2500 });
    const caraProposal = await submitProposal(cara.user, projectId, proposalInput);

    // Contact details stay private before a hire.
    let review = await listProposalsForProject(client, projectId);
    expect(review.proposals).toHaveLength(3);
    expect(review.proposals.every((p) => p.freelancer.email === null)).toBe(true);
    expect(await getClientContactForHire(alice.user.id, projectId)).toBeNull();

    expect(await reviewProposal(client, aliceProposal, "shortlist")).toBe("shortlisted");
    expect(await reviewProposal(client, caraProposal, "decline")).toBe("declined");

    const { declinedCount } = await acceptProposal(client, aliceProposal);
    expect(declinedCount).toBe(1); // Bob's pending proposal; Cara was already declined.

    expect((await getProjectDetail(projectId))?.status).toBe("in_progress");
    review = await listProposalsForProject(client, projectId);
    const byName = Object.fromEntries(review.proposals.map((p) => [p.freelancer.name, p]));
    expect(byName["Alice Adams"]).toMatchObject({ status: "accepted", freelancer: { email: alice.user.email } });
    expect(byName["Bob Brown"]).toMatchObject({ status: "declined", freelancer: { email: null } });
    expect(review.proposals[0].id).toBe(aliceProposal); // hired proposal is listed first

    const aliceApps = await listFreelancerProposals(alice.user.id);
    expect(aliceApps[0]).toMatchObject({ status: "accepted", project: { clientEmail: client.email } });
    const bobApps = await listFreelancerProposals(bob.user.id);
    expect(bobApps[0]).toMatchObject({ id: bobProposal, status: "declined", project: { clientEmail: null } });
    expect(await getClientContactForHire(alice.user.id, projectId)).toEqual({ name: client.name, email: client.email });

    const [row] = await listClientProjects(client.id);
    expect(row).toMatchObject({ status: "in_progress", hiredName: "Alice Adams", newCount: 0 });
  });

  it("requires a freelancer account with a profile", async () => {
    const client = await makeClient();
    const projectId = await makeProject(client, cat.development);
    await expect(submitProposal(client, projectId, proposalInput)).rejects.toBeInstanceOf(ForbiddenError);
    const noProfile = await makeFreelancerUser();
    await expect(submitProposal(noProfile, projectId, proposalInput)).rejects.toThrow(/Create your freelancer profile/);
  });

  it("rejects duplicate proposals and proposals to projects that aren't open", async () => {
    const client = await makeClient();
    const projectId = await makeProject(client, cat.development);
    const { user } = await makeFreelancer(cat.development);
    await submitProposal(user, projectId, proposalInput);
    await expect(submitProposal(user, projectId, proposalInput)).rejects.toThrow(/already sent a proposal/);

    const closedId = await makeProject(client, cat.development);
    await changeProjectStatus(client, closedId, "close");
    await expect(submitProposal(user, closedId, proposalInput)).rejects.toThrow(/no longer accepting/);
    await expect(submitProposal(user, 99999, proposalInput)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lets a freelancer withdraw a pending proposal and apply again", async () => {
    const client = await makeClient();
    const projectId = await makeProject(client, cat.development);
    const { user } = await makeFreelancer(cat.development);
    const proposalId = await submitProposal(user, projectId, proposalInput);

    const stranger = await makeFreelancer(cat.development);
    await expect(withdrawProposal(stranger.user, proposalId)).rejects.toBeInstanceOf(NotFoundError);

    await withdrawProposal(user, proposalId);
    await expect(withdrawProposal(user, proposalId)).rejects.toBeInstanceOf(ConflictError);
    expect((await getProjectDetail(projectId))?.proposalCount).toBe(0);

    const again = await submitProposal(user, projectId, { ...proposalInput, bidAmount: 2800 });
    expect(again).toBe(proposalId);
    const [app] = await listFreelancerProposals(user.id);
    expect(app).toMatchObject({ status: "submitted", bidAmount: 2800 });
  });

  it("keeps other clients out of a project's proposals", async () => {
    const owner = await makeClient();
    const stranger = await makeClient();
    const projectId = await makeProject(owner, cat.development);
    const { user } = await makeFreelancer(cat.development);
    const proposalId = await submitProposal(user, projectId, proposalInput);

    await expect(listProposalsForProject(stranger, projectId)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(reviewProposal(stranger, proposalId, "shortlist")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(acceptProposal(stranger, proposalId)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(acceptProposal(user, proposalId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("enforces review transitions and one hire per project", async () => {
    const client = await makeClient();
    const projectId = await makeProject(client, cat.development);
    const a = await makeFreelancer(cat.development);
    const b = await makeFreelancer(cat.development);
    const pa = await submitProposal(a.user, projectId, proposalInput);
    const pb = await submitProposal(b.user, projectId, proposalInput);

    await expect(reviewProposal(client, pa, "unshortlist")).rejects.toBeInstanceOf(ConflictError);
    await reviewProposal(client, pa, "shortlist");
    await expect(reviewProposal(client, pa, "shortlist")).rejects.toBeInstanceOf(ConflictError);
    expect(await reviewProposal(client, pa, "unshortlist")).toBe("submitted");

    // Hiring from a closed project requires reopening it first.
    await changeProjectStatus(client, projectId, "close");
    await expect(acceptProposal(client, pa)).rejects.toThrow(/Reopen this project/);
    await changeProjectStatus(client, projectId, "reopen");

    await acceptProposal(client, pa);
    await expect(acceptProposal(client, pb)).rejects.toThrow(/already hired/);
    await expect(withdrawProposal(a.user, pa)).rejects.toBeInstanceOf(ConflictError);
  });

  it("allows only one of two simultaneous hires to succeed", async () => {
    const client = await makeClient();
    const projectId = await makeProject(client, cat.development);
    const a = await makeFreelancer(cat.development);
    const b = await makeFreelancer(cat.development);
    const pa = await submitProposal(a.user, projectId, proposalInput);
    const pb = await submitProposal(b.user, projectId, proposalInput);

    const results = await Promise.allSettled([acceptProposal(client, pa), acceptProposal(client, pb)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const review = await listProposalsForProject(client, projectId);
    expect(review.proposals.filter((p) => p.status === "accepted")).toHaveLength(1);
  });
});
