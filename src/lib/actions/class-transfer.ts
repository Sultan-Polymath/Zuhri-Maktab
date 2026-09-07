"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireUser } from "./require-user";

export type ActionState = { error?: string; success?: boolean } | undefined;

const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;

export async function assignStudentToClass(
  studentId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...STAFF_ROLES]);

  const toClassId = String(formData.get("toClassId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || undefined;
  if (!toClassId) return { error: "Select a class." };

  const [student, toClass] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId } }),
    prisma.class.findUnique({
      where: { id: toClassId },
      include: { _count: { select: { students: true } } },
    }),
  ]);
  if (!student) return { error: "Student not found." };
  if (!toClass) return { error: "Class not found." };

  if (student.currentClassId === toClassId) {
    return { error: "This student is already in that class." };
  }
  if (toClass._count.students >= toClass.capacity) {
    return { error: `${toClass.name} is already at capacity (${toClass.capacity}/${toClass.capacity}).` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.student.update({
      where: { id: studentId },
      data: { currentClassId: toClassId },
    });
    const transfer = await tx.classTransfer.create({
      data: {
        studentId,
        fromClassId: student.currentClassId,
        toClassId,
        reason,
        changedByUserId: user.id,
      },
    });
    await logAudit(tx, {
      entityType: "Student",
      entityId: studentId,
      action: "class_changed",
      previousValue: { classId: student.currentClassId },
      newValue: { classId: toClassId, transferId: transfer.id, reason },
      userId: user.id,
    });
  });

  revalidatePath(`/students/${studentId}`);
  revalidatePath(`/classes/${toClassId}`);
  if (student.currentClassId) revalidatePath(`/classes/${student.currentClassId}`);

  return { success: true };
}

export async function removeStudentFromClass(
  studentId: string,
  reason?: string,
): Promise<void> {
  const user = await requireUser([...STAFF_ROLES]);

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student || !student.currentClassId) return;

  const fromClassId = student.currentClassId;

  await prisma.$transaction(async (tx) => {
    await tx.student.update({
      where: { id: studentId },
      data: { currentClassId: null },
    });
    await logAudit(tx, {
      entityType: "Student",
      entityId: studentId,
      action: "class_removed",
      previousValue: { classId: fromClassId },
      newValue: { classId: null, reason },
      userId: user.id,
    });
  });

  revalidatePath(`/students/${studentId}`);
  revalidatePath(`/classes/${fromClassId}`);
}
