"use client";

import { useActionState } from "react";
import { calculateAge } from "@/lib/age";
import { saveAttendance } from "@/lib/actions/attendance";
import { StatusPicker } from "./status-picker";
import { FormError } from "@/components/forms/field";
import { Button } from "@/components/ui/button";

type StudentRow = {
  id: string;
  name: string;
  dob: Date;
  status: string;
};

export function AttendanceRosterForm({
  classId,
  date,
  students,
}: {
  classId: string;
  date: string;
  students: StudentRow[];
}) {
  const action = saveAttendance.bind(null, classId, date);
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state?.error} />
      {state?.success && (
        <p className="rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          Attendance saved.
        </p>
      )}
      <div className="divide-y rounded-lg border">
        {students.map((student) => (
          <div
            key={student.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <span className="font-medium">{student.name}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                {calculateAge(student.dob)} yrs
              </span>
            </div>
            <StatusPicker studentId={student.id} defaultValue={student.status} />
          </div>
        ))}
        {students.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No students assigned to this class yet.
          </p>
        )}
      </div>
      {students.length > 0 && (
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="h-11 w-full sm:h-8 sm:w-auto">
            {isPending ? "Saving…" : "Save attendance"}
          </Button>
        </div>
      )}
    </form>
  );
}
