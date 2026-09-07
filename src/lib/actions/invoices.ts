"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { recalcInvoice } from "@/lib/invoice-calc";
import { requireUser } from "./require-user";

export type GenerateInvoicesState =
  | { error?: string; created?: number; skipped?: number }
  | undefined;

const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE"] as const;

export async function generateInvoices(
  _prevState: GenerateInvoicesState,
  formData: FormData,
): Promise<GenerateInvoicesState> {
  const user = await requireUser([...FINANCE_ROLES]);

  const periodLabel = String(formData.get("periodLabel") ?? "").trim();
  const periodStartRaw = String(formData.get("periodStart") ?? "");
  const periodEndRaw = String(formData.get("periodEnd") ?? "");
  const dueDateRaw = String(formData.get("dueDate") ?? "");

  if (!periodLabel) return { error: "Enter a period label, e.g. September 2026." };
  if (!periodStartRaw || !periodEndRaw || !dueDateRaw) {
    return { error: "Fill in the period start, period end and due date." };
  }

  const periodStart = new Date(periodStartRaw);
  const periodEnd = new Date(periodEndRaw);
  const dueDate = new Date(dueDateRaw);
  if (periodEnd < periodStart) return { error: "Period end must be after period start." };

  const activeAssignments = await prisma.studentFeePlan.findMany({
    where: {
      endDate: null,
      startDate: { lte: periodEnd },
      student: { status: "ACTIVE" },
    },
    include: { feePlan: true },
  });

  const existing = await prisma.invoice.findMany({
    where: {
      periodStart,
      periodEnd,
      studentId: { in: activeAssignments.map((a) => a.studentId) },
    },
    select: { studentId: true },
  });
  const alreadyInvoiced = new Set(existing.map((e) => e.studentId));

  const toCreate = activeAssignments.filter((a) => !alreadyInvoiced.has(a.studentId));

  const createdIds = await prisma.$transaction(async (tx) => {
    const ids: string[] = [];
    for (const assignment of toCreate) {
      const grossAmount = assignment.customAmount ?? assignment.feePlan.amount;
      const invoice = await tx.invoice.create({
        data: {
          studentId: assignment.studentId,
          studentFeePlanId: assignment.id,
          periodLabel,
          periodStart,
          periodEnd,
          grossAmount,
          amountDue: grossAmount,
          dueDate,
        },
      });
      ids.push(invoice.id);
    }
    for (const id of ids) {
      await recalcInvoice(tx, id);
    }
    if (ids.length > 0) {
      await logAudit(tx, {
        entityType: "Invoice",
        entityId: "batch",
        action: "generated",
        newValue: { periodLabel, count: ids.length },
        userId: user.id,
      });
    }
    return ids;
  });

  revalidatePath("/fees");
  return { created: createdIds.length, skipped: alreadyInvoiced.size };
}
