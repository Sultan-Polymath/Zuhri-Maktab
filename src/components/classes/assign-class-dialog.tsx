"use client";

import { useId, useState } from "react";
import { useActionState } from "react";
import { assignStudentToClass } from "@/lib/actions/class-transfer";
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

type ClassOption = {
  id: string;
  name: string;
  studentCount: number;
  capacity: number;
};

export function AssignClassDialog({
  studentId,
  currentClassId,
  classes,
  hasClass,
}: {
  studentId: string;
  currentClassId?: string | null;
  classes: ClassOption[];
  hasClass: boolean;
}) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const action = assignStudentToClass.bind(null, studentId);
  const [state, formAction, isPending] = useActionState(action, undefined);

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        {hasClass ? "Change Class" : "Assign to Class"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{hasClass ? "Change Class" : "Assign to Class"}</DialogTitle>
          <DialogDescription>
            This is recorded in the student&apos;s class transfer history.
          </DialogDescription>
        </DialogHeader>
        <form id={formId} action={formAction} className="space-y-4">
          <FormError message={state?.error} />
          <Field label="Class" htmlFor={`${formId}-toClassId`} required>
            <NativeSelect id={`${formId}-toClassId`} name="toClassId" defaultValue="" required>
              <option value="" disabled>
                Select a class…
              </option>
              {classes.map((klass) => (
                <option
                  key={klass.id}
                  value={klass.id}
                  disabled={klass.id !== currentClassId && klass.studentCount >= klass.capacity}
                >
                  {klass.name} ({klass.studentCount}/{klass.capacity}
                  {klass.studentCount >= klass.capacity ? " — full" : ""})
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Reason (optional)" htmlFor={`${formId}-reason`}>
            <Textarea id={`${formId}-reason`} name="reason" className="min-h-16" />
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
