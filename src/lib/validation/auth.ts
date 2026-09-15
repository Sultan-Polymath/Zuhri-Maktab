import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

export const pinLoginSchema = z.object({
  userId: z.string().min(1),
  pin: z.string().regex(/^\d{6}$/, "Enter your 6-digit PIN"),
});
