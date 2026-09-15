"use client";

import { useId, useState } from "react";
import { useActionState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { requestClassTransfer } from "@/lib/actions/change-requests";
import { Field, FormError } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
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

export function RequestTransferDialog({
  studentId,
  currentClassId,
  classes,
}: {
  studentId: string;
  currentClassId: string;
  classes: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const action = requestClassTransfer.bind(null, studentId);
  const [state, formAction, isPending] = useActionState(action, undefined);

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) {
      setOpen(false);
      toast.success("Sent for admin approval.");
    }
  }

  const otherClasses = classes.filter((c) => c.id !== currentClassId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Request class transfer" />}>
        <ArrowRightLeft />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request class transfer</DialogTitle>
          <DialogDescription>
            An admin needs to approve this before the student actually moves.
          </DialogDescription>
        </DialogHeader>
        <form id={formId} action={formAction} className="space-y-4">
          <FormError message={state?.error} />
          <Field label="Move to" htmlFor={`${formId}-toClassId`} required>
            <NativeSelect id={`${formId}-toClassId`} name="toClassId" defaultValue="" required>
              <option value="" disabled>
                Select a class…
              </option>
              {otherClasses.map((klass) => (
                <option key={klass.id} value={klass.id}>
                  {klass.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Reason (optional)" htmlFor={`${formId}-note`}>
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
