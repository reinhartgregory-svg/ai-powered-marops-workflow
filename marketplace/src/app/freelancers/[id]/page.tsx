import { CalendarDays, ExternalLink, FolderOpen, MapPin, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Avatar } from "@/components/ui/avatar";
import { AvailabilityBadge, SkillTag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, Container, EmptyState } from "@/components/ui/layout";
import { getCurrentUser } from "@/lib/auth/session";
import { AVAILABILITY_HINTS } from "@/lib/constants";
import { formatCurrency, formatMonthYear, pluralize } from "@/lib/format";
import { getProfileById } from "@/server/services/freelancers";

const loadProfile = cache(async (rawId: string) => {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return getProfileById(id);
});

export async function generateMetadata({ params }: PageProps<"/freelancers/[id]">): Promise<Metadata> {
  const profile = await loadProfile((await params).id);
  if (!profile) return { title: "Freelancer not found" };
  return { title: `${profile.name} — ${profile.headline}`, description: profile.bio.slice(0, 160) };
}

export default async function FreelancerProfilePage({ params }: PageProps<"/freelancers/[id]">) {
  const [profile, viewer] = await Promise.all([loadProfile((await params).id), getCurrentUser()]);
  if (!profile) notFound();
  const isOwner = viewer?.id === profile.userId;
  const firstName = profile.name.split(" ")[0];

  return (
    <Container className="py-10 sm:py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/freelancers" className="hover:text-brand-700">
              Freelancers
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/freelancers?category=${profile.category.slug}`} className="hover:text-brand-700">
              {profile.category.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-slate-700">
            {profile.name}
          </li>
        </ol>
      </nav>

      {isOwner && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl bg-brand-50 p-4 text-sm text-brand-900 ring-1 ring-brand-200 sm:flex-row sm:items-center sm:justify-between">
          <p>This is your public profile — it&apos;s exactly what clients see.</p>
          <ButtonLink href="/dashboard/profile" size="sm" variant="secondary">
            <Pencil aria-hidden="true" className="size-4" />
            Edit profile
          </ButtonLink>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-8">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Avatar name={profile.name} seed={profile.userId} size="lg" />
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  {profile.name}
                </h1>
                <p className="mt-1 text-lg text-slate-700">{profile.headline}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                  {profile.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin aria-hidden="true" className="size-4" />
                      {profile.location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays aria-hidden="true" className="size-4" />
                    Member since {formatMonthYear(profile.memberSince)}
                  </span>
                  <AvailabilityBadge availability={profile.availability} />
                </div>
              </div>
            </div>
          </Card>

          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="text-lg font-semibold text-slate-900">
              About
            </h2>
            <Card className="mt-3 p-6">
              <p className="leading-7 whitespace-pre-line text-slate-700">{profile.bio}</p>
            </Card>
          </section>

          <section aria-labelledby="portfolio-heading">
            <h2 id="portfolio-heading" className="text-lg font-semibold text-slate-900">
              Portfolio
            </h2>
            {profile.portfolio.length === 0 ? (
              <EmptyState
                className="mt-3"
                icon={<FolderOpen className="size-6" />}
                title="No portfolio items yet"
                description={
                  isOwner
                    ? "Add a few examples of past work — profiles with a portfolio rank higher in search."
                    : `${firstName} hasn't added portfolio items yet.`
                }
                action={
                  isOwner && (
                    <ButtonLink href="/dashboard/profile#portfolio" variant="secondary">
                      Add portfolio items
                    </ButtonLink>
                  )
                }
              />
            ) : (
              <ul className="mt-3 grid gap-4 sm:grid-cols-2">
                {profile.portfolio.map((item) => (
                  <li key={item.id}>
                    <Card as="article" className="flex h-full flex-col p-5">
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{item.description}</p>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
                        >
                          View project
                          <ExternalLink aria-hidden="true" className="size-3.5" />
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6" aria-label="Rate, skills, and hiring">
          <Card className="p-6">
            <p className="text-sm text-slate-600">Hourly rate</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
              {formatCurrency(profile.hourlyRate)}
              <span className="text-base font-normal text-slate-500">/hr</span>
            </p>
            <div className="mt-4">
              <AvailabilityBadge availability={profile.availability} />
              <p className="mt-2 text-sm text-slate-600">{AVAILABILITY_HINTS[profile.availability]}</p>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 text-sm">
              <div>
                <dt className="text-slate-500">Hires</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">{profile.hires}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Portfolio</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {pluralize(profile.portfolio.length, "item")}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-900">Skills</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <li key={skill.slug}>
                  <SkillTag href={`/freelancers?skill=${skill.slug}`}>{skill.name}</SkillTag>
                </li>
              ))}
            </ul>
          </Card>

          {!isOwner && (
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-900">Work with {firstName}</h2>
              {viewer?.role === "client" ? (
                <>
                  <p className="mt-2 text-sm text-slate-600">
                    Post a project that needs {firstName}&apos;s skills. Open projects are
                    recommended to freelancers with matching skills.
                  </p>
                  <ButtonLink href="/projects/new" className="mt-4 w-full">
                    Post a project
                  </ButtonLink>
                </>
              ) : viewer?.role === "freelancer" ? (
                <p className="mt-2 text-sm text-slate-600">
                  Only client accounts can hire. Direct messaging between members is planned
                  for a future release.
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm text-slate-600">
                    Create a free client account to post a project and receive proposals.
                  </p>
                  <ButtonLink href="/signup?role=client" className="mt-4 w-full">
                    Sign up to hire
                  </ButtonLink>
                </>
              )}
            </Card>
          )}
        </aside>
      </div>
    </Container>
  );
}
