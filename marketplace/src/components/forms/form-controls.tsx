"use client";

import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { FormState } from "@/lib/form-state";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 aria-hidden="true" className={cn("size-4 animate-spin", className)} />;
}

/**
 * Submit button that shows a pending state. Pass `pending` when the form is driven by
 * `useActionForm`; otherwise it reads the parent form's status.
 */
export function SubmitButton({
  children,
  pendingText,
  pending: pendingProp,
  variant = "primary",
  size = "md",
  className,
  name,
  value,
}: {
  children: ReactNode;
  pendingText?: string;
  pending?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "subtle";
  size?: "sm" | "md" | "lg";
  className?: string;
  name?: string;
  value?: string;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-disabled={pending || undefined}
      className={buttonClasses({ variant, size, className })}
    >
      {pending && <Spinner />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

/**
 * Form-level feedback inside a persistent live region, so screen readers announce it.
 * Errors use role="alert" and can receive focus.
 */
export function FormMessage({ state, className }: { state: FormState; className?: string }) {
  const visible = state.status !== "idle" && Boolean(state.message);
  const isError = state.status === "error";
  return (
    // Kept in the DOM (visually hidden when empty) so the live region exists before a message arrives.
    <div aria-live="polite" className={visible ? className : "sr-only"}>
      {visible && (
        <div
          role={isError ? "alert" : undefined}
          tabIndex={-1}
          data-form-message
          className={cn(
            "flex animate-fade-in items-start gap-2 rounded-lg px-3 py-2.5 text-sm focus:outline-none",
            isError
              ? "bg-red-50 text-red-800 ring-1 ring-red-200"
              : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
          )}
        >
          {isError ? (
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          )}
          <span>{state.message}</span>
        </div>
      )}
    </div>
  );
}
