"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireUser } from "./require-user";

export type ActionState = { error?: string; success?: boolean } | undefined;

const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE"] as const;

export async function assignFeePlan(
  studentId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...FINANCE_ROLES]);

  const feePlanId = String(formData.get("feePlanId") ?? "");
  if (!feePlanId) return { error: "Select a fee plan." };

  const customAmountRaw = String(formData.get("customAmount") ?? "").trim();
  const customAmount = customAmountRaw ? Number(customAmountRaw) : undefined;
  if (customAmountRaw && (Number.isNaN(customAmount) || customAmount! <= 0)) {
    return { error: "Custom amount must be a positive number." };
  }

  const [student, feePlan] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId } }),
    prisma.feePlan.findUnique({ where: { id: feePlanId } }),
  ]);
  if (!student) return { error: "Student not found." };
  if (!feePlan) return { error: "Fee plan not found." };

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.$transaction(async (tx) => {
    const current = await tx.studentFeePlan.findFirst({
      where: { studentId, endDate: null },
    });
    if (current) {
      await tx.studentFeePlan.update({
        where: { id: current.id },
        data: { endDate: today },
      });
    }

    const assignment = await tx.studentFeePlan.create({
      data: { studentId, feePlanId, customAmount, startDate: today },
    });

    await logAudit(tx, {
      entityType: "Student",
      entityId: studentId,
      action: "fee_plan_assigned",
      previousValue: current ? { feePlanId: current.feePlanId } : undefined,
      newValue: { feePlanId, customAmount, assignmentId: assignment.id },
      userId: user.id,
    });
  });

  revalidatePath(`/students/${studentId}`);
  return { success: true };
}
