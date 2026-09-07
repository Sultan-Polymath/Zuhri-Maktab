import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { InvoiceStatusBadge } from "@/components/fees/invoice-status-badge";
import { GenerateInvoicesDialog } from "@/components/fees/generate-invoices-dialog";
import { RecordPaymentJump } from "@/components/fees/record-payment-jump";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PoundSterling, TrendingUp, TriangleAlert, CircleCheck } from "lucide-react";
import { isOverdue, daysOverdue } from "@/lib/invoice-overdue";

export default async function FeesPage() {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));

  const [monthInvoices, statusCounts, outstandingInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: { periodStart: { gte: monthStart }, periodEnd: { lte: monthEnd } },
    }),
    prisma.invoice.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.invoice.findMany({
      where: { status: { in: ["PENDING", "PARTIALLY_PAID"] } },
      include: { student: { include: { family: true } } },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const expected = monthInvoices.reduce((sum, inv) => sum + Number(inv.amountDue), 0);
  const collected = monthInvoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);
  const outstanding = Math.max(0, expected - collected);
  const collectionRate = expected > 0 ? Math.round((collected / expected) * 100) : null;

  const countFor = (status: string) =>
    statusCounts.find((s) => s.status === status)?._count._all ?? 0;
  const overdueCount = outstandingInvoices.filter((inv) => isOverdue(inv.dueDate, now)).length;

  const families = await prisma.family.findMany({
    select: { id: true, surnameLabel: true },
    orderBy: { surnameLabel: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Fees & Finance"
        description={`Overview for ${now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}.`}
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/fees/payments" />}>
              View Payments
            </Button>
            <RecordPaymentJump families={families} />
            <GenerateInvoicesDialog />
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Expected this month"
          value={formatMoney(expected)}
          icon={PoundSterling}
        />
        <StatCard
          label="Collected this month"
          value={formatMoney(collected)}
          sublabel={collectionRate === null ? undefined : `${collectionRate}% collection rate`}
          icon={CircleCheck}
          href="/fees/payments"
        />
        <StatCard
          label="Outstanding this month"
          value={formatMoney(outstanding)}
          icon={TrendingUp}
        />
        <StatCard
          label="Overdue invoices"
          value={overdueCount}
          sublabel={`${countFor("PAID")} fully paid · ${countFor("PARTIALLY_PAID")} partial`}
          icon={TriangleAlert}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Family</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Due</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Days Overdue</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outstandingInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    No outstanding fees.
                  </TableCell>
                </TableRow>
              )}
              {outstandingInvoices.map((invoice) => {
                const outstandingAmount = Number(invoice.amountDue) - Number(invoice.amountPaid);
                const overdue = daysOverdue(invoice.dueDate);
                return (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/students/${invoice.student.id}`}
                        className="font-medium hover:underline"
                      >
                        {invoice.student.preferredName || invoice.student.firstName}{" "}
                        {invoice.student.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/families/${invoice.student.familyId}`}
                        className="text-muted-foreground hover:underline"
                      >
                        {invoice.student.family.surnameLabel}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.periodLabel}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(invoice.amountDue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(invoice.amountPaid)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(outstandingAmount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {overdue > 0 ? `${overdue} days` : "—"}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.status} dueDate={invoice.dueDate} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
