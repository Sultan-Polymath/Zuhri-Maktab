"use client";

import { useId, useState } from "react";
import { useActionState } from "react";
import { Pencil } from "lucide-react";
import { createInvoiceAdjustment } from "@/lib/actions/adjustments";
import { adjustmentTypeOptions } from "@/lib/validation/adjustment";
import { Field, FormError } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const TYPE_LABELS: Record<(typeof adjustmentTypeOptions)[number], string> = {
  SIBLING_DISCOUNT: "Sibling discount",
  SCHOLARSHIP: "Scholarship",
  CONCESSION: "Concession",
  WAIVER: "Waiver",
  REFUND: "Refund",
  CREDIT: "Credit",
  MANUAL: "Manual adjustment",
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function InvoiceAdjustmentDialog({
  invoiceId,
  path,
}: {
  invoiceId: string;
  path: string;
}) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const action = createInvoiceAdjustment.bind(null, invoiceId, path);
  const [state, formAction, isPending] = useActionState(action, undefined);

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Adjust this invoice" />}>
        <Pencil />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust This Invoice</DialogTitle>
          <DialogDescription>
            A one-off correction — waiver, credit, or manual discount — applied only to this invoice.
          </DialogDescription>
        </DialogHeader>
        <form id={formId} action={formAction} className="space-y-4">
          <FormError message={state?.error} />
          <input type="hidden" name="effectiveFrom" value={todayIsoDate()} />
          <Field label="Type" htmlFor={`${formId}-type`} required>
            <NativeSelect id={`${formId}-type`} name="type" defaultValue="WAIVER">
              {adjustmentTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABELS[type]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Fixed amount (£)" htmlFor={`${formId}-amount`}>
              <Input id={`${formId}-amount`} name="amount" type="number" step="0.01" min={0} />
            </Field>
            <Field label="Or percentage (%)" htmlFor={`${formId}-percent`}>
              <Input id={`${formId}-percent`} name="percent" type="number" step="0.1" min={0} max={100} />
            </Field>
          </div>
          <Field label="Reason" htmlFor={`${formId}-reason`} required>
            <Textarea id={`${formId}-reason`} name="reason" required />
          </Field>
        </form>
        <DialogFooter>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? "Saving…" : "Add adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
