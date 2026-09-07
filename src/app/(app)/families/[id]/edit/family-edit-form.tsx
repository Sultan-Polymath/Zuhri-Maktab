"use client";

import { useActionState } from "react";
import type { Family } from "@prisma/client";
import { updateFamily } from "@/lib/actions/families";
import { Field, FormError } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FamilyEditForm({ family }: { family: Family }) {
  const action = updateFamily.bind(null, family.id);
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state?.error} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Family details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Family name" htmlFor="surnameLabel" required>
              <Input
                id="surnameLabel"
                name="surnameLabel"
                defaultValue={family.surnameLabel}
                required
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Address line 1" htmlFor="addressLine1">
              <Input
                id="addressLine1"
                name="addressLine1"
                defaultValue={family.addressLine1 ?? ""}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Address line 2" htmlFor="addressLine2">
              <Input
                id="addressLine2"
                name="addressLine2"
                defaultValue={family.addressLine2 ?? ""}
              />
            </Field>
          </div>
          <Field label="City" htmlFor="city">
            <Input id="city" name="city" defaultValue={family.city ?? ""} />
          </Field>
          <Field label="Postcode" htmlFor="postcode">
            <Input
              id="postcode"
              name="postcode"
              defaultValue={family.postcode ?? ""}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
