import type { UserRole } from "@prisma/client";
import { auth } from "@/auth";

export class ActionAuthError extends Error {}

export async function requireUser(allowedRoles?: UserRole[]) {
  const session = await auth();
  if (!session?.user) throw new ActionAuthError("You must be signed in.");
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw new ActionAuthError("You don't have permission to do that.");
  }
  return session.user;
}
