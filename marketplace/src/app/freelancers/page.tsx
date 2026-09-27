import { SearchX, Users } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FreelancerCard } from "@/components/marketplace/freelancer-card";
import { FreelancerFilterForm } from "@/components/marketplace/filters";
import { FreelancerGridSkeleton } from "@/components/marketplace/result-skeletons";
import { ButtonLink } from "@/components/ui/button";
import { Container, EmptyState, PageHeader } from "@/components/ui/layout";
import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE } from "@/lib/constants";
import { pluralize } from "@/lib/format";
import { activeFilterCount, buildHref, parseFreelancerFilters } from "@/lib/search-params";
import { listCategories, listSkills } from "@/server/services/catalog";
import { searchFreelancers, type FreelancerFilters } from "@/server/services/freelancers";

export const metadata: Metadata = {
  title: "Find freelancers",
  description: "Search freelancers by skill, category, hourly rate, and availability.",
};

function hrefFor(filters: FreelancerFilters, page: number) {
  return buildHref(
    "/freelancers",
    {
      q: filters.q,
      category: filters.category,
      skill: filters.skill,
      minRate: filters.minRate,
      maxRate: filters.maxRate,
      availability: filters.availability,
      sort: filters.sort,
      page,
    },
    { sort: "relevance" },
  );
}

async function Results({ filters }: { filters: FreelancerFilters }) {
  const result = await searchFreelancers(filters);
  const filtered = activeFilterCount(filters) > 0;

  if (result.total === 0) {
    return filtered ? (
      <EmptyState
        icon={<SearchX className="size-6" />}
        title="No freelancers match these filters"
        description="Try removing a filter, widening the rate range, or searching for a related skill."
        action={
          <ButtonLink href="/freelancers" variant="secondary">
            Clear all filters
          </ButtonLink>
        }
      />
    ) : (
      <EmptyState
        icon={<Users className="size-6" />}
        title="No freelancer profiles yet"
        description="Profiles appear here as soon as freelancers publish them."
        action={
          <ButtonLink href="/signup?role=freelancer" variant="secondary">
            Create a freelancer profile
          </ButtonLink>
        }
      />
    );
  }

  const first = (result.page - 1) * PAGE_SIZE + 1;
  const last = first + result.items.length - 1;

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600" aria-live="polite">
        Showing {first}–{last} of {pluralize(result.total, "freelancer")}
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {result.items.map((freelancer) => (
          <li key={freelancer.profileId}>
            <FreelancerCard freelancer={freelancer} />
          </li>
        ))}
      </ul>
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        hrefFor={(page) => hrefFor(filters, page)}
      />
    </div>
  );
}

export default async function FreelancersPage({ searchParams }: PageProps<"/freelancers">) {
  const filters = parseFreelancerFilters(await searchParams);
  const [categories, skills] = await Promise.all([listCategories(), listSkills()]);
  const category = categories.find((c) => c.slug === filters.category);

  return (
    <Container className="py-10 sm:py-12">
      <PageHeader
        title={category ? `${category.name} freelancers` : "Find freelancers"}
        description={
          category?.description ??
          "Search by skill, category, rate, and availability to find the right person for your project."
        }
      />
      <div className="mt-8 grid gap-8 lg:grid-cols-[18rem_1fr]">
        <FreelancerFilterForm
          filters={filters}
          categories={categories}
          skills={skills}
          activeCount={activeFilterCount(filters)}
        />
        <section aria-label="Search results">
          <Suspense key={JSON.stringify(filters)} fallback={<FreelancerGridSkeleton />}>
            <Results filters={filters} />
          </Suspense>
        </section>
      </div>
    </Container>
  );
}
