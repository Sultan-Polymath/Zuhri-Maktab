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

type FeePlanOption = {
  id: string;
  name: string;
  amount: string;
  frequency: "MONTHLY" | "TERMLY" | "ANNUAL" | "CUSTOM";
};

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function defaultsFor(frequency: FeePlanOption["frequency"]) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  if (frequency === "MONTHLY") {
    return {
      periodLabel: now.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      periodStart: toIso(new Date(Date.UTC(y, m, 1))),
      periodEnd: toIso(new Date(Date.UTC(y, m + 1, 0))),
      dueDate: toIso(new Date(Date.UTC(y, m, 7))),
    };
  }
  if (frequency === "TERMLY") {
    return {
      periodLabel: "",
      periodStart: toIso(new Date(Date.UTC(y, m, d))),
      periodEnd: toIso(new Date(Date.UTC(y, m + 3, d))),
      dueDate: toIso(new Date(Date.UTC(y, m, d + 14))),
    };
  }
  if (frequency === "ANNUAL") {
    return {
      periodLabel: "",
      periodStart: toIso(new Date(Date.UTC(y, m, d))),
      periodEnd: toIso(new Date(Date.UTC(y + 1, m, d))),
      dueDate: toIso(new Date(Date.UTC(y, m, d + 14))),
    };
  }
  return {
    periodLabel: "",
    periodStart: toIso(new Date(Date.UTC(y, m, d))),
    periodEnd: toIso(new Date(Date.UTC(y, m + 1, d))),
    dueDate: toIso(new Date(Date.UTC(y, m, d + 7))),
  };
}

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

  const [periodLabel, setPeriodLabel] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [dueDate, setDueDate] = useState("");

  function handlePlanChange(planId: string) {
    const plan = feePlans.find((p) => p.id === planId);
    if (!plan) return;
    const d = defaultsFor(plan.frequency);
    setPeriodLabel(d.periodLabel);
    setPeriodStart(d.periodStart);
    setPeriodEnd(d.periodEnd);
    setDueDate(d.dueDate);
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
            This creates the first invoice too, so the balance owed and due
            date show up immediately.
          </DialogDescription>
        </DialogHeader>
        <form id={formId} action={formAction} className="space-y-4">
          <FormError message={state?.error} />
          <Field label="Fee plan" htmlFor={`${formId}-feePlanId`} required>
            <NativeSelect
              id={`${formId}-feePlanId`}
              name="feePlanId"
              defaultValue=""
              required
              onChange={(e) => handlePlanChange(e.target.value)}
            >
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

          <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-medium">First invoice</p>
            <Field label="Period label" htmlFor={`${formId}-periodLabel`} required>
              <Input
                id={`${formId}-periodLabel`}
                name="periodLabel"
                placeholder="e.g. September 2026 or Term 1 2026"
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Period start" htmlFor={`${formId}-periodStart`} required>
                <Input
                  id={`${formId}-periodStart`}
                  name="periodStart"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  required
                />
              </Field>
              <Field label="Period end" htmlFor={`${formId}-periodEnd`} required>
                <Input
                  id={`${formId}-periodEnd`}
                  name="periodEnd"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  required
                />
              </Field>
            </div>
            <Field label="Due date" htmlFor={`${formId}-dueDate`} required>
              <Input
                id={`${formId}-dueDate`}
                name="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </Field>
          </div>
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
