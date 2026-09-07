"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createStudent } from "@/lib/actions/students";
import { Field, FormError } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FamilyOption = {
  id: string;
  surnameLabel: string;
  primaryGuardianName?: string;
};

export function StudentNewForm({
  families,
  defaultFamilyId,
}: {
  families: FamilyOption[];
  defaultFamilyId?: string;
}) {
  const [state, formAction, isPending] = useActionState(createStudent, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state?.error} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Family</CardTitle>
          <CardDescription>
            Which household this child belongs to.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Field label="Family" htmlFor="familyId" required>
            <NativeSelect
              id="familyId"
              name="familyId"
              defaultValue={defaultFamilyId ?? ""}
              required
            >
              <option value="" disabled>
                Select a family…
              </option>
              {families.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.surnameLabel}
                  {family.primaryGuardianName ? ` — ${family.primaryGuardianName}` : ""}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <p className="text-sm text-muted-foreground">
            Don&apos;t see the family?{" "}
            <Link href="/families/new" className="underline underline-offset-2">
              Create a new family first
            </Link>
            , then come back here.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" required>
            <Input id="firstName" name="firstName" required />
          </Field>
          <Field label="Last name" htmlFor="lastName" required>
            <Input id="lastName" name="lastName" required />
          </Field>
          <Field label="Middle name" htmlFor="middleName">
            <Input id="middleName" name="middleName" />
          </Field>
          <Field label="Preferred name" htmlFor="preferredName">
            <Input id="preferredName" name="preferredName" />
          </Field>
          <Field label="Date of birth" htmlFor="dob" required>
            <Input id="dob" name="dob" type="date" required />
          </Field>
          <Field label="Gender" htmlFor="gender" required>
            <NativeSelect id="gender" name="gender" defaultValue="" required>
              <option value="" disabled>
                Select…
              </option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </NativeSelect>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Address (optional)</CardTitle>
          <CardDescription>
            Only needed if different from the family address.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
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
          <CardTitle className="text-base">Status</CardTitle>
          <CardDescription>
            New enquiries usually start as Enquiry or Application. Class and
            fee assignment happen once the Classes module is set up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field label="Status" htmlFor="status" required>
            <NativeSelect id="status" name="status" defaultValue="ENQUIRY">
              <option value="ENQUIRY">Enquiry</option>
              <option value="APPLICATION">Application</option>
              <option value="WAITING_LIST">Waiting List</option>
              <option value="ACTIVE">Active</option>
            </NativeSelect>
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Add student"}
        </Button>
      </div>
    </form>
  );
}
