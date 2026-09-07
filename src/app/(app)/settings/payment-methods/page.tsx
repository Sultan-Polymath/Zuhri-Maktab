import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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
import { AddPaymentMethodForm } from "./add-payment-method-form";
import { ToggleMethodActiveButton } from "./toggle-method-active-button";

export default async function PaymentMethodsPage() {
  const session = await auth();
  if (!["SUPER_ADMIN", "ADMIN", "FINANCE"].includes(session?.user?.role ?? "")) {
    redirect("/settings");
  }

  const methods = await prisma.paymentMethod.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Payment Methods"
        description="Ways a payment can be recorded (Cash, Bank Transfer, etc.)."
      />
      <div className="mb-6 max-w-md">
        <AddPaymentMethodForm />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell className="font-medium">{method.name}</TableCell>
                  <TableCell>
                    <Badge variant={method.isActive ? "secondary" : "outline"}>
                      {method.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ToggleMethodActiveButton
                      methodId={method.id}
                      isActive={method.isActive}
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
