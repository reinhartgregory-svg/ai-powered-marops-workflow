import { FileQuestion } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";

export default function NotFound() {
  return (
    <Container className="flex max-w-xl flex-col items-center py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <FileQuestion aria-hidden="true" className="size-7" />
      </span>
      <p className="mt-6 text-sm font-semibold text-brand-700">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-3 text-slate-600">
        The page you&apos;re looking for doesn&apos;t exist, or the project or profile was removed.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Go home</ButtonLink>
        <ButtonLink href="/projects" variant="secondary">
          Browse projects
        </ButtonLink>
      </div>
    </Container>
  );
}
