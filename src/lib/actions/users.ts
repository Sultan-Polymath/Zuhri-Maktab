"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { generateTempPassword } from "@/lib/generate-password";
import { requireUser } from "./require-user";
import { userSchema } from "@/lib/validation/user";

const USER_ADMIN_ROLES = ["SUPER_ADMIN"] as const;

export type ActionState =
  | { error?: string; tempPassword?: string; userId?: string }
  | undefined;

function parseUserForm(formData: FormData) {
  return userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
}

export async function createUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser([...USER_ADMIN_ROLES]);

  const parsed = parseUserForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "A user with this email already exists." };

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: parsed.data.name, email, role: parsed.data.role, passwordHash },
    });
    await logAudit(tx, {
      entityType: "User",
      entityId: user.id,
      action: "created",
      newValue: { name: parsed.data.name, email, role: parsed.data.role },
      userId: actor.id,
    });
    return user;
  });

  revalidatePath("/settings/users");
  return { tempPassword, userId: user.id };
}

export async function updateUser(
  userId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser([...USER_ADMIN_ROLES]);

  const parsed = parseUserForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const email = parsed.data.email.toLowerCase();
  const isActive = formData.get("isActive") === "on";

  const before = await prisma.user.findUnique({ where: { id: userId } });
  if (!before) return { error: "User not found." };

  const emailOwner = await prisma.user.findUnique({ where: { email } });
  if (emailOwner && emailOwner.id !== userId) {
    return { error: "Another user already has this email." };
  }

  if (before.role === "SUPER_ADMIN" && (parsed.data.role !== "SUPER_ADMIN" || !isActive)) {
    const otherActiveSuperAdmins = await prisma.user.count({
      where: { role: "SUPER_ADMIN", isActive: true, id: { not: userId } },
    });
    if (otherActiveSuperAdmins === 0) {
      return { error: "There must be at least one active Super Admin." };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { name: parsed.data.name, email, role: parsed.data.role, isActive },
    });
    await logAudit(tx, {
      entityType: "User",
      entityId: userId,
      action: "updated",
      previousValue: before,
      newValue: { name: parsed.data.name, email, role: parsed.data.role, isActive },
      userId: actor.id,
    });
  });

  revalidatePath("/settings/users");
  return {};
}

export async function toggleUserActive(userId: string): Promise<void> {
  const actor = await requireUser([...USER_ADMIN_ROLES]);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  if (user.role === "SUPER_ADMIN" && user.isActive) {
    const otherActiveSuperAdmins = await prisma.user.count({
      where: { role: "SUPER_ADMIN", isActive: true, id: { not: userId } },
    });
    if (otherActiveSuperAdmins === 0) {
      throw new Error("There must be at least one active Super Admin.");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
    await logAudit(tx, {
      entityType: "User",
      entityId: userId,
      action: user.isActive ? "deactivated" : "activated",
      userId: actor.id,
    });
  });

  revalidatePath("/settings/users");
}

export async function resetUserPassword(userId: string): Promise<ActionState> {
  const actor = await requireUser([...USER_ADMIN_ROLES]);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { passwordHash } });
    await logAudit(tx, {
      entityType: "User",
      entityId: userId,
      action: "password_reset",
      userId: actor.id,
    });
  });

  return { tempPassword };
}
