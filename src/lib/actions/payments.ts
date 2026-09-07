"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { recalcInvoice } from "@/lib/invoice-calc";
import { requireUser } from "./require-user";

export type ActionState = { error?: string } | undefined;

const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE"] as const;

export async function recordPayment(
  familyId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...FINANCE_ROLES]);

  const amountRaw = Number(formData.get("amount"));
  const dateRaw = String(formData.get("date") ?? "");
  const paymentMethodId = String(formData.get("paymentMethodId") ?? "");
  const reference = String(formData.get("reference") ?? "").trim() || undefined;
  const note = String(formData.get("note") ?? "").trim() || undefined;

  if (!amountRaw || amountRaw <= 0) return { error: "Enter a payment amount greater than 0." };
  if (!dateRaw || Number.isNaN(Date.parse(dateRaw))) return { error: "Select a valid date." };
  if (!paymentMethodId) return { error: "Select a payment method." };

  const outstandingInvoices = await prisma.invoice.findMany({
    where: {
      student: { familyId },
      status: { notIn: ["WAIVED", "CANCELLED", "PAID"] },
    },
    orderBy: { dueDate: "asc" },
  });

  const totalOutstanding = outstandingInvoices.reduce(
    (sum, inv) => sum.plus(new Prisma.Decimal(inv.amountDue).minus(inv.amountPaid)),
    new Prisma.Decimal(0),
  );

  const amount = new Prisma.Decimal(amountRaw.toFixed(2));
  if (amount.greaterThan(totalOutstanding)) {
    return {
      error: `This family only has £${totalOutstanding.toFixed(2)} outstanding — enter that amount or less.`,
    };
  }

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        familyId,
        amount,
        date: new Date(dateRaw),
        paymentMethodId,
        reference,
        note,
        recordedByUserId: user.id,
      },
    });

    let remaining = amount;
    for (const invoice of outstandingInvoices) {
      if (remaining.lessThanOrEqualTo(0)) break;
      const invoiceOutstanding = new Prisma.Decimal(invoice.amountDue).minus(invoice.amountPaid);
      if (invoiceOutstanding.lessThanOrEqualTo(0)) continue;

      const allocated = Prisma.Decimal.min(remaining, invoiceOutstanding);
      await tx.paymentAllocation.create({
        data: { paymentId: payment.id, invoiceId: invoice.id, amountAllocated: allocated },
      });
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { amountPaid: new Prisma.Decimal(invoice.amountPaid).plus(allocated) },
      });
      await recalcInvoice(tx, invoice.id);

      remaining = remaining.minus(allocated);
    }

    await logAudit(tx, {
      entityType: "Payment",
      entityId: payment.id,
      action: "recorded",
      newValue: { familyId, amount: amount.toString(), paymentMethodId, reference },
      userId: user.id,
    });
  });

  revalidatePath("/fees");
  revalidatePath(`/families/${familyId}`);
  redirect(`/families/${familyId}`);
}
