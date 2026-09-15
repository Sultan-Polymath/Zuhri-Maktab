import { z } from "zod";

export const feeFrequencyOptions = ["MONTHLY", "TERMLY", "ANNUAL", "CUSTOM"] as const;

export const feePlanSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  frequency: z.enum(feeFrequencyOptions),
  isActive: z.boolean().default(true),
  notes: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null)),
});

export type FeePlanInput = z.infer<typeof feePlanSchema>;
