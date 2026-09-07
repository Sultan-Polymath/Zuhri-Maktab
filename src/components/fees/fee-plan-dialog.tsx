"use client";

import { useId, useState } from "react";
import { useActionState } from "react";
import { Pencil, Plus } from "lucide-react";
import { createFeePlan, updateFeePlan } from "@/lib/actions/fee-plans";
import { feeFrequencyOptions } from "@/lib/validation/fee-plan";
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

const FREQUENCY_LABELS: Record<(typeof feeFrequencyOptions)[number], string> = {
  MONTHLY: "Monthly",
  TERMLY: "Termly",
  ANNUAL: "Annual",
  CUSTOM: "Custom",
};

type FeePlanPlain = {
  id: string;
  name: string;
  amount: number;
  frequency: (typeof feeFrequencyOptions)[number];
  isActive: boolean;
  notes: string | null;
};

export function FeePlanDialog({ plan }: { plan?: FeePlanPlain }) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const action = plan ? updateFeePlan.bind(null, plan.id) : createFeePlan;
  const [state, formAction, isPending] = useActionState(action, undefined);

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={plan ? <Button variant="ghost" size="icon-sm" /> : <Button size="sm" />}
      >
        {plan ? <Pencil /> : (
          <>
            <Plus /> Add Fee Plan
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Fee Plan" : "Add Fee Plan"}</DialogTitle>
          <DialogDescription>
            A reusable fee template that can be assigned to students.
          </DialogDescription>
        </DialogHeader>
        <form id={formId} action={formAction} className="space-y-4">
          <FormError message={state?.error} />
          <Field label="Name" htmlFor={`${formId}-name`} required>
            <Input
              id={`${formId}-name`}
              name="name"
              defaultValue={plan?.name}
              placeholder="e.g. Standard Monthly"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount (£)" htmlFor={`${formId}-amount`} required>
              <Input
                id={`${formId}-amount`}
                name="amount"
                type="number"
                step="0.01"
                min={0}
                defaultValue={plan ? Number(plan.amount) : undefined}
                required
              />
            </Field>
            <Field label="Frequency" htmlFor={`${formId}-frequency`} required>
              <NativeSelect
                id={`${formId}-frequency`}
                name="frequency"
                defaultValue={plan?.frequency ?? "MONTHLY"}
              >
                {feeFrequencyOptions.map((freq) => (
                  <option key={freq} value={freq}>
                    {FREQUENCY_LABELS[freq]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <Field label="Notes" htmlFor={`${formId}-notes`}>
            <Textarea id={`${formId}-notes`} name="notes" defaultValue={plan?.notes ?? ""} />
          </Field>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${formId}-isActive`}
              name="isActive"
              defaultChecked={plan?.isActive ?? true}
            />
            <Label htmlFor={`${formId}-isActive`} className="font-normal">
              Active (can be assigned to students)
            </Label>
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? "Saving…" : plan ? "Save changes" : "Add fee plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
