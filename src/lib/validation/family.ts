import { z } from "zod";

// formData.get() returns null for a field that has no matching form
// control at all (as opposed to an empty string for one that's just
// empty), so this must tolerate both. Transforms to null (not undefined)
// so that clearing a field in an edit form actually clears it — Prisma's
// update() silently ignores undefined keys instead of nulling them out.
const optionalText = z
  .string()
  .nullable()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null));

export const familySchema = z.object({
  surnameLabel: z.string().trim().min(1, "Family name is required"),
  addressLine1: optionalText,
  addressLine2: optionalText,
  city: optionalText,
  postcode: optionalText,
});

export const guardianSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  relationship: z.string().trim().min(1, "Relationship is required"),
  phone: optionalText,
  secondaryPhone: optionalText,
  email: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null))
    .refine((v) => v === null || z.email().safeParse(v).success, "Enter a valid email address"),
  isPrimaryContact: z.boolean().default(false),
  isEmergencyContact: z.boolean().default(false),
  preferredContactMethod: z
    .enum(["PHONE", "EMAIL", "SMS", "WHATSAPP"])
    .default("PHONE"),
});

export type FamilyInput = z.infer<typeof familySchema>;
export type GuardianInput = z.infer<typeof guardianSchema>;
