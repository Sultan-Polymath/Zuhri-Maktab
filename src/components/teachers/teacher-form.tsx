"use client";

import { useActionState } from "react";
import type { Teacher } from "@prisma/client";
import { createTeacher, updateTeacher } from "@/lib/actions/teachers";
import { teacherRoleOptions } from "@/lib/validation/teacher";
import { Field, FormError } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ROLE_LABELS: Record<(typeof teacherRoleOptions)[number], string> = {
  TEACHER: "Teacher",
  ASSISTANT_TEACHER: "Assistant Teacher",
  HEAD_TEACHER: "Head Teacher",
  ADMINISTRATOR: "Administrator",
};

function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function TeacherForm({ teacher }: { teacher?: Teacher }) {
  const action = teacher ? updateTeacher.bind(null, teacher.id) : createTeacher;
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state?.error} />
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" required>
            <Input id="name" name="name" defaultValue={teacher?.name} required />
          </Field>
          <Field label="Role" htmlFor="role" required>
            <NativeSelect id="role" name="role" defaultValue={teacher?.role ?? "TEACHER"}>
              {teacherRoleOptions.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" type="tel" defaultValue={teacher?.phone ?? ""} />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" defaultValue={teacher?.email ?? ""} />
          </Field>
          <Field label="Start date" htmlFor="startDate">
            <Input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={toDateInputValue(teacher?.startDate ?? null)}
            />
          </Field>
          <Field label="Status" htmlFor="status">
            <NativeSelect id="status" name="status" defaultValue={teacher?.status ?? "ACTIVE"}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </NativeSelect>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes" htmlFor="notes">
              <Textarea id="notes" name="notes" defaultValue={teacher?.notes ?? ""} />
            </Field>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : teacher ? "Save changes" : "Add teacher"}
        </Button>
      </div>
    </form>
  );
}
