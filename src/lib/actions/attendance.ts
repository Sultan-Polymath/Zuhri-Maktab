"use server";

import { revalidatePath } from "next/cache";
import type { AttendanceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "./require-user";

export type ActionState = { error?: string; success?: boolean } | undefined;

const ATTENDANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "TEACHER"] as const;
const VALID_STATUSES = new Set(["PRESENT", "ABSENT", "LATE", "EXCUSED"]);

export async function saveAttendance(
  classId: string,
  date: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...ATTENDANCE_ROLES]);

  if (!classId) return { error: "Select a class." };
  if (!date || Number.isNaN(Date.parse(date))) return { error: "Select a valid date." };

  const klass = await prisma.class.findUnique({
    where: { id: classId },
    include: { students: { select: { id: true } } },
  });
  if (!klass) return { error: "Class not found." };

  const records: { studentId: string; status: AttendanceStatus; note?: string }[] = [];
  for (const student of klass.students) {
    const status = formData.get(`status-${student.id}`);
    if (typeof status !== "string" || !VALID_STATUSES.has(status)) continue;
    const note = formData.get(`note-${student.id}`);
    records.push({
      studentId: student.id,
      status: status as AttendanceStatus,
      note: typeof note === "string" && note.trim() !== "" ? note.trim() : undefined,
    });
  }

  const sessionDate = new Date(`${date}T00:00:00.000Z`);

  await prisma.$transaction(async (tx) => {
    const session = await tx.attendanceSession.upsert({
      where: { classId_date: { classId, date: sessionDate } },
      update: { takenByUserId: user.id },
      create: { classId, date: sessionDate, takenByUserId: user.id },
    });

    await tx.attendanceRecord.deleteMany({ where: { sessionId: session.id } });
    if (records.length > 0) {
      await tx.attendanceRecord.createMany({
        data: records.map((r) => ({ ...r, sessionId: session.id })),
      });
    }
  });

  revalidatePath("/attendance");
  revalidatePath(`/classes/${classId}`);
  return { success: true };
}
