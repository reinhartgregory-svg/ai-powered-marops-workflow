"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  type FormEvent,
} from "react";
import { initialFormState, type FormAction } from "@/lib/form-state";

/**
 * Wires a server action to a form with `useActionState`.
 *
 * Submissions go through `onSubmit` + `startTransition` instead of React's automatic
 * form action handling so the fields keep what the user typed when validation fails
 * (React resets forms after an automatic action). Without JavaScript the plain
 * `action` attribute still posts the form.
 */
export function useActionForm(
  action: FormAction,
  { resetOnSuccess = false }: { resetOnSuccess?: boolean } = {},
) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(formData));
  }

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    if (state.status === "error") {
      // Move focus to the first invalid field, or to the error summary.
      const target =
        form.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]') ??
        form.querySelector<HTMLElement>("[data-form-message]");
      target?.focus();
    } else if (state.status === "success" && resetOnSuccess) {
      form.reset();
    }
  }, [state, resetOnSuccess]);

  return {
    state,
    pending,
    fieldError: (name: string) => state.fieldErrors?.[name]?.[0],
    formProps: {
      ref: formRef,
      action: formAction,
      onSubmit,
      noValidate: true,
    },
  };
}
