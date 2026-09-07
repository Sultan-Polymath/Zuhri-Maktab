import { z } from "zod";

const optionalText = z
  .string()
  .nullable()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

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
    .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined))
    .pipe(z.email().optional()),
  role: z.enum(teacherRoleOptions),
  startDate: optionalText,
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  notes: optionalText,
});

export type TeacherInput = z.infer<typeof teacherSchema>;
