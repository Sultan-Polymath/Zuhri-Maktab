"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { nextStudentCode } from "@/lib/student-code";
import { requireUser } from "./require-user";
import { studentSchema } from "@/lib/validation/student";

export type ActionState = { error?: string } | undefined;

const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE"] as const;

function parseStudentForm(formData: FormData) {
  return studentSchema.safeParse({
    familyId: formData.get("familyId"),
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName"),
    lastName: formData.get("lastName"),
    preferredName: formData.get("preferredName"),
    dob: formData.get("dob"),
    gender: formData.get("gender"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    postcode: formData.get("postcode"),
    status: formData.get("status") || "ENQUIRY",
  });
}

export async function createStudent(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...STAFF_ROLES]);

  const parsed = parseStudentForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form for errors." };
  }
  const { familyId, dob, status, ...rest } = parsed.data;

  const family = await prisma.family.findUnique({ where: { id: familyId } });
  if (!family) return { error: "Select a valid family." };

  const student = await prisma.$transaction(async (tx) => {
    const { seq, code } = await nextStudentCode(tx);
    const student = await tx.student.create({
      data: {
        ...rest,
        familyId,
        dob: new Date(dob),
        status,
        studentSeq: seq,
        studentCode: code,
        dateEnrolled: status === "ACTIVE" ? new Date() : null,
      },
    });
    await logAudit(tx, {
      entityType: "Student",
      entityId: student.id,
      action: "created",
      newValue: { ...rest, familyId, dob, status, studentCode: code },
      userId: user.id,
    });
    return student;
  });

  revalidatePath("/students");
  revalidatePath(`/families/${familyId}`);
  redirect(`/students/${student.id}`);
}

export async function updateStudent(
  studentId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...STAFF_ROLES]);

  const parsed = parseStudentForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form for errors." };
  }
  const { familyId, dob, status, ...rest } = parsed.data;

  const before = await prisma.student.findUnique({ where: { id: studentId } });
  if (!before) return { error: "Student not found." };

  await prisma.$transaction(async (tx) => {
    const wasActive = before.status === "ACTIVE";
    await tx.student.update({
      where: { id: studentId },
      data: {
        ...rest,
        familyId,
        dob: new Date(dob),
        status,
        dateEnrolled:
          status === "ACTIVE" && !wasActive
            ? new Date()
            : before.dateEnrolled,
      },
    });
    await logAudit(tx, {
      entityType: "Student",
      entityId: studentId,
      action: "updated",
      previousValue: before,
      newValue: { ...rest, familyId, dob, status },
      userId: user.id,
    });
  });

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath(`/families/${familyId}`);
  if (before.familyId !== familyId) revalidatePath(`/families/${before.familyId}`);
  redirect(`/students/${studentId}`);
}
