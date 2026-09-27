"use server";

import type { FormState } from "@/lib/form-state";
import { projectSchema, readSkills, readString } from "@/lib/validation";
import {
  changeProjectStatus,
  createProject,
  PROJECT_ACTIONS,
  updateProject,
  type ProjectAction,
} from "../services/projects";
import { invalid, readId, runAction } from "./helpers";

function parseProject(formData: FormData) {
  return projectSchema.safeParse({
    title: readString(formData, "title"),
    description: readString(formData, "description"),
    categoryId: readString(formData, "categoryId"),
    budgetType: readString(formData, "budgetType"),
    budgetMin: readString(formData, "budgetMin"),
    budgetMax: readString(formData, "budgetMax"),
    skills: readSkills(formData),
  });
}

export async function createProjectAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runAction(async (actor) => {
    const parsed = parseProject(formData);
    if (!parsed.success) return invalid(parsed.error);
    const projectId = await createProject(actor, parsed.data);
    return {
      status: "success",
      redirectTo: `/dashboard/projects/${projectId}?notice=project-posted`,
    };
  });
}

export async function updateProjectAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const projectId = readId(formData, "projectId");
  if (!projectId) return { status: "error", message: "That project doesn't exist." };

  return runAction(async (actor) => {
    const parsed = parseProject(formData);
    if (!parsed.success) return invalid(parsed.error);
    await updateProject(actor, projectId, parsed.data);
    return {
      status: "success",
      redirectTo: `/dashboard/projects/${projectId}?notice=project-updated`,
    };
  });
}

const STATUS_MESSAGES: Record<ProjectAction, string> = {
  close: "Project closed. It no longer accepts new proposals.",
  reopen: "Project reopened and accepting proposals again.",
  complete: "Project marked as completed.",
};

export async function changeProjectStatusAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runAction(async (actor) => {
    const projectId = readId(formData, "projectId");
    const action = readString(formData, "action") as ProjectAction;
    if (!projectId || !PROJECT_ACTIONS.includes(action)) {
      return { status: "error", message: "That action isn't available." };
    }
    await changeProjectStatus(actor, projectId, action);
    return { status: "success", message: STATUS_MESSAGES[action] };
  });
}
