"use client";

import { useId, useState } from "react";
import { useActionState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { rejectChangeRequest } from "@/lib/actions/change-requests";
import { Field, FormError } from "@/components/forms/field";
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

export function RejectDialog({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const action = rejectChangeRequest.bind(null, requestId);
  const [state, formAction, isPending] = useActionState(action, undefined);

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) {
      setOpen(false);
      toast.success("Rejected.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <X />
        Reject
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject this request?</DialogTitle>
          <DialogDescription>The teacher won&apos;t see this reason, but it's kept for your records.</DialogDescription>
        </DialogHeader>
        <form id={formId} action={formAction} className="space-y-4">
          <FormError message={state?.error} />
          <Field label="Reason (optional)" htmlFor={`${formId}-reviewNote`}>
            <Textarea id={`${formId}-reviewNote`} name="reviewNote" className="min-h-16" />
          </Field>
        </form>
        <DialogFooter>
          <Button type="submit" form={formId} variant="destructive" disabled={isPending}>
            {isPending ? "Rejecting…" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
