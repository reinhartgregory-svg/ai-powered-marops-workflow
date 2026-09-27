"use client";

import Link from "next/link";
import { useState } from "react";
import type { BudgetType, Category } from "@/db/schema";
import { LIMITS } from "@/lib/constants";
import type { FormAction } from "@/lib/form-state";
import { RadioCards, SelectField, TextAreaField, TextField } from "./fields";
import { FormMessage, SubmitButton } from "./form-controls";
import { SkillPicker } from "./skill-picker";
import { useActionForm } from "./use-action-form";

export type ProjectFormValues = {
  title: string;
  description: string;
  categoryId: number;
  budgetType: BudgetType;
  budgetMin: number;
  budgetMax: number;
  skills: string[];
};

export function ProjectForm({
  action,
  categories,
  skills,
  initial,
  projectId,
  submitLabel,
  cancelHref,
}: {
  action: FormAction;
  categories: Category[];
  skills: { name: string; slug: string }[];
  initial?: ProjectFormValues;
  projectId?: number;
  submitLabel: string;
  cancelHref: string;
}) {
  const { state, pending, fieldError, formProps } = useActionForm(action);
  const [budgetType, setBudgetType] = useState<BudgetType>(initial?.budgetType ?? "fixed");
  const suffix = budgetType === "hourly" ? "/hr" : undefined;

  return (
    <form
      {...formProps}
      className="space-y-6"
      onChange={(event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement && target.name === "budgetType") {
          setBudgetType(target.value as BudgetType);
        }
      }}
    >
      <FormMessage state={state} />
      {projectId && <input type="hidden" name="projectId" value={projectId} />}

      <TextField
        label="Project title"
        name="title"
        required
        maxLength={120}
        defaultValue={initial?.title}
        placeholder="e.g. Redesign our online store's checkout"
        hint="A clear, specific title gets better proposals. 10–120 characters."
        error={fieldError("title")}
      />
      <TextAreaField
        label="Description"
        name="description"
        required
        rows={8}
        maxLength={5000}
        defaultValue={initial?.description}
        hint="Describe the goals, deliverables, timeline, and anything freelancers should include in their proposal. At least 50 characters."
        error={fieldError("description")}
      />
      <SelectField
        label="Category"
        name="categoryId"
        required
        defaultValue={initial?.categoryId ?? ""}
        error={fieldError("categoryId")}
      >
        <option value="" disabled>
          Choose a category
        </option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </SelectField>

      <RadioCards<BudgetType>
        legend="Budget type"
        name="budgetType"
        required
        defaultValue={initial?.budgetType ?? "fixed"}
        error={fieldError("budgetType")}
        options={[
          { value: "fixed", label: "Fixed price", description: "One price for the whole project." },
          { value: "hourly", label: "Hourly rate", description: "Pay for the time worked." },
        ]}
      />

      <fieldset>
        <legend className="text-sm font-medium text-slate-800">
          {budgetType === "hourly" ? "Hourly rate range (USD)" : "Budget range (USD)"}
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        </legend>
        <div className="mt-1.5 grid gap-4 sm:grid-cols-2">
          <TextField
            label="Minimum"
            name="budgetMin"
            type="number"
            inputMode="numeric"
            min={5}
            required
            prefix="$"
            suffix={suffix}
            defaultValue={initial?.budgetMin}
            error={fieldError("budgetMin")}
          />
          <TextField
            label="Maximum"
            name="budgetMax"
            type="number"
            inputMode="numeric"
            min={5}
            required
            prefix="$"
            suffix={suffix}
            defaultValue={initial?.budgetMax}
            error={fieldError("budgetMax")}
          />
        </div>
      </fieldset>

      <SkillPicker
        legend="Required skills"
        skills={skills}
        defaultSelected={initial?.skills}
        max={LIMITS.maxProjectSkills}
        hint={`Pick up to ${LIMITS.maxProjectSkills}. Freelancers with these skills will see your project in their recommendations.`}
        error={fieldError("skills")}
      />

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </Link>
        <SubmitButton pending={pending} pendingText="Saving…">
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
