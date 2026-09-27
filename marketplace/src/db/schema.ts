import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const USER_ROLES = ["client", "freelancer"] as const;
export const AVAILABILITY = ["available", "limited", "unavailable"] as const;
export const BUDGET_TYPES = ["fixed", "hourly"] as const;
export const PROJECT_STATUSES = [
  "open",
  "in_progress",
  "completed",
  "closed",
] as const;
export const PROPOSAL_STATUSES = [
  "submitted",
  "shortlisted",
  "accepted",
  "declined",
  "withdrawn",
] as const;
export const DURATIONS = [
  "under_1_week",
  "1_2_weeks",
  "2_4_weeks",
  "1_3_months",
  "over_3_months",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type Availability = (typeof AVAILABILITY)[number];
export type BudgetType = (typeof BUDGET_TYPES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];
export type Duration = (typeof DURATIONS)[number];

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: USER_ROLES }).notNull(),
  companyName: text("company_name"),
  createdAt: createdAt(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    // SHA-256 of the session token; the raw token only ever lives in the cookie.
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const skills = sqliteTable("skills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const freelancerProfiles = sqliteTable(
  "freelancer_profiles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    headline: text("headline").notNull(),
    bio: text("bio").notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    hourlyRate: integer("hourly_rate").notNull(),
    availability: text("availability", { enum: AVAILABILITY }).notNull(),
    location: text("location"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("profiles_category_idx").on(t.categoryId),
    index("profiles_rate_idx").on(t.hourlyRate),
    index("profiles_availability_idx").on(t.availability),
  ],
);

export const profileSkills = sqliteTable(
  "profile_skills",
  {
    profileId: integer("profile_id")
      .notNull()
      .references(() => freelancerProfiles.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.profileId, t.skillId] }),
    index("profile_skills_skill_idx").on(t.skillId),
  ],
);

export const portfolioItems = sqliteTable(
  "portfolio_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    profileId: integer("profile_id")
      .notNull()
      .references(() => freelancerProfiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    url: text("url"),
    createdAt: createdAt(),
  },
  (t) => [index("portfolio_profile_idx").on(t.profileId)],
);

export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clientId: integer("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    budgetType: text("budget_type", { enum: BUDGET_TYPES }).notNull(),
    budgetMin: integer("budget_min").notNull(),
    budgetMax: integer("budget_max").notNull(),
    status: text("status", { enum: PROJECT_STATUSES })
      .notNull()
      .default("open"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("projects_client_idx").on(t.clientId),
    index("projects_status_idx").on(t.status),
    index("projects_category_idx").on(t.categoryId),
  ],
);

export const projectSkills = sqliteTable(
  "project_skills",
  {
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.projectId, t.skillId] }),
    index("project_skills_skill_idx").on(t.skillId),
  ],
);

export const proposals = sqliteTable(
  "proposals",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    freelancerId: integer("freelancer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    coverLetter: text("cover_letter").notNull(),
    bidAmount: integer("bid_amount").notNull(),
    estimatedDuration: text("estimated_duration", { enum: DURATIONS }).notNull(),
    status: text("status", { enum: PROPOSAL_STATUSES })
      .notNull()
      .default("submitted"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("proposals_project_freelancer_uq").on(
      t.projectId,
      t.freelancerId,
    ),
    index("proposals_freelancer_idx").on(t.freelancerId),
  ],
);

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type FreelancerProfile = typeof freelancerProfiles.$inferSelect;
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Proposal = typeof proposals.$inferSelect;
