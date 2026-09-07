import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecordPaymentJump } from "@/components/fees/record-payment-jump";
import { Input } from "@/components/ui/input";
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
import { Banknote } from "lucide-react";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const defaultFrom = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const from = params.from ? new Date(params.from) : defaultFrom;
  const to = params.to ? new Date(params.to) : now;
  // Include the whole "to" day.
  const toEnd = new Date(to);
  toEnd.setUTCHours(23, 59, 59, 999);

  const [payments, families] = await Promise.all([
    prisma.payment.findMany({
      where: { date: { gte: from, lte: toEnd } },
      include: {
        family: true,
        paymentMethod: true,
        recordedBy: true,
        allocations: { include: { invoice: { include: { student: true } } } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.family.findMany({
      select: { id: true, surnameLabel: true },
      orderBy: { surnameLabel: "asc" },
    }),
  ]);

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <>
      <PageHeader
        title="Payments"
        description="Every payment recorded, with who it was for and how it was allocated."
        actions={<RecordPaymentJump families={families} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Collected in range"
          value={formatMoney(totalCollected)}
          sublabel={`${payments.length} payment${payments.length === 1 ? "" : "s"}`}
          icon={Banknote}
        />
      </div>

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="from">
            From
          </label>
          <Input id="from" name="from" type="date" defaultValue={isoDate(from)} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="to">
            To
          </label>
          <Input id="to" name="to" type="date" defaultValue={isoDate(to)} />
        </div>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Family</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Allocated to</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Recorded by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No payments in this range.
                  </TableCell>
                </TableRow>
              )}
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {new Intl.DateTimeFormat("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(payment.date)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/families/${payment.familyId}`}
                      className="font-medium hover:underline"
                    >
                      {payment.family.surnameLabel}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatMoney(payment.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.paymentMethod.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.allocations
                      .map(
                        (a) =>
                          `${a.invoice.student.preferredName || a.invoice.student.firstName} (${formatMoney(a.amountAllocated)})`,
                      )
                      .join(", ")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.reference ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.recordedBy.name}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
