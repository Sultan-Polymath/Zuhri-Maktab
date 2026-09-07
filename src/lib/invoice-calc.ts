import { Prisma } from "@prisma/client";
import type { InvoiceStatus } from "@prisma/client";

/**
 * Recomputes one invoice's adjustmentTotal, amountDue and status from
 * scratch: the sum of (a) any recurring adjustments that apply to this
 * student/family during the invoice's period, and (b) any one-off
 * adjustments linked directly to this invoice. Called after an invoice is
 * created, whenever an adjustment affecting it is added, and whenever a
 * payment is (de)allocated against it.
 *
 * Invoices already WAIVED or CANCELLED are left alone — those are explicit
 * manual states, not something a recalculation should overwrite.
 */
export async function recalcInvoice(tx: Prisma.TransactionClient, invoiceId: string) {
  const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (invoice.status === "WAIVED" || invoice.status === "CANCELLED") return;

  const student = await tx.student.findUniqueOrThrow({
    where: { id: invoice.studentId },
    select: { familyId: true },
  });

  const applicable = await tx.adjustment.findMany({
    where: {
      OR: [
        { invoiceId: invoice.id },
        {
          isRecurring: true,
          scope: "STUDENT",
          studentId: invoice.studentId,
          effectiveFrom: { lte: invoice.periodEnd },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: invoice.periodStart } }],
        },
        {
          isRecurring: true,
          scope: "FAMILY",
          familyId: student.familyId,
          effectiveFrom: { lte: invoice.periodEnd },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: invoice.periodStart } }],
        },
      ],
    },
  });

  let adjustmentTotal = new Prisma.Decimal(0);
  for (const adj of applicable) {
    if (adj.amount) {
      adjustmentTotal = adjustmentTotal.plus(adj.amount);
    } else if (adj.percent) {
      adjustmentTotal = adjustmentTotal.plus(
        new Prisma.Decimal(invoice.grossAmount).times(adj.percent).dividedBy(100),
      );
    }
  }

  const rawAmountDue = new Prisma.Decimal(invoice.grossAmount).minus(adjustmentTotal);
  const amountDue = rawAmountDue.lessThan(0) ? new Prisma.Decimal(0) : rawAmountDue;
  const amountPaid = new Prisma.Decimal(invoice.amountPaid);

  let status: InvoiceStatus;
  if (amountDue.equals(0) || amountPaid.greaterThanOrEqualTo(amountDue)) {
    status = "PAID";
  } else if (amountPaid.greaterThan(0)) {
    status = "PARTIALLY_PAID";
  } else {
    status = "PENDING";
  }

  await tx.invoice.update({
    where: { id: invoice.id },
    data: { adjustmentTotal, amountDue, status },
  });
}
