"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireUser } from "./require-user";
import { assignStudentToClass } from "./class-transfer";

export type ActionState = { error?: string; success?: boolean } | undefined;

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;

async function requireOwnClass(studentId: string, userId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw new Error("No teacher profile is linked to your account.");

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student?.currentClassId) throw new Error("Student not found, or not currently in a class.");

  const klass = await prisma.class.findUnique({
    where: { id: student.currentClassId },
    include: { assistants: true },
  });
  const isOwnClass =
    klass?.primaryTeacherId === teacher.id || klass?.assistants.some((a) => a.teacherId === teacher.id);
  if (!isOwnClass) throw new Error("You can only request changes for your own class.");

  return student;
}

export async function requestNameChange(
  studentId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser(["TEACHER"]);

  let student;
  try {
    student = await requireOwnClass(studentId, user.id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Not allowed." };
  }

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (!firstName || !lastName) return { error: "First and last name are required." };
  const note = String(formData.get("note") ?? "").trim() || null;

  await prisma.changeRequest.create({
    data: {
      type: "STUDENT_NAME_EDIT",
      studentId,
      requestedById: user.id,
      payload: { firstName, lastName },
      note,
    },
  });

  revalidatePath(`/classes/${student.currentClassId}`);
  return { success: true };
}

export async function requestClassTransfer(
  studentId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser(["TEACHER"]);

  let student;
  try {
    student = await requireOwnClass(studentId, user.id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Not allowed." };
  }

  const toClassId = String(formData.get("toClassId") ?? "");
  if (!toClassId) return { error: "Select a class." };
  if (toClassId === student.currentClassId) return { error: "Student is already in that class." };
  const note = String(formData.get("note") ?? "").trim() || null;

  await prisma.changeRequest.create({
    data: {
      type: "CLASS_TRANSFER",
      studentId,
      requestedById: user.id,
      payload: { toClassId },
      note,
    },
  });

  revalidatePath(`/classes/${student.currentClassId}`);
  return { success: true };
}

export async function approveChangeRequest(requestId: string): Promise<ActionState> {
  const actor = await requireUser([...ADMIN_ROLES]);

  const req = await prisma.changeRequest.findUnique({ where: { id: requestId } });
  if (!req || req.status !== "PENDING") return { error: "Request not found, or already reviewed." };

  if (req.type === "STUDENT_NAME_EDIT") {
    const { firstName, lastName } = req.payload as { firstName: string; lastName: string };
    const before = await prisma.student.findUnique({ where: { id: req.studentId } });
    if (!before) return { error: "Student no longer exists." };

    await prisma.$transaction(async (tx) => {
      await tx.student.update({ where: { id: req.studentId }, data: { firstName, lastName } });
      await tx.changeRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED", reviewedById: actor.id, reviewedAt: new Date() },
      });
      await logAudit(tx, {
        entityType: "Student",
        entityId: req.studentId,
        action: "name_changed_via_request",
        previousValue: { firstName: before.firstName, lastName: before.lastName },
        newValue: { firstName, lastName },
        userId: actor.id,
      });
    });
  } else {
    const { toClassId } = req.payload as { toClassId: string };
    const transferForm = new FormData();
    transferForm.set("toClassId", toClassId);
    transferForm.set("reason", `Approved teacher request${req.note ? `: ${req.note}` : ""}`);
    const result = await assignStudentToClass(req.studentId, undefined, transferForm);
    if (result?.error) return { error: result.error };

    await prisma.changeRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", reviewedById: actor.id, reviewedAt: new Date() },
    });
  }

  revalidatePath("/change-requests");
  revalidatePath("/classes");
  return { success: true };
}

export async function rejectChangeRequest(
  requestId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser([...ADMIN_ROLES]);

  const reviewNote = String(formData.get("reviewNote") ?? "").trim() || null;

  await prisma.changeRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", reviewedById: actor.id, reviewedAt: new Date(), reviewNote },
  });

  revalidatePath("/change-requests");
  return { success: true };
}
