"use client";

import { useActionState } from "react";
import { recordPayment } from "@/lib/actions/payments";
import { formatMoney } from "@/lib/money";
import { Field, FormError } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type InvoiceRow = {
  id: string;
  studentName: string;
  periodLabel: string;
  outstanding: number;
};

type MethodOption = { id: string; name: string };

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentForm({
  familyId,
  invoices,
  totalOutstanding,
  methods,
}: {
  familyId: string;
  invoices: InvoiceRow[];
  totalOutstanding: number;
  methods: MethodOption[];
}) {
  const action = recordPayment.bind(null, familyId);
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outstanding invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.studentName}</TableCell>
                  <TableCell>{inv.periodLabel}</TableCell>
                  <TableCell className="text-right">
                    {formatMoney(inv.outstanding)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <form action={formAction} className="space-y-6">
        <FormError message={state?.error} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Record payment</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount (£)" htmlFor="amount" required>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min={0.01}
                max={totalOutstanding}
                defaultValue={totalOutstanding.toFixed(2)}
                required
              />
            </Field>
            <Field label="Date" htmlFor="date" required>
              <Input id="date" name="date" type="date" defaultValue={todayIsoDate()} required />
            </Field>
            <Field label="Payment method" htmlFor="paymentMethodId" required>
              <NativeSelect id="paymentMethodId" name="paymentMethodId" defaultValue="" required>
                <option value="" disabled>
                  Select…
                </option>
                {methods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Reference (optional)" htmlFor="reference">
              <Input id="reference" name="reference" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Note (optional)" htmlFor="note">
                <Input id="note" name="note" />
              </Field>
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          The payment is allocated automatically across outstanding invoices,
          oldest due date first.
        </p>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Record payment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
