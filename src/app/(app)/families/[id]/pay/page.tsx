import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { PaymentForm } from "./payment-form";

export default async function RecordPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const family = await prisma.family.findUnique({ where: { id } });
  if (!family) notFound();

  const [invoices, methods] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        student: { familyId: id },
        status: { notIn: ["WAIVED", "CANCELLED", "PAID"] },
      },
      include: { student: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const invoiceRows = invoices.map((inv) => ({
    id: inv.id,
    studentName: `${inv.student.preferredName || inv.student.firstName} ${inv.student.lastName}`,
    periodLabel: inv.periodLabel,
    outstanding: Number(inv.amountDue) - Number(inv.amountPaid),
  }));
  const totalOutstanding = invoiceRows.reduce((sum, i) => sum + i.outstanding, 0);

  if (invoiceRows.length === 0) redirect(`/families/${id}`);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`Record Payment — ${family.surnameLabel}`}
        description="Payments are allocated automatically, oldest invoice first."
      />
      <PaymentForm
        familyId={id}
        invoices={invoiceRows}
        totalOutstanding={totalOutstanding}
        methods={methods}
      />
    </div>
  );
}
