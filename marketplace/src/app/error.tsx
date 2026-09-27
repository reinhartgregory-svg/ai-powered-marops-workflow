"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex max-w-xl flex-col items-center py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-red-50 text-red-700">
        <AlertTriangle aria-hidden="true" className="size-7" />
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">Something went wrong</h1>
      <p className="mt-3 text-slate-600">
        We couldn&apos;t load this page. Please try again — if it keeps happening, check that the
        database is set up (<code className="font-mono text-sm">npm run setup</code>).
      </p>
      {error.digest && <p className="mt-2 text-xs text-slate-400">Reference: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Go home
        </ButtonLink>
      </div>
    </Container>
  );
}
