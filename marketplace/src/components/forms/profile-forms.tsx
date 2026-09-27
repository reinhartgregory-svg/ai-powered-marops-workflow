"use client";

import { AVAILABILITY, type Availability, type Category } from "@/db/schema";
import { AVAILABILITY_HINTS, AVAILABILITY_LABELS, LIMITS } from "@/lib/constants";
import {
  addPortfolioItemAction,
  saveProfileAction,
} from "@/server/actions/profile";
import { RadioCards, SelectField, TextAreaField, TextField } from "./fields";
import { FormMessage, SubmitButton } from "./form-controls";
import { SkillPicker } from "./skill-picker";
import { useActionForm } from "./use-action-form";

export type ProfileFormValues = {
  headline: string;
  bio: string;
  categoryId: number;
  hourlyRate: number;
  availability: Availability;
  location: string | null;
  skills: string[];
};

export function ProfileForm({
  categories,
  skills,
  initial,
}: {
  categories: Category[];
  skills: { name: string; slug: string }[];
  initial: ProfileFormValues | null;
}) {
  const { state, pending, fieldError, formProps } = useActionForm(saveProfileAction);
  return (
    <form {...formProps} className="space-y-6">
      <TextField
        label="Professional headline"
        name="headline"
        required
        maxLength={120}
        defaultValue={initial?.headline}
        placeholder="e.g. Product designer for B2B SaaS"
        hint="One line that sums up what you do best. 10–120 characters."
        error={fieldError("headline")}
      />
      <TextAreaField
        label="Bio"
        name="bio"
        required
        rows={7}
        maxLength={3000}
        defaultValue={initial?.bio}
        hint="Describe your experience, the kinds of projects you take on, and how you like to work. At least 50 characters."
        error={fieldError("bio")}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <SelectField
          label="Primary category"
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
        <TextField
          label="Hourly rate (USD)"
          name="hourlyRate"
          type="number"
          inputMode="numeric"
          min={5}
          max={1000}
          required
          prefix="$"
          suffix="/hr"
          defaultValue={initial?.hourlyRate}
          error={fieldError("hourlyRate")}
        />
      </div>
      <RadioCards<Availability>
        legend="Availability"
        name="availability"
        required
        columns={3}
        defaultValue={initial?.availability ?? "available"}
        error={fieldError("availability")}
        options={AVAILABILITY.map((value) => ({
          value,
          label: AVAILABILITY_LABELS[value],
          description: AVAILABILITY_HINTS[value],
        }))}
      />
      <TextField
        label="Location"
        name="location"
        optional
        maxLength={80}
        autoComplete="address-level2"
        defaultValue={initial?.location ?? ""}
        placeholder="e.g. Lisbon, Portugal or Remote (EU time zones)"
        error={fieldError("location")}
      />
      <SkillPicker
        skills={skills}
        defaultSelected={initial?.skills}
        max={LIMITS.maxSkills}
        hint="Clients filter by skill, so choose the ones you're strongest in."
        error={fieldError("skills")}
      />
      <FormMessage state={state} />
      <div className="flex justify-end border-t border-slate-100 pt-6">
        <SubmitButton pending={pending} pendingText="Saving…">
          {initial ? "Save profile" : "Publish profile"}
        </SubmitButton>
      </div>
    </form>
  );
}

export function PortfolioItemForm({ disabled }: { disabled?: boolean }) {
  const { state, pending, fieldError, formProps } = useActionForm(addPortfolioItemAction, {
    resetOnSuccess: true,
  });
  return (
    <form {...formProps} className="space-y-4">
      <fieldset disabled={disabled} className="space-y-4">
        <legend className="text-sm font-semibold text-slate-900">Add a portfolio item</legend>
        <TextField
          label="Title"
          name="title"
          required
          maxLength={100}
          placeholder="e.g. Checkout redesign for an online bookstore"
          error={fieldError("title")}
        />
        <TextAreaField
          label="What you did and the result"
          name="description"
          required
          rows={3}
          maxLength={500}
          error={fieldError("description")}
        />
        <TextField
          label="Link"
          name="url"
          type="url"
          optional
          inputMode="url"
          placeholder="https://"
          hint="A live site, case study, or file. We'll add https:// if you leave it off."
          error={fieldError("url")}
        />
        <FormMessage state={state} />
        <div className="flex justify-end">
          <SubmitButton pending={pending} pendingText="Adding…" variant="secondary">
            Add to portfolio
          </SubmitButton>
        </div>
      </fieldset>
    </form>
  );
}
