"use client";

import { useActionState } from "react";
import type { Student } from "@prisma/client";
import { updateStudent } from "@/lib/actions/students";
import { Field, FormError } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FamilyOption = { id: string; surnameLabel: string };

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function StudentEditForm({
  student,
  families,
}: {
  student: Student;
  families: FamilyOption[];
}) {
  const action = updateStudent.bind(null, student.id);
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state?.error} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Family</CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Family" htmlFor="familyId" required>
            <NativeSelect
              id="familyId"
              name="familyId"
              defaultValue={student.familyId}
              required
            >
              {families.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.surnameLabel}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" required>
            <Input id="firstName" name="firstName" defaultValue={student.firstName} required />
          </Field>
          <Field label="Last name" htmlFor="lastName" required>
            <Input id="lastName" name="lastName" defaultValue={student.lastName} required />
          </Field>
          <Field label="Middle name" htmlFor="middleName">
            <Input id="middleName" name="middleName" defaultValue={student.middleName ?? ""} />
          </Field>
          <Field label="Preferred name" htmlFor="preferredName">
            <Input
              id="preferredName"
              name="preferredName"
              defaultValue={student.preferredName ?? ""}
            />
          </Field>
          <Field label="Date of birth" htmlFor="dob" required>
            <Input
              id="dob"
              name="dob"
              type="date"
              defaultValue={toDateInputValue(student.dob)}
              required
            />
          </Field>
          <Field label="Gender" htmlFor="gender" required>
            <NativeSelect id="gender" name="gender" defaultValue={student.gender} required>
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
              <Input
                id="addressLine1"
                name="addressLine1"
                defaultValue={student.addressLine1 ?? ""}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Address line 2" htmlFor="addressLine2">
              <Input
                id="addressLine2"
                name="addressLine2"
                defaultValue={student.addressLine2 ?? ""}
              />
            </Field>
          </div>
          <Field label="City" htmlFor="city">
            <Input id="city" name="city" defaultValue={student.city ?? ""} />
          </Field>
          <Field label="Postcode" htmlFor="postcode">
            <Input id="postcode" name="postcode" defaultValue={student.postcode ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Medical / learning information</CardTitle>
          <CardDescription>
            Allergies, conditions, medications, SEN/learning needs — anything
            staff should know.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="medicalInfo"
            name="medicalInfo"
            defaultValue={student.medicalInfo ?? ""}
            className="min-h-24"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
          <CardDescription>
            Suspending, marking a student as left, or transferring class have
            their own dedicated actions elsewhere and aren&apos;t set here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field label="Status" htmlFor="status" required>
            <NativeSelect id="status" name="status" defaultValue={student.status}>
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
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
