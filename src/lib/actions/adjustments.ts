"use server";

import { revalidatePath } from "next/cache";
import type { AdjustmentScope } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { recalcInvoice } from "@/lib/invoice-calc";
import { requireUser } from "./require-user";
import { adjustmentFormSchema } from "@/lib/validation/adjustment";

export type ActionState = { error?: string; success?: boolean } | undefined;

const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE"] as const;

function parseAdjustmentForm(formData: FormData) {
  return adjustmentFormSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount") || undefined,
    percent: formData.get("percent") || undefined,
    reason: formData.get("reason"),
    isRecurring: formData.get("isRecurring") === "on",
    effectiveFrom: formData.get("effectiveFrom"),
    effectiveTo: formData.get("effectiveTo"),
  });
}

export async function createStandingAdjustment(
  scope: AdjustmentScope,
  entityId: string,
  path: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...FINANCE_ROLES]);

  const parsed = parseAdjustmentForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { effectiveFrom, effectiveTo, ...rest } = parsed.data;

  const studentId = scope === "STUDENT" ? entityId : undefined;
  const familyId = scope === "FAMILY" ? entityId : undefined;

  await prisma.$transaction(async (tx) => {
    const adjustment = await tx.adjustment.create({
      data: {
        scope,
        studentId,
        familyId,
        ...rest,
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        createdByUserId: user.id,
      },
    });

    // Recalculate any existing invoices this standing adjustment now applies to.
    const affectedStudentIds =
      scope === "STUDENT"
        ? [entityId]
        : (
            await tx.student.findMany({
              where: { familyId: entityId },
              select: { id: true },
            })
          ).map((s) => s.id);

    const invoices = await tx.invoice.findMany({
      where: {
        studentId: { in: affectedStudentIds },
        status: { notIn: ["WAIVED", "CANCELLED"] },
        periodEnd: { gte: new Date(effectiveFrom) },
        ...(effectiveTo ? { periodStart: { lte: new Date(effectiveTo) } } : {}),
      },
      select: { id: true },
    });
    for (const invoice of invoices) {
      await recalcInvoice(tx, invoice.id);
    }

    await logAudit(tx, {
      entityType: scope === "STUDENT" ? "Student" : "Family",
      entityId,
      action: "adjustment_created",
      newValue: { adjustmentId: adjustment.id, ...parsed.data },
      userId: user.id,
    });
  });

  revalidatePath(path);
  return { success: true };
}

export async function createInvoiceAdjustment(
  invoiceId: string,
  path: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...FINANCE_ROLES]);

  const parsed = parseAdjustmentForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { effectiveFrom, effectiveTo, ...rest } = parsed.data;

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { error: "Invoice not found." };

  await prisma.$transaction(async (tx) => {
    const adjustment = await tx.adjustment.create({
      data: {
        scope: "STUDENT",
        studentId: invoice.studentId,
        invoiceId,
        ...rest,
        isRecurring: false,
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        createdByUserId: user.id,
      },
    });
    await recalcInvoice(tx, invoiceId);
    await logAudit(tx, {
      entityType: "Invoice",
      entityId: invoiceId,
      action: "adjustment_created",
      newValue: { adjustmentId: adjustment.id, ...parsed.data },
      userId: user.id,
    });
  });

  revalidatePath(path);
  return { success: true };
}
