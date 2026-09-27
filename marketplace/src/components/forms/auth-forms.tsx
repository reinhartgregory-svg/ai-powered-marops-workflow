"use client";

import { Briefcase, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { UserRole } from "@/db/schema";
import { loginAction, signupAction } from "@/server/actions/auth";
import { RadioCards, TextField } from "./fields";
import { FormMessage, SubmitButton } from "./form-controls";
import { PasswordField } from "./password-field";
import { useActionForm } from "./use-action-form";

export function LoginForm({ next }: { next: string }) {
  const { state, pending, fieldError, formProps } = useActionForm(loginAction);
  return (
    <form {...formProps} className="space-y-5">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next} />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={fieldError("email")}
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        required
        error={fieldError("password")}
      />
      <SubmitButton pending={pending} pendingText="Logging in…" size="lg" className="w-full">
        Log in
      </SubmitButton>
      <p className="text-center text-sm text-slate-600">
        New here?{" "}
        <Link href="/signup" className="font-medium text-brand-700 hover:text-brand-800">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm({ defaultRole }: { defaultRole?: UserRole }) {
  const { state, pending, fieldError, formProps } = useActionForm(signupAction);
  const [role, setRole] = useState<UserRole | undefined>(defaultRole);

  return (
    <form
      {...formProps}
      className="space-y-5"
      onChange={(event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement && target.name === "role") {
          setRole(target.value as UserRole);
        }
      }}
    >
      <FormMessage state={state} />
      <RadioCards<UserRole>
        legend="How do you want to use the marketplace?"
        name="role"
        required
        defaultValue={defaultRole}
        error={fieldError("role")}
        options={[
          {
            value: "client",
            label: "I want to hire",
            description: "Post projects and review proposals.",
            icon: <Briefcase aria-hidden="true" className="size-4 text-brand-700" />,
          },
          {
            value: "freelancer",
            label: "I want to work",
            description: "Build a profile and send proposals.",
            icon: <UserRound aria-hidden="true" className="size-4 text-brand-700" />,
          },
        ]}
      />
      <TextField
        label="Full name"
        name="name"
        autoComplete="name"
        required
        error={fieldError("name")}
      />
      {role !== "freelancer" && (
        <TextField
          label="Company or team name"
          name="companyName"
          autoComplete="organization"
          optional
          hint={role ? "Shown on your project posts." : "For client accounts only."}
          error={fieldError("companyName")}
        />
      )}
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={fieldError("email")}
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint="At least 8 characters."
        error={fieldError("password")}
      />
      <SubmitButton pending={pending} pendingText="Creating account…" size="lg" className="w-full">
        Create account
      </SubmitButton>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-700 hover:text-brand-800">
          Log in
        </Link>
      </p>
    </form>
  );
}
