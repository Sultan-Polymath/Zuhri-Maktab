"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { enrolFamily } from "@/lib/actions/enrol";
import { Field, FormError } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

type FeePlanOption = { id: string; name: string; amount: string };

function ChildFields({
  fieldKey,
  index,
  onRemove,
  removable,
}: {
  fieldKey: number;
  index: number;
  onRemove: () => void;
  removable: boolean;
}) {
  const p = `child_${fieldKey}_`;
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Child {index + 1}</h3>
        {removable && (
          <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
            <Trash2 />
          </Button>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor={`${p}firstName`} required>
          <Input id={`${p}firstName`} name={`${p}firstName`} required />
        </Field>
        <Field label="Last name" htmlFor={`${p}lastName`} required>
          <Input id={`${p}lastName`} name={`${p}lastName`} required />
        </Field>
        <Field label="Middle name" htmlFor={`${p}middleName`}>
          <Input id={`${p}middleName`} name={`${p}middleName`} />
        </Field>
        <Field label="Preferred name" htmlFor={`${p}preferredName`}>
          <Input id={`${p}preferredName`} name={`${p}preferredName`} />
        </Field>
        <Field label="Date of birth" htmlFor={`${p}dob`} required>
          <Input id={`${p}dob`} name={`${p}dob`} type="date" required />
        </Field>
        <Field label="Gender" htmlFor={`${p}gender`} required>
          <NativeSelect id={`${p}gender`} name={`${p}gender`} defaultValue="" required>
            <option value="" disabled>
              Select…
            </option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </NativeSelect>
        </Field>
        <Field label="Status" htmlFor={`${p}status`} required>
          <NativeSelect id={`${p}status`} name={`${p}status`} defaultValue="ENQUIRY">
            <option value="ENQUIRY">Enquiry</option>
            <option value="APPLICATION">Application</option>
            <option value="WAITING_LIST">Waiting List</option>
            <option value="ACTIVE">Active</option>
          </NativeSelect>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Medical / learning information (optional)" htmlFor={`${p}medicalInfo`}>
            <Textarea
              id={`${p}medicalInfo`}
              name={`${p}medicalInfo`}
              placeholder="Allergies, conditions, medications, SEN/learning needs…"
              className="min-h-16"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

export function EnrolmentForm({
  families,
  feePlans,
  defaultFamilyId,
}: {
  families: FamilyOption[];
  feePlans: FeePlanOption[];
  defaultFamilyId?: string;
}) {
  const [state, formAction, isPending] = useActionState(enrolFamily, undefined);
  const formId = useId();

  const [familyMode, setFamilyMode] = useState<"existing" | "new">(
    defaultFamilyId ? "existing" : "new",
  );
  const [childKeys, setChildKeys] = useState<number[]>([0]);
  const [nextKey, setNextKey] = useState(1);

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state?.error} />
      <input type="hidden" name="familyMode" value={familyMode} />
      <input type="hidden" name="childKeys" value={childKeys.join(",")} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Family</CardTitle>
          <CardDescription>
            Pick an existing household, or create a new one right here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="familyModeChoice"
                checked={familyMode === "existing"}
                onChange={() => setFamilyMode("existing")}
              />
              Existing family
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="familyModeChoice"
                checked={familyMode === "new"}
                onChange={() => setFamilyMode("new")}
              />
              New family
            </label>
          </div>

          {familyMode === "existing" ? (
            <Field label="Family" htmlFor={`${formId}-familyId`} required>
              <NativeSelect
                id={`${formId}-familyId`}
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
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
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
                <Field label="City" htmlFor="city">
                  <Input id="city" name="city" />
                </Field>
                <Field label="Postcode" htmlFor="postcode">
                  <Input id="postcode" name="postcode" />
                </Field>
              </div>

              <Separator />
              <p className="text-sm font-medium">Primary guardian</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="guardianName" required>
                  <Input id="guardianName" name="guardianName" required />
                </Field>
                <Field label="Relationship" htmlFor="guardianRelationship" required>
                  <Input
                    id="guardianRelationship"
                    name="guardianRelationship"
                    placeholder="e.g. Father, Mother"
                    required
                  />
                </Field>
                <Field label="Phone" htmlFor="guardianPhone">
                  <Input id="guardianPhone" name="guardianPhone" type="tel" />
                </Field>
                <Field label="Email" htmlFor="guardianEmail">
                  <Input id="guardianEmail" name="guardianEmail" type="email" />
                </Field>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="guardianIsEmergencyContact" name="guardianIsEmergencyContact" />
                <Label htmlFor="guardianIsEmergencyContact" className="font-normal">
                  Also the emergency contact
                </Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Children</CardTitle>
            <CardDescription>Add one child, or several siblings at once.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setChildKeys((keys) => [...keys, nextKey]);
              setNextKey((k) => k + 1);
            }}
          >
            <Plus />
            Add Another Child
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {childKeys.map((key, index) => (
            <ChildFields
              key={key}
              fieldKey={key}
              index={index}
              removable={childKeys.length > 1}
              onRemove={() => setChildKeys((keys) => keys.filter((k) => k !== key))}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fee plan (optional)</CardTitle>
          <CardDescription>
            Applied to every child added above. You can assign or change this
            later from each student&apos;s profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Fee plan" htmlFor="feePlanId">
            <NativeSelect id="feePlanId" name="feePlanId" defaultValue="">
              <option value="">No fee plan yet</option>
              {feePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} (£{plan.amount})
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Custom amount (£, optional)" htmlFor="customAmount">
            <Input id="customAmount" name="customAmount" type="number" step="0.01" min={0} />
          </Field>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Family-level sibling discounts can be added afterwards from the{" "}
        <Link href="/families" className="underline underline-offset-2">
          family&apos;s profile
        </Link>
        .
      </p>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : childKeys.length > 1 ? "Enrol Students" : "Enrol Student"}
        </Button>
      </div>
    </form>
  );
}
