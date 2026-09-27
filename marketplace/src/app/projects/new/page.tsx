import type { Metadata } from "next";
import { ProjectForm } from "@/components/forms/project-form";
import { AccessDenied } from "@/components/marketplace/access-denied";
import { Card, Container, PageHeader } from "@/components/ui/layout";
import { requireUser } from "@/lib/auth/session";
import { createProjectAction } from "@/server/actions/projects";
import { listCategories, listSkills } from "@/server/services/catalog";

export const metadata: Metadata = { title: "Post a project" };

export default async function NewProjectPage() {
  const user = await requireUser("/projects/new");
  if (user.role !== "client") {
    return (
      <AccessDenied
        title="Only clients can post projects"
        description="You're signed in with a freelancer account. Browse open projects and send proposals instead."
        actionHref="/projects"
        actionLabel="Browse projects"
      />
    );
  }

  const [categories, skills] = await Promise.all([listCategories(), listSkills()]);
  return (
    <Container className="max-w-3xl py-10 sm:py-12">
      <PageHeader
        title="Post a project"
        description="Describe the work and your budget. Freelancers will send proposals you can compare from your dashboard."
      />
      <Card className="mt-8 p-6 sm:p-8">
        <ProjectForm
          action={createProjectAction}
          categories={categories}
          skills={skills}
          submitLabel="Post project"
          cancelHref="/dashboard"
        />
      </Card>
    </Container>
  );
}
