import { z } from "zod";
import {
  monthlyCommunicationDateSchema
} from "@/lib/monthly-communication/schemas";

const optionalUuidSchema = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .pipe(z.uuid().optional());

const optionalTextSchema = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => (value.length > 0 ? value : null));

const optionalDateSchema = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .pipe(monthlyCommunicationDateSchema.nullable());

const optionalNonNegativeIntegerSchema = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? Number(value) : null))
  .pipe(z.number().int().min(0).nullable());

export const optimizationItemCategorySchema = z.enum([
  "google_ads",
  "meta_ads",
  "tiktok_ads",
  "merchant_center",
  "measurement",
  "reporting",
  "other"
]);

export const optimizationItemStatusSchema = z.enum([
  "planned",
  "in_progress",
  "completed",
  "cancelled"
]);

export const approvalStatusSchema = z.enum(["draft", "approved", "hidden"]);

export const clientActionPrioritySchema = z.enum([
  "urgent",
  "recommended",
  "opportunity"
]);

export const clientActionVisibleStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
  "dismissed"
]);

export const clientActionVisibilitySchema = z.enum(["draft", "visible", "hidden"]);

export const optimizationItemInputSchema = z
  .object({
    itemId: optionalUuidSchema,
    projectId: z.uuid(),
    category: optimizationItemCategorySchema,
    title: z.string().trim().min(1).max(160),
    description: optionalTextSchema(700),
    status: optimizationItemStatusSchema,
    approvalStatus: approvalStatusSchema,
    isClientVisible: z.boolean(),
    startedDate: optionalDateSchema,
    completedDate: optionalDateSchema
  })
  .superRefine((input, context) => {
    if (input.approvalStatus !== "approved" && input.isClientVisible) {
      context.addIssue({
        code: "custom",
        message: "Draft or hidden optimization items cannot be client-visible.",
        path: ["isClientVisible"]
      });
    }
  });

export const clientActionItemInputSchema = z
  .object({
    itemId: optionalUuidSchema,
    projectId: z.uuid(),
    category: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(160),
    description: optionalTextSchema(700),
    priority: clientActionPrioritySchema,
    affectedCount: optionalNonNegativeIntegerSchema,
    visibility: clientActionVisibilitySchema,
    status: clientActionVisibleStatusSchema,
    dueDate: optionalDateSchema,
    resolvedDate: optionalDateSchema
  })
  .superRefine((input, context) => {
    if (input.visibility !== "visible" && input.resolvedDate) {
      context.addIssue({
        code: "custom",
        message: "Hidden or draft client action items cannot have a resolved date.",
        path: ["resolvedDate"]
      });
    }
  });

export type OptimizationItemInput = Readonly<{
  itemId?: string;
  projectId: string;
  category: string;
  title: string;
  description: string;
  status: string;
  approvalStatus: string;
  isClientVisible: boolean;
  startedDate: string;
  completedDate: string;
}>;
export type ParsedOptimizationItemInput = z.output<typeof optimizationItemInputSchema>;
export type ClientActionItemInput = Readonly<{
  itemId?: string;
  projectId: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  affectedCount: string;
  visibility: string;
  status: string;
  dueDate: string;
  resolvedDate: string;
}>;
export type ParsedClientActionItemInput = z.output<typeof clientActionItemInputSchema>;
