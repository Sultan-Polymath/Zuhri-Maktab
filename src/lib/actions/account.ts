"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireUser } from "./require-user";
import { passwordSchema } from "@/lib/validation/user";

export type ActionState = { error?: string; success?: boolean } | undefined;

export async function changeOwnPassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const parsedPassword = passwordSchema.safeParse(newPassword);
  if (!parsedPassword.success) {
    return { error: parsedPassword.error.issues[0]?.message ?? "Invalid password." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords don't match." };
  }

  const user = await prisma.user.findUnique({ where: { id: actor.id } });
  if (!user) return { error: "User not found." };

  const currentValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!currentValid) return { error: "Current password is incorrect." };

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: actor.id }, data: { passwordHash } });
    await logAudit(tx, {
      entityType: "User",
      entityId: actor.id,
      action: "password_changed_self",
      userId: actor.id,
    });
  });

  return { success: true };
}
