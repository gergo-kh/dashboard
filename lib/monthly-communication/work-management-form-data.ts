import type {
  ClientActionItemInput,
  OptimizationItemInput
} from "@/lib/monthly-communication/work-management-schemas";

export function optimizationItemFromFormData(formData: FormData): OptimizationItemInput {
  return {
    itemId: optionalText(formData, "itemId"),
    projectId: readText(formData, "projectId"),
    category: readText(formData, "category"),
    title: readText(formData, "title"),
    description: readText(formData, "description"),
    status: readText(formData, "status"),
    approvalStatus: readText(formData, "approvalStatus"),
    isClientVisible: readCheckbox(formData, "isClientVisible"),
    startedDate: readText(formData, "startedDate"),
    completedDate: readText(formData, "completedDate")
  };
}

export function clientActionItemFromFormData(formData: FormData): ClientActionItemInput {
  return {
    itemId: optionalText(formData, "itemId"),
    projectId: readText(formData, "projectId"),
    category: readText(formData, "category"),
    title: readText(formData, "title"),
    description: readText(formData, "description"),
    priority: readText(formData, "priority"),
    affectedCount: readText(formData, "affectedCount"),
    visibility: readText(formData, "visibility"),
    status: readText(formData, "status"),
    dueDate: readText(formData, "dueDate"),
    resolvedDate: readText(formData, "resolvedDate")
  };
}

function readText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, name: string) {
  const value = readText(formData, name);

  return value.length > 0 ? value : undefined;
}

function readCheckbox(formData: FormData, name: string) {
  return formData.get(name) === "true";
}
