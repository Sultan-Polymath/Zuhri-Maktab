"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { recalcInvoice } from "@/lib/invoice-calc";
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

  const periodLabel = String(formData.get("periodLabel") ?? "").trim();
  const periodStartRaw = String(formData.get("periodStart") ?? "");
  const periodEndRaw = String(formData.get("periodEnd") ?? "");
  const dueDateRaw = String(formData.get("dueDate") ?? "");
  if (!periodLabel || !periodStartRaw || !periodEndRaw || !dueDateRaw) {
    return { error: "Fill in the billing period and due date for the first invoice." };
  }
  const periodStart = new Date(periodStartRaw);
  const periodEnd = new Date(periodEndRaw);
  const dueDate = new Date(dueDateRaw);
  if (periodEnd < periodStart) return { error: "Period end must be after period start." };

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

    const existingInvoice = await tx.invoice.findUnique({
      where: { studentId_periodStart_periodEnd: { studentId, periodStart, periodEnd } },
    });
    if (!existingInvoice) {
      const grossAmount = customAmount ?? feePlan.amount;
      const invoice = await tx.invoice.create({
        data: {
          studentId,
          studentFeePlanId: assignment.id,
          periodLabel,
          periodStart,
          periodEnd,
          grossAmount,
          amountDue: grossAmount,
          dueDate,
        },
      });
      await recalcInvoice(tx, invoice.id);
    }

    await logAudit(tx, {
      entityType: "Student",
      entityId: studentId,
      action: "fee_plan_assigned",
      previousValue: current ? { feePlanId: current.feePlanId } : undefined,
      newValue: { feePlanId, customAmount, assignmentId: assignment.id, periodLabel },
      userId: user.id,
    });
  });

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/fees");
  return { success: true };
}
