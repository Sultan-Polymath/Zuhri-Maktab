import { z } from "zod";

const optionalText = z
  .string()
  .nullable()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

export const dayOptions = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
] as const;

export const classSchema = z.object({
  name: z.string().trim().min(1, "Class name is required"),
  yearGroup: optionalText,
  primaryTeacherId: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined)),
  days: z.array(z.enum(dayOptions)).default([]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  room: optionalText,
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  notes: optionalText,
});

export type ClassInput = z.infer<typeof classSchema>;
