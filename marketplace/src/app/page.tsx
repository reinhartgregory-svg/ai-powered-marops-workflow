import { ArrowRight, CheckCircle2, Search } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { CategoryIcon } from "@/components/marketplace/category-icon";
import { FreelancerCard } from "@/components/marketplace/freelancer-card";
import { ProjectCard } from "@/components/marketplace/project-card";
import { Avatar } from "@/components/ui/avatar";
import { AvailabilityBadge } from "@/components/ui/badge";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Container, EmptyState } from "@/components/ui/layout";
import { getCurrentUser } from "@/lib/auth/session";
import { formatCurrency, pluralize } from "@/lib/format";
import { listCategoriesWithCounts, listPopularSkills } from "@/server/services/catalog";
import { countFreelancers, getFeaturedFreelancers } from "@/server/services/freelancers";
import { countOpenProjects, getLatestOpenProjects } from "@/server/services/projects";
import type { SessionUser } from "@/server/services/users";

function clientCta(user: SessionUser | null) {
  if (!user) return { href: "/signup?role=client", label: "Post a project" };
  if (user.role === "client") return { href: "/projects/new", label: "Post a project" };
  return null;
}

function freelancerCta(user: SessionUser | null) {
  if (!user) return { href: "/signup?role=freelancer", label: "Join as a freelancer" };
  if (user.role === "freelancer") return { href: "/projects", label: "Find work" };
  return null;
}

