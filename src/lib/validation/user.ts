import { z } from "zod";

export const userRoleOptions = [
  "SUPER_ADMIN",
  "ADMIN",
  "FINANCE",
  "TEACHER",
] as const;

export const userSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email("Enter a valid email address"),
  role: z.enum(userRoleOptions),
});

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

export type UserInput = z.infer<typeof userSchema>;
