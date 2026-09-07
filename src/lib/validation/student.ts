import { z } from "zod";

// formData.get() returns null for a field that has no matching form
// control at all (as opposed to an empty string for one that's just
// empty), so this must tolerate both.
const optionalText = z
  .string()
  .nullable()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

export const studentStatusOptions = [
  "ENQUIRY",
  "APPLICATION",
  "WAITING_LIST",
  "ACTIVE",
] as const;

export const studentSchema = z.object({
  familyId: z.string().min(1, "Family is required"),
  firstName: z.string().trim().min(1, "First name is required"),
  middleName: optionalText,
  lastName: z.string().trim().min(1, "Last name is required"),
  preferredName: optionalText,
  dob: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date")
    .refine((v) => new Date(v) <= new Date(), "Date of birth can't be in the future"),
  gender: z.enum(["MALE", "FEMALE"]),
  addressLine1: optionalText,
  addressLine2: optionalText,
  city: optionalText,
  postcode: optionalText,
  status: z.enum(studentStatusOptions).default("ENQUIRY"),
});

export type StudentInput = z.infer<typeof studentSchema>;