export default async function HomePage() {
  const [user, categories, featured, latest, freelancerTotal, openTotal, popularSkills] =
    await Promise.all([
      getCurrentUser(),
      listCategoriesWithCounts(),
      getFeaturedFreelancers(6),
      getLatestOpenProjects(4),
      countFreelancers(),
      countOpenProjects(),
      listPopularSkills(6),
    ]);
  const forClients = clientCta(user);
  const forFreelancers = freelancerCta(user);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(60rem_30rem_at_80%_-10%,var(--color-brand-100),transparent_60%)]"
        />
        <Container className="relative grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-800 ring-1 ring-brand-200">
              {pluralize(freelancerTotal, "freelancer")} · {pluralize(openTotal, "open project")}
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl lg:text-6xl">
              Hire skilled freelancers. <span className="text-brand-700">Find work you love.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Clients post projects and compare proposals side by side. Freelancers build a
              profile once and apply to work that fits their skills and rate.
            </p>

            <Form action="/freelancers" role="search" className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
              <label htmlFor="hero-search" className="sr-only">
                Search freelancers by skill or specialty
              </label>
              <div className="relative flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="hero-search"
                  name="q"
                  type="search"
                  placeholder="Try “React”, “brand identity”, or “bookkeeping”"
                  className="h-12 w-full rounded-lg border-0 bg-white pr-3 pl-11 text-base shadow-sm ring-1 ring-slate-300 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-brand-600 focus:outline-none"
                />
              </div>
              <button type="submit" className={buttonClasses({ size: "lg" })}>
                Search talent
              </button>
            </Form>

            {popularSkills.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-500">Popular:</span>
                {popularSkills.map((skill) => (
                  <Link
                    key={skill.slug}
                    href={`/freelancers?skill=${skill.slug}`}
                    className="rounded-full bg-white px-3 py-1 text-slate-700 ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-800 hover:ring-brand-200"
                  >
                    {skill.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              {forClients && (
                <ButtonLink href={forClients.href} size="lg">
                  {forClients.label}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </ButtonLink>
              )}
              {forFreelancers && (
                <ButtonLink href={forFreelancers.href} size="lg" variant="secondary">
                  {forFreelancers.label}
                </ButtonLink>
              )}
              {user && (
                <ButtonLink href="/dashboard" size="lg" variant="ghost">
                  Go to your dashboard
                </ButtonLink>
              )}
            </div>
          </div>

          {/* Real featured profiles, shown as a preview stack */}
          {featured.length > 0 && (
            <div className="relative hidden lg:block" aria-hidden="true">
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-brand-100 via-white to-amber-50" />
              <div className="relative space-y-4">
                {featured.slice(0, 3).map((f, index) => (
                  <div
                    key={f.profileId}
                    className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-200"
                    style={{ marginLeft: `${index * 1.5}rem`, marginRight: `${(2 - index) * 1.5}rem` }}
                  >
                    <Avatar name={f.name} seed={f.userId} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{f.name}</p>
                      <p className="truncate text-sm text-slate-600">{f.headline}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold">{formatCurrency(f.hourlyRate)}/hr</span>
                      <AvailabilityBadge availability={f.availability} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* Categories */}
      <section aria-labelledby="categories-heading" className="py-16 sm:py-20">
        <Container>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="categories-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Browse by category
              </h2>
              <p className="mt-2 text-slate-600">Find specialists for every part of your business.</p>
            </div>
            <Link href="/freelancers" className="text-sm font-medium text-brand-700 hover:text-brand-800">
              All freelancers <span aria-hidden="true">→</span>
            </Link>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/freelancers?category=${category.slug}`}
                  className="group flex h-full flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-brand-300"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 group-hover:bg-brand-700 group-hover:text-white">
                    <CategoryIcon slug={category.slug} className="size-5" />
                  </span>
                  <span className="mt-4 font-semibold text-slate-900">{category.name}</span>
                  <span className="mt-1 text-sm text-slate-600">{category.description}</span>
                  <span className="mt-auto pt-4 text-xs font-medium text-slate-500">
                    {pluralize(category.freelancerCount, "freelancer")} ·{" "}
                    {pluralize(category.openProjectCount, "open project")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Featured freelancers */}
      <section aria-labelledby="featured-heading" className="border-y border-slate-200 bg-white py-16 sm:py-20">
        <Container>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="featured-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Featured freelancers
              </h2>
              <p className="mt-2 text-slate-600">
                Available now and ranked by completed hires and portfolio depth.
              </p>
            </div>
            <Link href="/freelancers" className="text-sm font-medium text-brand-700 hover:text-brand-800">
              Browse all talent <span aria-hidden="true">→</span>
            </Link>
          </div>
          {featured.length > 0 ? (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((freelancer) => (
                <li key={freelancer.profileId}>
                  <FreelancerCard freelancer={freelancer} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              className="mt-8"
              title="No freelancers yet"
              description="Freelancer profiles will appear here as soon as the first ones are published."
              action={
                <ButtonLink href="/signup?role=freelancer" variant="secondary">
                  Create a freelancer profile
                </ButtonLink>
              }
            />
          )}
        </Container>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="py-16 sm:py-20">
        <Container>
          <h2 id="how-heading" className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            How it works
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {[
              {
                title: "For clients",
                steps: [
                  "Post a project with your budget and the skills you need.",
                  "Review proposals, shortlist favorites, and compare bids.",
                  "Hire the right person — you'll both get each other's contact details.",
                ],
                cta: forClients,
              },
              {
                title: "For freelancers",
                steps: [
                  "Create a profile with your skills, rate, and portfolio.",
                  "Browse open projects and send tailored proposals.",
                  "Track every application and get hired from your dashboard.",
                ],
                cta: forFreelancers,
              },
            ].map((column) => (
              <div key={column.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
                <h3 className="text-lg font-semibold text-slate-900">{column.title}</h3>
                <ol className="mt-6 space-y-4">
                  {column.steps.map((step, index) => (
                    <li key={step} className="flex gap-4">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
                        {index + 1}
                      </span>
                      <span className="pt-1 text-slate-700">{step}</span>
                    </li>
                  ))}
                </ol>
                {column.cta && (
                  <ButtonLink href={column.cta.href} variant="subtle" className="mt-8">
                    {column.cta.label}
                  </ButtonLink>
                )}
              </div>
            ))}
          </div>
          <p className="mx-auto mt-6 flex max-w-2xl items-start justify-center gap-2 text-center text-sm text-slate-500">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-600" />
            Payments and messaging happen outside the platform for now — both are on our roadmap.
          </p>
        </Container>
      </section>

      {/* Latest projects */}
      <section aria-labelledby="latest-heading" className="border-t border-slate-200 bg-white py-16 sm:py-20">
        <Container>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="latest-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Latest open projects
              </h2>
              <p className="mt-2 text-slate-600">Fresh work from clients hiring right now.</p>
            </div>
            <Link href="/projects" className="text-sm font-medium text-brand-700 hover:text-brand-800">
              Browse all projects <span aria-hidden="true">→</span>
            </Link>
          </div>
          {latest.length > 0 ? (
            <ul className="mt-8 grid gap-4 lg:grid-cols-2">
              {latest.map((project) => (
                <li key={project.id}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              className="mt-8"
              title="No open projects right now"
              description="Check back soon, or post the first one."
              action={
                forClients && (
                  <ButtonLink href={forClients.href} variant="secondary">
                    Post a project
                  </ButtonLink>
                )
              }
            />
          )}
        </Container>
      </section>

      {/* Closing CTA */}
      {!user && (
        <section className="bg-brand-900">
          <Container className="flex flex-col items-start justify-between gap-6 py-14 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Ready to get started?</h2>
              <p className="mt-2 text-brand-100">Create a free account in under a minute.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/signup?role=client" size="lg" variant="secondary">
                I want to hire
              </ButtonLink>
              <ButtonLink href="/signup?role=freelancer" size="lg" variant="inverse">
                I want to work
              </ButtonLink>
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
