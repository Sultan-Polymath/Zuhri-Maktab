import { z } from "zod";

export const paymentMethodSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  isActive: z.boolean().default(true),
});

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
