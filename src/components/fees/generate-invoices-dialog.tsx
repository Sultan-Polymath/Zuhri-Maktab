"use client";

import { useState } from "react";
import { useActionState } from "react";
import { FileText } from "lucide-react";
import { generateInvoices } from "@/lib/actions/invoices";
import { Field, FormError } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function currentMonthDefaults() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));
  const due = new Date(Date.UTC(year, month, 7));
  const label = start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const toInput = (d: Date) => d.toISOString().slice(0, 10);
  return {
    periodLabel: label,
    periodStart: toInput(start),
    periodEnd: toInput(end),
    dueDate: toInput(due),
  };
}

export function GenerateInvoicesDialog() {
  const [open, setOpen] = useState(false);
  const defaults = currentMonthDefaults();
  const [state, formAction, isPending] = useActionState(generateInvoices, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <FileText />
        Generate Invoices
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Invoices</DialogTitle>
          <DialogDescription>
            Creates an invoice for every active student with a fee plan
            assigned, for the period below. Students who already have an
            invoice for this exact period are skipped.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <FormError message={state?.error} />
          {state && !state.error && (
            <p className="rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
              Created {state.created} invoice{state.created === 1 ? "" : "s"}
              {state.skipped ? ` (${state.skipped} already existed)` : ""}.
            </p>
          )}
          <Field label="Period label" htmlFor="periodLabel" required>
            <Input
              id="periodLabel"
              name="periodLabel"
              defaultValue={defaults.periodLabel}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Period start" htmlFor="periodStart" required>
              <Input
                id="periodStart"
                name="periodStart"
                type="date"
                defaultValue={defaults.periodStart}
                required
              />
            </Field>
            <Field label="Period end" htmlFor="periodEnd" required>
              <Input
                id="periodEnd"
                name="periodEnd"
                type="date"
                defaultValue={defaults.periodEnd}
                required
              />
            </Field>
          </div>
          <Field label="Due date" htmlFor="dueDate" required>
            <Input id="dueDate" name="dueDate" type="date" defaultValue={defaults.dueDate} required />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Generating…" : "Generate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
