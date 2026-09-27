"use client";

import { useState } from "react";
import { DURATIONS, type BudgetType } from "@/db/schema";
import { DURATION_LABELS } from "@/lib/constants";
import { formatBudget } from "@/lib/format";
import { submitProposalAction } from "@/server/actions/proposals";
import { SelectField, TextAreaField, TextField } from "./fields";
import { FormMessage, SubmitButton } from "./form-controls";
import { useActionForm } from "./use-action-form";

const MAX_LETTER = 3000;

export function ProposalForm({
  projectId,
  budgetType,
  budgetMin,
  budgetMax,
  suggestedRate,
}: {
  projectId: number;
  budgetType: BudgetType;
  budgetMin: number;
  budgetMax: number;
  suggestedRate?: number;
}) {
  const { state, pending, fieldError, formProps } = useActionForm(submitProposalAction);
  const [letterLength, setLetterLength] = useState(0);
  const hourly = budgetType === "hourly";

  return (
    <form {...formProps} className="space-y-5">
      <FormMessage state={state} />
      <input type="hidden" name="projectId" value={projectId} />
      <TextAreaField
        label="Cover letter"
        name="coverLetter"
        required
        rows={8}
        maxLength={MAX_LETTER}
        onChange={(event) => setLetterLength(event.target.value.length)}
        hint={
          <>
            Explain how you&apos;d approach the work and share relevant experience. At least 50
            characters. <span className="tabular-nums">({letterLength.toLocaleString()} / {MAX_LETTER.toLocaleString()})</span>
          </>
        }
        error={fieldError("coverLetter")}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label={hourly ? "Your hourly rate" : "Your fixed price"}
          name="bidAmount"
          type="number"
          inputMode="numeric"
          min={5}
          required
          prefix="$"
          suffix={hourly ? "/hr" : undefined}
          defaultValue={hourly ? suggestedRate : undefined}
          hint={`Client's budget: ${formatBudget(budgetType, budgetMin, budgetMax)}`}
          error={fieldError("bidAmount")}
        />
        <SelectField
          label="Estimated duration"
          name="estimatedDuration"
          required
          defaultValue=""
          error={fieldError("estimatedDuration")}
        >
          <option value="" disabled>
            Choose a timeframe
          </option>
          {DURATIONS.map((value) => (
            <option key={value} value={value}>
              {DURATION_LABELS[value]}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          The client will see your proposal alongside your public profile.
        </p>
        <SubmitButton pending={pending} pendingText="Sending…">
          Send proposal
        </SubmitButton>
      </div>
    </form>
  );
}
