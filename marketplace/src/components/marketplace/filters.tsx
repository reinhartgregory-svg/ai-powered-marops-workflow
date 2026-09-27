import Form from "next/form";
import Link from "next/link";
import { SubmitButton } from "@/components/forms/form-controls";
import { SelectField, TextField } from "@/components/forms/fields";
import { Card } from "@/components/ui/layout";
import type { Category, Skill } from "@/db/schema";
import { AVAILABILITY, BUDGET_TYPES, PROJECT_STATUSES } from "@/db/schema";
import {
  AVAILABILITY_LABELS,
  BUDGET_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
} from "@/lib/constants";
import type { FreelancerFilters } from "@/server/services/freelancers";
import type { ProjectFilters } from "@/server/services/projects";
import { FilterPanel } from "./filter-panel";

function FilterActions({ clearHref, canClear }: { clearHref: string; canClear: boolean }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <SubmitButton pendingText="Searching…" className="flex-1">
        Apply filters
      </SubmitButton>
      {canClear && (
        <Link
          href={clearHref}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          Clear all
        </Link>
      )}
    </div>
  );
}

export function FreelancerFilterForm({
  filters,
  categories,
  skills,
  activeCount,
}: {
  filters: FreelancerFilters;
  categories: Category[];
  skills: Skill[];
  activeCount: number;
}) {
  return (
    <FilterPanel activeCount={activeCount}>
      <Card as="aside" className="p-5">
        <h2 className="text-sm font-semibold text-slate-900">Filter freelancers</h2>
        <Form key={JSON.stringify(filters)} action="/freelancers" className="mt-4 space-y-4" role="search" aria-label="Filter freelancers">
          <TextField
            label="Keywords"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Name, skill, or specialty"
          />
          <SelectField label="Category" name="category" defaultValue={filters.category ?? ""}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Skill" name="skill" defaultValue={filters.skill ?? ""}>
            <option value="">Any skill</option>
            {skills.map((skill) => (
              <option key={skill.slug} value={skill.slug}>
                {skill.name}
              </option>
            ))}
          </SelectField>
          <fieldset>
            <legend className="text-sm font-medium text-slate-800">Hourly rate (USD)</legend>
            <div className="mt-1.5 grid grid-cols-2 gap-3">
              <TextField
                label="Minimum"
                name="minRate"
                type="number"
                inputMode="numeric"
                min={0}
                prefix="$"
                placeholder="Min"
                defaultValue={filters.minRate}
              />
              <TextField
                label="Maximum"
                name="maxRate"
                type="number"
                inputMode="numeric"
                min={0}
                prefix="$"
                placeholder="Max"
                defaultValue={filters.maxRate}
              />
            </div>
          </fieldset>
          <SelectField
            label="Availability"
            name="availability"
            defaultValue={filters.availability ?? ""}
          >
            <option value="">Any availability</option>
            {AVAILABILITY.map((value) => (
              <option key={value} value={value}>
                {AVAILABILITY_LABELS[value]}
              </option>
            ))}
          </SelectField>
          <SelectField label="Sort by" name="sort" defaultValue={filters.sort ?? "relevance"}>
            <option value="relevance">Best match</option>
            <option value="rate_asc">Rate: low to high</option>
            <option value="rate_desc">Rate: high to low</option>
            <option value="newest">Newest members</option>
          </SelectField>
          <FilterActions clearHref="/freelancers" canClear={activeCount > 0} />
        </Form>
      </Card>
    </FilterPanel>
  );
}

export function ProjectFilterForm({
  filters,
  categories,
  skills,
  activeCount,
}: {
  filters: ProjectFilters;
  categories: Category[];
  skills: Skill[];
  activeCount: number;
}) {
  return (
    <FilterPanel activeCount={activeCount}>
      <Card as="aside" className="p-5">
        <h2 className="text-sm font-semibold text-slate-900">Filter projects</h2>
        <Form key={JSON.stringify(filters)} action="/projects" className="mt-4 space-y-4" role="search" aria-label="Filter projects">
          <TextField
            label="Keywords"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Title, description, or skill"
          />
          <SelectField label="Category" name="category" defaultValue={filters.category ?? ""}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Skill" name="skill" defaultValue={filters.skill ?? ""}>
            <option value="">Any skill</option>
            {skills.map((skill) => (
              <option key={skill.slug} value={skill.slug}>
                {skill.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Budget type" name="budgetType" defaultValue={filters.budgetType ?? ""}>
            <option value="">Fixed or hourly</option>
            {BUDGET_TYPES.map((value) => (
              <option key={value} value={value}>
                {BUDGET_TYPE_LABELS[value]}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Minimum budget"
            name="minBudget"
            type="number"
            inputMode="numeric"
            min={0}
            prefix="$"
            defaultValue={filters.minBudget}
            hint="Shows projects whose budget reaches at least this amount."
          />
          <SelectField label="Status" name="status" defaultValue={filters.status ?? "open"}>
            {PROJECT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {PROJECT_STATUS_LABELS[value]}
              </option>
            ))}
            <option value="all">All statuses</option>
          </SelectField>
          <SelectField label="Sort by" name="sort" defaultValue={filters.sort ?? "newest"}>
            <option value="newest">Newest first</option>
            <option value="budget_desc">Budget: high to low</option>
            <option value="budget_asc">Budget: low to high</option>
          </SelectField>
          <FilterActions clearHref="/projects" canClear={activeCount > 0} />
        </Form>
      </Card>
    </FilterPanel>
  );
}
