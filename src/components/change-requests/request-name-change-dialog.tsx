"use client";

import { useId, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { requestNameChange } from "@/lib/actions/change-requests";
import { Field, FormError } from "@/components/forms/field";
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

export function RequestNameChangeDialog({
  studentId,
  firstName,
  lastName,
}: {
  studentId: string;
  firstName: string;
  lastName: string;
}) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const action = requestNameChange.bind(null, studentId);
  const [state, formAction, isPending] = useActionState(action, undefined);

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) {
      setOpen(false);
      toast.success("Sent for admin approval.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Suggest name change" />}>
        <span className="text-xs">Aa</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suggest a name change</DialogTitle>
          <DialogDescription>
            An admin needs to approve this before it takes effect.
          </DialogDescription>
        </DialogHeader>
        <form id={formId} action={formAction} className="space-y-4">
          <FormError message={state?.error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor={`${formId}-firstName`} required>
              <Input id={`${formId}-firstName`} name="firstName" defaultValue={firstName} required />
            </Field>
            <Field label="Last name" htmlFor={`${formId}-lastName`} required>
              <Input id={`${formId}-lastName`} name="lastName" defaultValue={lastName} required />
            </Field>
          </div>
          <Field label="Note for the admin (optional)" htmlFor={`${formId}-note`}>
            <Textarea id={`${formId}-note`} name="note" className="min-h-16" />
          </Field>
        </form>
        <DialogFooter>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? "Sending…" : "Send for approval"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
