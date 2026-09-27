"use client";

import { Check, Search } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { slugify } from "@/lib/format";
import { controlClasses, FieldError, FieldHint } from "./fields";

type SkillOption = { name: string; slug: string };

/**
 * Accessible multi-select for skills: native checkboxes styled as pills, a filter box,
 * and a free-text field for skills that aren't in the list yet.
 */
export function SkillPicker({
  skills,
  defaultSelected = [],
  max,
  legend = "Skills",
  hint,
  error,
}: {
  skills: SkillOption[];
  defaultSelected?: string[];
  max: number;
  legend?: string;
  hint?: string;
  error?: string;
}) {
  const ids = useId();
  const [selected, setSelected] = useState(() => new Set(defaultSelected.map(slugify)));
  const [filter, setFilter] = useState("");

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return skills.filter(
      (skill) => selected.has(skill.slug) || !needle || skill.name.toLowerCase().includes(needle),
    );
  }, [skills, filter, selected]);

  const atLimit = selected.size >= max;

  function toggle(slug: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(slug);
      else next.delete(slug);
      return next;
    });
  }

  const hintId = `${ids}-hint`;
  const errorId = `${ids}-error`;
  const countId = `${ids}-count`;

  return (
    <fieldset
      aria-describedby={[hint ? hintId : null, countId, error ? errorId : null]
        .filter(Boolean)
        .join(" ")}
    >
      <legend className="text-sm font-medium text-slate-800">
        {legend}
        <span className="ml-0.5 text-red-600" aria-hidden="true">
          *
        </span>
      </legend>
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}

      <div className="mt-2 rounded-lg bg-white ring-1 ring-slate-300 ring-inset">
        <div className="flex items-center gap-2 border-b border-slate-200 px-3">
          <Search aria-hidden="true" className="size-4 text-slate-400" />
          <label htmlFor={`${ids}-filter`} className="sr-only">
            Filter skills
          </label>
          <input
            id={`${ids}-filter`}
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            onKeyDown={(event) => {
              // Enter in the filter box shouldn't submit the whole form.
              if (event.key === "Enter") event.preventDefault();
            }}
            placeholder="Filter skills…"
            autoComplete="off"
            data-invalid={error ? true : undefined}
            className="w-full border-0 bg-transparent py-2 text-sm focus:ring-0 focus:outline-none"
          />
          <span id={countId} className="shrink-0 text-xs text-slate-500" aria-live="polite">
            {selected.size} of {max} selected
          </span>
        </div>
        <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto p-3">
          {visible.length === 0 && (
            <p className="text-sm text-slate-500">
              No matching skills. Add it below instead.
            </p>
          )}
          {visible.map((skill) => {
            const checked = selected.has(skill.slug);
            const disabled = !checked && atLimit;
            return (
              <label
                key={skill.slug}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ring-1 ring-inset transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-600",
                  checked
                    ? "bg-brand-700 text-white ring-brand-700"
                    : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50",
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <input
                  type="checkbox"
                  name="skills"
                  value={skill.name}
                  checked={checked}
                  disabled={disabled}
                  onChange={(event) => toggle(skill.slug, event.target.checked)}
                  className="sr-only"
                />
                {checked && <Check aria-hidden="true" className="size-3.5" />}
                {skill.name}
              </label>
            );
          })}
        </div>
      </div>
      {atLimit && (
        <p className="mt-1.5 text-sm text-amber-700">
          You&apos;ve reached the limit of {max} skills. Deselect one to choose another.
        </p>
      )}

      <div className="mt-3">
        <label htmlFor={`${ids}-new`} className="block text-sm text-slate-700">
          Other skills not in the list <span className="text-slate-500">(comma-separated)</span>
        </label>
        <input
          id={`${ids}-new`}
          name="newSkills"
          type="text"
          placeholder="e.g. Webflow, Brand Voice"
          autoComplete="off"
          className={cn(controlClasses, "mt-1.5")}
        />
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}
