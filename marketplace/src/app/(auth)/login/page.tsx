import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/auth-forms";
import { Card } from "@/components/ui/layout";
import { DEMO_CLIENT_EMAIL, DEMO_FREELANCER_EMAIL } from "@/db/seed-data";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next: rawNext } = await searchParams;
  const next = safeNextPath(Array.isArray(rawNext) ? rawNext[0] : rawNext);
  if (await getCurrentUser()) redirect(next);

  const showDemoAccounts = process.env.SHOW_DEMO_ACCOUNTS !== "false";

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Welcome back</h1>
      <p className="mt-2 text-slate-600">Log in to manage your projects and proposals.</p>
      <Card className="mt-8 p-6 sm:p-8">
        <LoginForm next={next} />
      </Card>
      {showDemoAccounts && (
        <aside aria-label="Demo accounts" className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-medium">Exploring the demo?</p>
          <p className="mt-1">
            Log in as <code className="font-mono text-xs">{DEMO_CLIENT_EMAIL}</code> (client) or{" "}
            <code className="font-mono text-xs">{DEMO_FREELANCER_EMAIL}</code> (freelancer). The
            password is the <code className="font-mono text-xs">SEED_DEMO_PASSWORD</code> value from
            your <code className="font-mono text-xs">.env</code> file.
          </p>
        </aside>
      )}
    </>
  );
}
