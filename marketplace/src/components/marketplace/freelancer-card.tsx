import { Briefcase, MapPin } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { AvailabilityBadge, SkillTag } from "@/components/ui/badge";
import { Card } from "@/components/ui/layout";
import { formatCurrency, pluralize } from "@/lib/format";
import type { FreelancerSummary } from "@/server/services/freelancers";

const MAX_SKILLS = 4;

export function FreelancerCard({ freelancer }: { freelancer: FreelancerSummary }) {
  const extraSkills = freelancer.skills.length - MAX_SKILLS;
  return (
    <Card as="article" className="group relative flex h-full flex-col p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4">
        <Avatar name={freelancer.name} seed={freelancer.userId} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-slate-900">
            <Link
              href={`/freelancers/${freelancer.profileId}`}
              className="after:absolute after:inset-0 after:rounded-xl hover:text-brand-800 focus-visible:outline-none"
            >
              {freelancer.name}
            </Link>
          </h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{freelancer.headline}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-600">
        <span className="font-semibold text-slate-900">
          {formatCurrency(freelancer.hourlyRate)}
          <span className="font-normal text-slate-500">/hr</span>
        </span>
        <AvailabilityBadge availability={freelancer.availability} />
      </div>

      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Skills">
        {freelancer.skills.slice(0, MAX_SKILLS).map((skill) => (
          <li key={skill.slug}>
            <SkillTag>{skill.name}</SkillTag>
          </li>
        ))}
        {extraSkills > 0 && (
          <li>
            <SkillTag>+{extraSkills} more</SkillTag>
          </li>
        )}
      </ul>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs text-slate-500">
        {freelancer.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin aria-hidden="true" className="size-3.5" />
            {freelancer.location}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Briefcase aria-hidden="true" className="size-3.5" />
          {freelancer.category.name}
        </span>
        {freelancer.hires > 0 && <span>{pluralize(freelancer.hires, "hire")}</span>}
      </div>
      {/* Visible focus ring for the card-wide link. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl group-has-[a:focus-visible]:outline-2 group-has-[a:focus-visible]:outline-offset-2 group-has-[a:focus-visible]:outline-brand-600"
      />
    </Card>
  );
}
