"use client";

import { useId, useState } from "react";
import { useActionState } from "react";
import { assignFeePlan } from "@/lib/actions/student-fee-plan";
import { Field, FormError } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
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

type FeePlanOption = { id: string; name: string; amount: string };

export function AssignFeePlanDialog({
  studentId,
  feePlans,
  hasPlan,
}: {
  studentId: string;
  feePlans: FeePlanOption[];
  hasPlan: boolean;
}) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const action = assignFeePlan.bind(null, studentId);
  const [state, formAction, isPending] = useActionState(action, undefined);

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        {hasPlan ? "Change Fee Plan" : "Assign Fee Plan"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{hasPlan ? "Change Fee Plan" : "Assign Fee Plan"}</DialogTitle>
          <DialogDescription>
            Future invoices generated for this student will use this plan.
          </DialogDescription>
        </DialogHeader>
        <form id={formId} action={formAction} className="space-y-4">
          <FormError message={state?.error} />
          <Field label="Fee plan" htmlFor={`${formId}-feePlanId`} required>
            <NativeSelect id={`${formId}-feePlanId`} name="feePlanId" defaultValue="" required>
              <option value="" disabled>
                Select a fee plan…
              </option>
              {feePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} (£{plan.amount})
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Custom amount (£, optional)" htmlFor={`${formId}-customAmount`}>
            <Input
              id={`${formId}-customAmount`}
              name="customAmount"
              type="number"
              step="0.01"
              min={0}
              placeholder="Leave blank to use the plan's standard amount"
            />
          </Field>
        </form>
        <DialogFooter>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? "Saving…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
