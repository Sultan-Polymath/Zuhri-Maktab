"use client";

import { useId, useState } from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import type { AdjustmentScope } from "@prisma/client";
import { createStandingAdjustment } from "@/lib/actions/adjustments";
import { adjustmentTypeOptions } from "@/lib/validation/adjustment";
import { Field, FormError } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

export function AdjustmentDialog({
  scope,
  entityId,
  path,
}: {
  scope: AdjustmentScope;
  entityId: string;
  path: string;
}) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const action = createStandingAdjustment.bind(null, scope, entityId, path);
  const [state, formAction, isPending] = useActionState(action, undefined);

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus />
        Add Adjustment
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Adjustment</DialogTitle>
          <DialogDescription>
            {scope === "FAMILY"
              ? "Applies to every child in this family's future invoices while active."
              : "Applies to this student's future invoices while active."}
          </DialogDescription>
        </DialogHeader>
        <form id={formId} action={formAction} className="space-y-4">
          <FormError message={state?.error} />
          <Field label="Type" htmlFor={`${formId}-type`} required>
            <NativeSelect id={`${formId}-type`} name="type" defaultValue="SIBLING_DISCOUNT">
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
          <div className="grid grid-cols-2 gap-4">
            <Field label="Effective from" htmlFor={`${formId}-effectiveFrom`} required>
              <Input
                id={`${formId}-effectiveFrom`}
                name="effectiveFrom"
                type="date"
                defaultValue={todayIsoDate()}
                required
              />
            </Field>
            <Field label="Effective to (optional)" htmlFor={`${formId}-effectiveTo`}>
              <Input id={`${formId}-effectiveTo`} name="effectiveTo" type="date" />
            </Field>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id={`${formId}-isRecurring`} name="isRecurring" defaultChecked />
            <Label htmlFor={`${formId}-isRecurring`} className="font-normal">
              Recurring — applies to every future invoice until the end date
            </Label>
          </div>
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
