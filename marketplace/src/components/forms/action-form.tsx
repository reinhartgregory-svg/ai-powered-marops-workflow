"use client";

import { AlertCircle } from "lucide-react";
import { useActionState, useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { initialFormState, type FormAction, type FormState } from "@/lib/form-state";
import { SubmitButton } from "./form-controls";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "subtle";

type ConfirmOptions = {
  title: string;
  description: ReactNode;
  confirmLabel: string;
};

/**
 * A single-button form for status changes (shortlist, withdraw, close project…).
 * With `confirm`, the button opens a modal dialog and the action runs from there.
 * Success messages are announced through the app-wide toast. That happens inside the
 * action itself because a successful action often removes this button from the page.
 */
export function ActionForm({
  action,
  fields,
  label,
  pendingText,
  variant = "secondary",
  size = "sm",
  confirm,
  className,
}: {
  action: FormAction;
  fields: Record<string, string | number>;
  label: ReactNode;
  pendingText?: string;
  variant?: Variant;
  size?: "sm" | "md";
  confirm?: ConfirmOptions;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  const titleId = useId();
  const descriptionId = useId();

  const [state, formAction] = useActionState(
    async (previous: FormState, formData: FormData) => {
      const result = await action(previous, formData);
      if (result.status === "success") {
        dialogRef.current?.close();
        if (result.message) toast(result.message);
      }
      return result;
    },
    initialFormState,
  );

  const error =
    state.status === "error" && state.message ? (
      <p role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-red-700">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {state.message}
      </p>
    ) : null;

  const hiddenFields = Object.entries(fields).map(([name, value]) => (
    <input key={name} type="hidden" name={name} value={value} />
  ));

  if (!confirm) {
    return (
      <form action={formAction} className={className}>
        {hiddenFields}
        <SubmitButton variant={variant} size={size} pendingText={pendingText}>
          {label}
        </SubmitButton>
        {error}
      </form>
    );
  }

  return (
    <div className={className}>
      <Button variant={variant} size={size} onClick={() => dialogRef.current?.showModal()}>
        {label}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 shadow-xl"
      >
        <form action={formAction} className="p-6">
          {hiddenFields}
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            {confirm.title}
          </h2>
          <div id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600">
            {confirm.description}
          </div>
          {error}
          <div className={cn("mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end")}>
            <Button
              variant="secondary"
              autoFocus
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
            <SubmitButton variant={variant === "danger" ? "danger" : "primary"} pendingText={pendingText}>
              {confirm.confirmLabel}
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </div>
  );
}
