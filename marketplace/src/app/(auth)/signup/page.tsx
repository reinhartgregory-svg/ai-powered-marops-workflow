import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/forms/auth-forms";
import { Card } from "@/components/ui/layout";
import { USER_ROLES, type UserRole } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { role } = await searchParams;
  const defaultRole = USER_ROLES.includes(role as UserRole) ? (role as UserRole) : undefined;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        Create your account
      </h1>
      <p className="mt-2 text-slate-600">
        {defaultRole === "freelancer"
          ? "Set up your profile and start sending proposals today."
          : defaultRole === "client"
            ? "Post your first project and start receiving proposals."
            : "Hire talent or find work — it only takes a minute."}
      </p>
      <Card className="mt-8 p-6 sm:p-8">
        <SignupForm defaultRole={defaultRole} />
      </Card>
    </>
  );
}
