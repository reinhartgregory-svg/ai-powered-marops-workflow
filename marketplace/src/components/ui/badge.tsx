import Link from "next/link";
import type { ReactNode } from "react";
import type { Availability, ProjectStatus, ProposalStatus } from "@/db/schema";
import { cn } from "@/lib/cn";
import {
  AVAILABILITY_LABELS,
  PROJECT_STATUS_LABELS,
  PROPOSAL_STATUS_LABELS,
} from "@/lib/constants";

type Tone = "neutral" | "brand" | "green" | "amber" | "blue" | "red" | "violet";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  brand: "bg-brand-50 text-brand-800 ring-brand-200",
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  blue: "bg-sky-50 text-sky-800 ring-sky-200",
  red: "bg-red-50 text-red-800 ring-red-200",
  violet: "bg-violet-50 text-violet-800 ring-violet-200",
};

const dots: Record<Tone, string> = {
  neutral: "bg-slate-400",
  brand: "bg-brand-500",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  blue: "bg-sky-500",
  red: "bg-red-500",
  violet: "bg-violet-500",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {dot && <span aria-hidden="true" className={cn("size-1.5 rounded-full", dots[tone])} />}
      {children}
    </span>
  );
}

const projectTones: Record<ProjectStatus, Tone> = {
  open: "green",
  in_progress: "blue",
  completed: "violet",
  closed: "neutral",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge tone={projectTones[status]} dot>
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  );
}

const proposalTones: Record<ProposalStatus, Tone> = {
  submitted: "blue",
  shortlisted: "amber",
  accepted: "green",
  declined: "red",
  withdrawn: "neutral",
};

export function ProposalStatusBadge({
  status,
  clientView = false,
}: {
  status: ProposalStatus;
  /** Clients see brand-new proposals as "New". */
  clientView?: boolean;
}) {
  const label = clientView && status === "submitted" ? "New" : PROPOSAL_STATUS_LABELS[status];
  return (
    <Badge tone={proposalTones[status]} dot>
      {label}
    </Badge>
  );
}

const availabilityTones: Record<Availability, Tone> = {
  available: "green",
  limited: "amber",
  unavailable: "neutral",
};

export function AvailabilityBadge({ availability }: { availability: Availability }) {
  return (
    <Badge tone={availabilityTones[availability]} dot>
      {AVAILABILITY_LABELS[availability]}
    </Badge>
  );
}

export function SkillTag({ children, href }: { children: ReactNode; href?: string }) {
  const className =
    "inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700";
  if (href) {
    return (
      <Link href={href} className={cn(className, "hover:bg-brand-50 hover:text-brand-800")}>
        {children}
      </Link>
    );
  }
  return <span className={className}>{children}</span>;
}
