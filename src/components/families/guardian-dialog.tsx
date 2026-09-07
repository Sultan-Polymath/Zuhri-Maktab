"use client";

import { useId, useState } from "react";
import { useActionState } from "react";
import { Pencil, Plus } from "lucide-react";
import { addGuardian, updateGuardian } from "@/lib/actions/families";
import type { Guardian } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Field, FormError } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function GuardianDialog({
  familyId,
  guardian,
}: {
  familyId: string;
  guardian?: Guardian;
}) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const action = guardian
    ? updateGuardian.bind(null, guardian.id)
    : addGuardian.bind(null, familyId);
  const [state, formAction, isPending] = useActionState(action, undefined);

  // Close the dialog once the action reports success. Adjusting state
  // during render (rather than in a useEffect) avoids an extra commit.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          guardian ? (
            <Button variant="ghost" size="icon-sm" aria-label="Edit guardian" />
          ) : (
            <Button variant="outline" size="sm" />
          )
        }
      >
        {guardian ? <Pencil /> : (
          <>
            <Plus /> Add Guardian
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{guardian ? "Edit Guardian" : "Add Guardian"}</DialogTitle>
          <DialogDescription>
            Contact details for a parent or guardian in this family.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} action={formAction} className="space-y-4">
          <FormError message={state?.error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor={`${formId}-name`} required>
              <Input
                id={`${formId}-name`}
                name="guardianName"
                defaultValue={guardian?.name}
                required
              />
            </Field>
            <Field label="Relationship" htmlFor={`${formId}-relationship`} required>
              <Input
                id={`${formId}-relationship`}
                name="guardianRelationship"
                defaultValue={guardian?.relationship}
                placeholder="e.g. Father, Mother"
                required
              />
            </Field>
            <Field label="Phone" htmlFor={`${formId}-phone`}>
              <Input
                id={`${formId}-phone`}
                name="guardianPhone"
                type="tel"
                defaultValue={guardian?.phone ?? ""}
              />
            </Field>
            <Field label="Secondary phone" htmlFor={`${formId}-secondaryPhone`}>
              <Input
                id={`${formId}-secondaryPhone`}
                name="guardianSecondaryPhone"
                type="tel"
                defaultValue={guardian?.secondaryPhone ?? ""}
              />
            </Field>
            <Field label="Email" htmlFor={`${formId}-email`}>
              <Input
                id={`${formId}-email`}
                name="guardianEmail"
                type="email"
                defaultValue={guardian?.email ?? ""}
              />
            </Field>
            <Field
              label="Preferred contact"
              htmlFor={`${formId}-preferredContactMethod`}
            >
              <NativeSelect
                id={`${formId}-preferredContactMethod`}
                name="guardianPreferredContactMethod"
                defaultValue={guardian?.preferredContactMethod ?? "PHONE"}
              >
                <option value="PHONE">Phone</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </NativeSelect>
            </Field>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${formId}-isPrimaryContact`}
                name="guardianIsPrimaryContact"
                defaultChecked={guardian?.isPrimaryContact}
              />
              <Label htmlFor={`${formId}-isPrimaryContact`} className="font-normal">
                Primary contact for this family
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${formId}-isEmergencyContact`}
                name="guardianIsEmergencyContact"
                defaultChecked={guardian?.isEmergencyContact}
              />
              <Label htmlFor={`${formId}-isEmergencyContact`} className="font-normal">
                Emergency contact
              </Label>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? "Saving…" : guardian ? "Save changes" : "Add guardian"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
