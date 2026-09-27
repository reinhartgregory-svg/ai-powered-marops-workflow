"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export const controlClasses =
  "block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-slate-300 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-brand-600 focus:outline-none aria-invalid:ring-red-500 aria-invalid:focus:ring-red-600 disabled:bg-slate-50 disabled:text-slate-500";

type FieldShellProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
};

function useFieldIds(explicitId?: string) {
  const generated = useId();
  const id = explicitId ?? generated;
  return { id, hintId: `${id}-hint`, errorId: `${id}-error` };
}

function describedBy(ids: { hintId: string; errorId: string }, hint?: ReactNode, error?: string) {
  return [hint ? ids.hintId : null, error ? ids.errorId : null].filter(Boolean).join(" ") || undefined;
}

function Label({
  htmlFor,
  children,
  required,
  optional,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-800">
      {children}
      {required && (
        <span className="ml-0.5 text-red-600" aria-hidden="true">
          *
        </span>
      )}
      {optional && <span className="ml-1.5 font-normal text-slate-500">(optional)</span>}
    </label>
  );
}

export function FieldHint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 text-sm text-slate-500">
      {children}
    </p>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-medium text-red-700">
      {message}
    </p>
  );
}

export function TextField({
  label,
  hint,
  error,
  required,
  optional,
  className,
  id: explicitId,
  prefix,
  suffix,
  ...inputProps
}: FieldShellProps & Omit<ComponentProps<"input">, "prefix"> & {
  prefix?: ReactNode;
  suffix?: ReactNode;
}) {
  const ids = useFieldIds(explicitId);
  const input = (
    <input
      id={ids.id}
      required={required}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(ids, hint, error)}
      className={cn(controlClasses, prefix ? "pl-7" : undefined, suffix ? "pr-12" : undefined)}
      {...inputProps}
    />
  );
  return (
    <div className={className}>
      <Label htmlFor={ids.id} required={required} optional={optional}>
        {label}
      </Label>
      <div className="relative mt-1.5">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500">
            {prefix}
          </span>
        )}
        {input}
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-slate-500">
            {suffix}
          </span>
        )}
      </div>
      {hint && <FieldHint id={ids.hintId}>{hint}</FieldHint>}
      <FieldError id={ids.errorId} message={error} />
    </div>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  required,
  optional,
  className,
  id: explicitId,
  rows = 5,
  ...props
}: FieldShellProps & ComponentProps<"textarea">) {
  const ids = useFieldIds(explicitId);
  return (
    <div className={className}>
      <Label htmlFor={ids.id} required={required} optional={optional}>
        {label}
      </Label>
      <textarea
        id={ids.id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, hint, error)}
        className={cn(controlClasses, "mt-1.5 leading-6")}
        {...props}
      />
      {hint && <FieldHint id={ids.hintId}>{hint}</FieldHint>}
      <FieldError id={ids.errorId} message={error} />
    </div>
  );
}

export function SelectField({
  label,
  hint,
  error,
  required,
  optional,
  className,
  id: explicitId,
  children,
  ...props
}: FieldShellProps & ComponentProps<"select">) {
  const ids = useFieldIds(explicitId);
  return (
    <div className={className}>
      <Label htmlFor={ids.id} required={required} optional={optional}>
        {label}
      </Label>
      <select
        id={ids.id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, hint, error)}
        className={cn(controlClasses, "mt-1.5 pr-8")}
        {...props}
      >
        {children}
      </select>
      {hint && <FieldHint id={ids.hintId}>{hint}</FieldHint>}
      <FieldError id={ids.errorId} message={error} />
    </div>
  );
}

/** A group of radio "cards" rendered as a fieldset. */
export function RadioCards<T extends string>({
  legend,
  name,
  options,
  defaultValue,
  error,
  hint,
  required,
  columns = 2,
}: {
  legend: ReactNode;
  name: string;
  options: { value: T; label: ReactNode; description?: ReactNode; icon?: ReactNode }[];
  defaultValue?: T;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  columns?: 2 | 3;
}) {
  const ids = useFieldIds();
  return (
    <fieldset aria-describedby={describedBy(ids, hint, error)}>
      <legend className="text-sm font-medium text-slate-800">
        {legend}
        {required && (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </legend>
      {hint && <FieldHint id={ids.hintId}>{hint}</FieldHint>}
      <div
        className={cn(
          "mt-2 grid gap-3",
          columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
        )}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className="relative flex cursor-pointer gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-300 ring-inset has-checked:bg-brand-50 has-checked:ring-2 has-checked:ring-brand-600 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-600"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={defaultValue === option.value}
              required={required}
              data-invalid={error ? true : undefined}
              className="mt-0.5 size-4 shrink-0 accent-brand-700 focus-visible:outline-none"
            />
            <span className="flex flex-col">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                {option.icon}
                {option.label}
              </span>
              {option.description && (
                <span className="mt-1 text-sm text-slate-600">{option.description}</span>
              )}
            </span>
          </label>
        ))}
      </div>
      <FieldError id={ids.errorId} message={error} />
    </fieldset>
  );
}
