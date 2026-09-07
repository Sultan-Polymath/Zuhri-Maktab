"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireUser } from "./require-user";
import { classSchema } from "@/lib/validation/class";

export type ActionState = { error?: string } | undefined;

const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;

function parseClassForm(formData: FormData) {
  return classSchema.safeParse({
    name: formData.get("name"),
    yearGroup: formData.get("yearGroup"),
    primaryTeacherId: formData.get("primaryTeacherId"),
    days: formData.getAll("days"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    room: formData.get("room"),
    capacity: formData.get("capacity"),
    status: formData.get("status") || "ACTIVE",
    notes: formData.get("notes"),
  });
}

export async function createClass(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...STAFF_ROLES]);

  const parsed = parseClassForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const klass = await prisma.$transaction(async (tx) => {
    const klass = await tx.class.create({ data: parsed.data });
    await logAudit(tx, {
      entityType: "Class",
      entityId: klass.id,
      action: "created",
      newValue: parsed.data,
      userId: user.id,
    });
    return klass;
  });

  revalidatePath("/classes");
  redirect(`/classes/${klass.id}`);
}

export async function updateClass(
  classId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...STAFF_ROLES]);

  const parsed = parseClassForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const before = await prisma.class.findUnique({ where: { id: classId } });
  if (!before) return { error: "Class not found." };

  await prisma.$transaction(async (tx) => {
    await tx.class.update({ where: { id: classId }, data: parsed.data });
    await logAudit(tx, {
      entityType: "Class",
      entityId: classId,
      action: "updated",
      previousValue: before,
      newValue: parsed.data,
      userId: user.id,
    });
  });

  revalidatePath("/classes");
  revalidatePath(`/classes/${classId}`);
  redirect(`/classes/${classId}`);
}
