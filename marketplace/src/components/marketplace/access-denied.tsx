import { ShieldAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container, EmptyState } from "@/components/ui/layout";

/** Shown when a signed-in user opens a page meant for the other role. */
export function AccessDenied({
  title,
  description,
  actionHref = "/dashboard",
  actionLabel = "Go to your dashboard",
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <Container className="max-w-2xl py-16">
      <h1 className="sr-only">{title}</h1>
      <EmptyState
        icon={<ShieldAlert className="size-6" />}
        title={title}
        description={description}
        action={<ButtonLink href={actionHref}>{actionLabel}</ButtonLink>}
      />
    </Container>
  );
}
