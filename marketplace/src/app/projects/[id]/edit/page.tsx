import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/forms/project-form";
import { AccessDenied } from "@/components/marketplace/access-denied";
import { Card, Container, PageHeader } from "@/components/ui/layout";
import { requireUser } from "@/lib/auth/session";
import { updateProjectAction } from "@/server/actions/projects";
import { listCategories, listSkills } from "@/server/services/catalog";
import { getProjectDetail } from "@/server/services/projects";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({ params }: PageProps<"/projects/[id]/edit">) {
  const { id: rawId } = await params;
  const user = await requireUser(`/projects/${rawId}/edit`);
  const id = Number(rawId);
  const project = Number.isInteger(id) && id > 0 ? await getProjectDetail(id) : null;
  if (!project) notFound();

  if (project.client.id !== user.id) {
    return (
      <AccessDenied
        title="You can't edit this project"
        description="Only the client who posted a project can edit it."
        actionHref={`/projects/${project.id}`}
        actionLabel="View project"
      />
    );
  }
  if (project.status === "in_progress" || project.status === "completed") {
    return (
      <AccessDenied
        title="This project can no longer be edited"
        description="You've already hired someone, so the project details are locked."
        actionHref={`/dashboard/projects/${project.id}`}
        actionLabel="Back to project"
      />
    );
  }

  const [categories, skills] = await Promise.all([listCategories(), listSkills()]);
  return (
    <Container className="max-w-3xl py-10 sm:py-12">
      <PageHeader title="Edit project" description={project.title} />
      <Card className="mt-8 p-6 sm:p-8">
        <ProjectForm
          action={updateProjectAction}
          projectId={project.id}
          categories={categories}
          skills={skills}
          submitLabel="Save changes"
          cancelHref={`/dashboard/projects/${project.id}`}
          initial={{
            title: project.title,
            description: project.description,
            categoryId: project.categoryId,
            budgetType: project.budgetType,
            budgetMin: project.budgetMin,
            budgetMax: project.budgetMax,
            skills: project.skills.map((s) => s.name),
          }}
        />
      </Card>
    </Container>
  );
}
