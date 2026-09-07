"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireUser } from "./require-user";
import { teacherSchema } from "@/lib/validation/teacher";

export type ActionState = { error?: string } | undefined;

const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;

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
