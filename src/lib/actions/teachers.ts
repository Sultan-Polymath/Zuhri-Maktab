"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { generatePin } from "@/lib/generate-password";
import { requireUser } from "./require-user";
import { teacherSchema } from "@/lib/validation/teacher";

export type ActionState = { error?: string } | undefined;
export type PinActionState = { error?: string; pin?: string } | undefined;

const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;

function slugifyForEmail(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "teacher";
}

async function uniqueTeacherLoginEmail(name: string): Promise<string> {
  const base = slugifyForEmail(name);
  for (let suffix = 0; ; suffix++) {
    const email = `${base}${suffix ? `-${suffix}` : ""}@teacher.maktab.local`;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) return email;
  }
}

function parseTeacherForm(formData: FormData) {
  return teacherSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    role: formData.get("role"),
    startDate: formData.get("startDate"),
    status: formData.get("status") || "ACTIVE",
    notes: formData.get("notes"),
  });
}

export async function createTeacher(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...STAFF_ROLES]);

  const parsed = parseTeacherForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { startDate, ...rest } = parsed.data;

  const teacher = await prisma.$transaction(async (tx) => {
    const teacher = await tx.teacher.create({
      data: { ...rest, startDate: startDate ? new Date(startDate) : undefined },
    });
    await logAudit(tx, {
      entityType: "Teacher",
      entityId: teacher.id,
      action: "created",
      newValue: parsed.data,
      userId: user.id,
    });
    return teacher;
  });

  revalidatePath("/teachers");
  redirect(`/teachers/${teacher.id}/edit`);
}

export async function updateTeacher(
  teacherId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...STAFF_ROLES]);

  const parsed = parseTeacherForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { startDate, ...rest } = parsed.data;

  const before = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!before) return { error: "Teacher not found." };

  await prisma.$transaction(async (tx) => {
    await tx.teacher.update({
      where: { id: teacherId },
      data: { ...rest, startDate: startDate ? new Date(startDate) : null },
    });
    await logAudit(tx, {
      entityType: "Teacher",
      entityId: teacherId,
      action: "updated",
      previousValue: before,
      newValue: parsed.data,
      userId: user.id,
    });
  });

  revalidatePath("/teachers");
  redirect("/teachers");
}

export async function createTeacherPinLogin(teacherId: string): Promise<PinActionState> {
  const actor = await requireUser([...STAFF_ROLES]);

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) return { error: "Teacher not found." };
  if (teacher.userId) return { error: "This teacher already has a login." };

  const pin = generatePin();
  const pinHash = await bcrypt.hash(pin, 12);
  const passwordHash = await bcrypt.hash(randomBytes(24).toString("hex"), 12);
  const email = await uniqueTeacherLoginEmail(teacher.name);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: teacher.name, email, role: "TEACHER", passwordHash, pinHash },
    });
    await tx.teacher.update({ where: { id: teacherId }, data: { userId: user.id } });
    await logAudit(tx, {
      entityType: "Teacher",
      entityId: teacherId,
      action: "pin_login_created",
      userId: actor.id,
    });
  });

  revalidatePath(`/teachers/${teacherId}/edit`);
  return { pin };
}

export async function resetTeacherPin(teacherId: string): Promise<PinActionState> {
  const actor = await requireUser([...STAFF_ROLES]);

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher?.userId) return { error: "This teacher doesn't have a login yet." };

  const pin = generatePin();
  const pinHash = await bcrypt.hash(pin, 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: teacher.userId! },
      data: { pinHash, pinFailedAttempts: 0, pinLockedUntil: null },
    });
    await logAudit(tx, {
      entityType: "Teacher",
      entityId: teacherId,
      action: "pin_reset",
      userId: actor.id,
    });
  });

  revalidatePath(`/teachers/${teacherId}/edit`);
  return { pin };
}
