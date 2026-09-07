import { z } from "zod";

export const adjustmentTypeOptions = [
  "SIBLING_DISCOUNT",
  "SCHOLARSHIP",
  "CONCESSION",
  "WAIVER",
  "REFUND",
  "CREDIT",
  "MANUAL",
] as const;

export const adjustmentFormSchema = z
  .object({
    type: z.enum(adjustmentTypeOptions),
    amount: z.coerce.number().positive().optional(),
    percent: z.coerce.number().positive().max(100).optional(),
    reason: z.string().trim().min(1, "Reason is required"),
    isRecurring: z.boolean().default(false),
    effectiveFrom: z.string().min(1, "Effective from date is required"),
    effectiveTo: z
      .string()
      .nullable()
      .optional()
      .transform((v) => (v && v.trim() !== "" ? v : undefined)),
  })
  .refine((data) => (data.amount ? !data.percent : !!data.percent), {
    message: "Enter either a fixed amount or a percentage, not both.",
    path: ["amount"],
  });

export type AdjustmentFormInput = z.infer<typeof adjustmentFormSchema>;
