import { FolderSearch, SearchX } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectFilterForm } from "@/components/marketplace/filters";
import { ProjectCard } from "@/components/marketplace/project-card";
import { ProjectListSkeleton } from "@/components/marketplace/result-skeletons";
import { ButtonLink } from "@/components/ui/button";
import { Container, EmptyState, PageHeader } from "@/components/ui/layout";
import { Pagination } from "@/components/ui/pagination";
import { getCurrentUser } from "@/lib/auth/session";
import { PAGE_SIZE } from "@/lib/constants";
import { pluralize } from "@/lib/format";
import { activeFilterCount, buildHref, parseProjectFilters } from "@/lib/search-params";
import { listCategories, listSkills } from "@/server/services/catalog";
import { searchProjects, type ProjectFilters } from "@/server/services/projects";

export const metadata: Metadata = {
  title: "Find work",
  description: "Browse open freelance projects by category, skill, and budget.",
};

function hrefFor(filters: ProjectFilters, page: number) {
  return buildHref(
    "/projects",
    {
      q: filters.q,
      category: filters.category,
      skill: filters.skill,
      budgetType: filters.budgetType,
      minBudget: filters.minBudget,
      status: filters.status,
      sort: filters.sort,
      page,
    },
    { sort: "newest", status: "open" },
  );
}

async function Results({ filters, canPost }: { filters: ProjectFilters; canPost: boolean }) {
  const result = await searchProjects(filters);
  // "status=open" is the default, so it doesn't count as narrowing the search.
  const narrowed = activeFilterCount({ ...filters, status: filters.status === "open" ? undefined : filters.status }) > 0;

  if (result.total === 0) {
    return narrowed ? (
      <EmptyState
        icon={<SearchX className="size-6" />}
        title="No projects match these filters"
        description="Try a broader keyword, another category, or include projects of every status."
        action={
          <ButtonLink href="/projects" variant="secondary">
            Clear all filters
          </ButtonLink>
        }
      />
    ) : (
      <EmptyState
        icon={<FolderSearch className="size-6" />}
        title="No open projects right now"
        description="New projects are posted regularly — check back soon."
        action={
          canPost && (
            <ButtonLink href="/projects/new" variant="secondary">
              Post a project
            </ButtonLink>
          )
        }
      />
    );
  }

  const first = (result.page - 1) * PAGE_SIZE + 1;
  const last = first + result.items.length - 1;
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600" aria-live="polite">
        Showing {first}–{last} of {pluralize(result.total, "project")}
      </p>
      <ul className="space-y-4">
        {result.items.map((project) => (
          <li key={project.id}>
            <ProjectCard project={project} headingLevel="h2" />
          </li>
        ))}
      </ul>
      <Pagination page={result.page} pageCount={result.pageCount} hrefFor={(page) => hrefFor(filters, page)} />
    </div>
  );
}

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const filters = parseProjectFilters(await searchParams);
  const [categories, skills, user] = await Promise.all([listCategories(), listSkills(), getCurrentUser()]);
  const canPost = user?.role === "client";
  const activeCount = activeFilterCount({
    ...filters,
    status: filters.status === "open" ? undefined : filters.status,
  });

  return (
    <Container className="py-10 sm:py-12">
      <PageHeader
        title="Find work"
        description="Browse projects from clients who are hiring now, and send a proposal when you find a fit."
        actions={
          canPost && (
            <ButtonLink href="/projects/new">Post a project</ButtonLink>
          )
        }
      />
      <div className="mt-8 grid gap-8 lg:grid-cols-[18rem_1fr]">
        <ProjectFilterForm filters={filters} categories={categories} skills={skills} activeCount={activeCount} />
        <section aria-label="Search results">
          <Suspense key={JSON.stringify(filters)} fallback={<ProjectListSkeleton />}>
            <Results filters={filters} canPost={canPost} />
          </Suspense>
        </section>
      </div>
    </Container>
  );
}
