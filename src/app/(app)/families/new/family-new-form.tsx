"use client";

import { useActionState } from "react";
import { createFamily } from "@/lib/actions/families";
import { Field, FormError } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function FamilyNewForm() {
  const [state, formAction, isPending] = useActionState(createFamily, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state?.error} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Family details</CardTitle>
          <CardDescription>
            The household this and future children will belong to.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Family name" htmlFor="surnameLabel" required>
              <Input
                id="surnameLabel"
                name="surnameLabel"
                placeholder="e.g. Khan Family"
                required
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Address line 1" htmlFor="addressLine1">
              <Input id="addressLine1" name="addressLine1" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Address line 2" htmlFor="addressLine2">
              <Input id="addressLine2" name="addressLine2" />
            </Field>
          </div>
          <Field label="City" htmlFor="city">
            <Input id="city" name="city" />
          </Field>
          <Field label="Postcode" htmlFor="postcode">
            <Input id="postcode" name="postcode" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Primary guardian</CardTitle>
          <CardDescription>
            The main contact for this family. More guardians can be added later.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="guardianName" required>
            <Input id="guardianName" name="guardianName" required />
          </Field>
          <Field label="Relationship" htmlFor="guardianRelationship" required>
            <Input
              id="guardianRelationship"
              name="guardianRelationship"
              placeholder="e.g. Father, Mother, Guardian"
              required
            />
          </Field>
          <Field label="Phone" htmlFor="guardianPhone">
            <Input id="guardianPhone" name="guardianPhone" type="tel" />
          </Field>
          <Field label="Secondary phone" htmlFor="guardianSecondaryPhone">
            <Input id="guardianSecondaryPhone" name="guardianSecondaryPhone" type="tel" />
          </Field>
          <Field label="Email" htmlFor="guardianEmail">
            <Input id="guardianEmail" name="guardianEmail" type="email" />
          </Field>
          <Field label="Preferred contact method" htmlFor="guardianPreferredContactMethod">
            <NativeSelect
              id="guardianPreferredContactMethod"
              name="guardianPreferredContactMethod"
              defaultValue="PHONE"
            >
              <option value="PHONE">Phone</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
            </NativeSelect>
          </Field>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox id="guardianIsEmergencyContact" name="guardianIsEmergencyContact" />
            <Label htmlFor="guardianIsEmergencyContact" className="font-normal">
              Also the emergency contact
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create family"}
        </Button>
      </div>
    </form>
  );
}
