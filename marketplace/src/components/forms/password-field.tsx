"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { controlClasses, FieldError, FieldHint } from "./fields";

export function PasswordField({
  label,
  hint,
  error,
  labelAction,
  ...inputProps
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  labelAction?: ReactNode;
} & Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-medium text-slate-800">
          {label}
          {inputProps.required && (
            <span className="ml-0.5 text-red-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {labelAction}
      </div>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined}
          className={cn(controlClasses, "pr-11")}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-slate-500 hover:text-slate-800"
        >
          {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
          <span className="sr-only">Show password</span>
        </button>
      </div>
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
      <FieldError id={errorId} message={error} />
    </div>
  );
}
