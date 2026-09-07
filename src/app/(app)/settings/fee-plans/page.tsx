import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { feeFrequencyOptions } from "@/lib/validation/fee-plan";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FeePlanDialog } from "@/components/fees/fee-plan-dialog";

const FREQUENCY_LABELS: Record<(typeof feeFrequencyOptions)[number], string> = {
  MONTHLY: "Monthly",
  TERMLY: "Termly",
  ANNUAL: "Annual",
  CUSTOM: "Custom",
};

export default async function FeePlansPage() {
  const session = await auth();
  if (!["SUPER_ADMIN", "ADMIN", "FINANCE"].includes(session?.user?.role ?? "")) {
    redirect("/settings");
  }

  const plans = await prisma.feePlan.findMany({
    include: { _count: { select: { studentPlans: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Fee Plans"
        description="Templates that can be assigned to students."
        actions={<FeePlanDialog />}
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No fee plans yet.
                  </TableCell>
                </TableRow>
              )}
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{formatMoney(plan.amount)}</TableCell>
                  <TableCell>{FREQUENCY_LABELS[plan.frequency]}</TableCell>
                  <TableCell>{plan._count.studentPlans}</TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? "secondary" : "outline"}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <FeePlanDialog
                      plan={{
                        id: plan.id,
                        name: plan.name,
                        amount: Number(plan.amount),
                        frequency: plan.frequency,
                        isActive: plan.isActive,
                        notes: plan.notes,
                      }}
                    />
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
