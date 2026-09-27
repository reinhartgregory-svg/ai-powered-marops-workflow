import type {
  Availability,
  BudgetType,
  Duration,
  ProjectStatus,
  ProposalStatus,
  UserRole,
} from "@/db/schema";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Talentloom";

export const PAGE_SIZE = 12;

export const ROLE_LABELS: Record<UserRole, string> = {
  client: "Client",
  freelancer: "Freelancer",
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  available: "Available now",
  limited: "Limited availability",
  unavailable: "Not available",
};

export const AVAILABILITY_HINTS: Record<Availability, string> = {
  available: "Ready to start new projects right away.",
  limited: "Open to smaller or part-time work.",
  unavailable: "Hidden from “available” searches until you change it.",
};

export const BUDGET_TYPE_LABELS: Record<BudgetType, string> = {
  fixed: "Fixed price",
  hourly: "Hourly rate",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
  closed: "Closed",
};

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  submitted: "Submitted",
  shortlisted: "Shortlisted",
  accepted: "Hired",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

export const DURATION_LABELS: Record<Duration, string> = {
  under_1_week: "Less than 1 week",
  "1_2_weeks": "1–2 weeks",
  "2_4_weeks": "2–4 weeks",
  "1_3_months": "1–3 months",
  over_3_months: "More than 3 months",
};

export const LIMITS = {
  maxSkills: 15,
  maxProjectSkills: 10,
  maxPortfolioItems: 12,
} as const;
