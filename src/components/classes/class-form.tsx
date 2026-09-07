"use client";

import { useActionState } from "react";
import type { Class } from "@prisma/client";
import { createClass, updateClass } from "@/lib/actions/classes";
import { dayOptions } from "@/lib/validation/class";
import { DAY_LABELS } from "@/lib/days";
import { Field, FormError } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type TeacherOption = { id: string; name: string };

export function ClassForm({
  klass,
  teachers,
}: {
  klass?: Class;
  teachers: TeacherOption[];
}) {
  const action = klass ? updateClass.bind(null, klass.id) : createClass;
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state?.error} />
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <Field label="Class name" htmlFor="name" required>
            <Input id="name" name="name" defaultValue={klass?.name} placeholder="e.g. Year 4 Boys" required />
          </Field>
          <Field label="Year / group" htmlFor="yearGroup">
            <Input id="yearGroup" name="yearGroup" defaultValue={klass?.yearGroup ?? ""} />
          </Field>
          <Field label="Primary teacher" htmlFor="primaryTeacherId">
            <NativeSelect
              id="primaryTeacherId"
              name="primaryTeacherId"
              defaultValue={klass?.primaryTeacherId ?? ""}
            >
              <option value="">Unassigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Room" htmlFor="room">
            <Input id="room" name="room" defaultValue={klass?.room ?? ""} />
          </Field>
          <Field label="Start time" htmlFor="startTime" required>
            <Input
              id="startTime"
              name="startTime"
              type="time"
              defaultValue={klass?.startTime ?? "17:00"}
              required
            />
          </Field>
          <Field label="End time" htmlFor="endTime" required>
            <Input
              id="endTime"
              name="endTime"
              type="time"
              defaultValue={klass?.endTime ?? "18:00"}
              required
            />
          </Field>
          <Field label="Capacity" htmlFor="capacity" required>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              defaultValue={klass?.capacity ?? 20}
              required
            />
          </Field>
          <Field label="Status" htmlFor="status">
            <NativeSelect id="status" name="status" defaultValue={klass?.status ?? "ACTIVE"}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </NativeSelect>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Days" htmlFor="days">
              <div className="flex flex-wrap gap-4">
                {dayOptions.map((day) => (
                  <div key={day} className="flex items-center gap-2">
                    <Checkbox
                      id={`day-${day}`}
                      name="days"
                      value={day}
                      defaultChecked={klass?.days.includes(day)}
                    />
                    <Label htmlFor={`day-${day}`} className="font-normal">
                      {DAY_LABELS[day]}
                    </Label>
                  </div>
                ))}
              </div>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Notes" htmlFor="notes">
              <Textarea id="notes" name="notes" defaultValue={klass?.notes ?? ""} />
            </Field>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : klass ? "Save changes" : "Create class"}
        </Button>
      </div>
    </form>
  );
}
