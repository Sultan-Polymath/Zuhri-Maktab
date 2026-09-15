import { z } from "zod";

// Transforms to null (not undefined) so that clearing a field in an edit
// form actually clears it — Prisma's update() silently ignores undefined
// keys instead of nulling them out.
const optionalText = z
  .string()
  .nullable()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null));

export const teacherRoleOptions = [
  "TEACHER",
  "ASSISTANT_TEACHER",
  "HEAD_TEACHER",
  "ADMINISTRATOR",
] as const;

export const teacherSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: optionalText,
  email: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null))
    .refine((v) => v === null || z.email().safeParse(v).success, "Enter a valid email address"),
  role: z.enum(teacherRoleOptions),
  startDate: optionalText,
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  notes: optionalText,
});

export type TeacherInput = z.infer<typeof teacherSchema>;
