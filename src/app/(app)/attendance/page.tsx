import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { NativeSelect } from "@/components/forms/native-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AttendanceRosterForm } from "@/components/attendance/attendance-roster-form";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; date?: string }>;
}) {
  const params = await searchParams;
  const date = params.date ?? todayIsoDate();
  const classId = params.classId;

  const classes = await prisma.class.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });

  let students: { id: string; name: string; dob: Date; status: string }[] = [];
  let selectedClassName: string | null = null;

  if (classId) {
    const klass = await prisma.class.findUnique({
      where: { id: classId },
      include: { students: { orderBy: [{ lastName: "asc" }, { firstName: "asc" }] } },
    });

    if (klass) {
      selectedClassName = klass.name;
      const sessionDate = new Date(`${date}T00:00:00.000Z`);
      const session = await prisma.attendanceSession.findUnique({
        where: { classId_date: { classId, date: sessionDate } },
        include: { records: true },
      });
      const statusByStudentId = new Map(
        session?.records.map((r) => [r.studentId, r.status]) ?? [],
      );

      students = klass.students.map((student) => ({
        id: student.id,
        name: `${student.preferredName || student.firstName} ${student.lastName}`,
        dob: student.dob,
        status: statusByStudentId.get(student.id) ?? "PRESENT",
      }));
    }
  }

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Select a class and date, then mark exceptions — everyone defaults to Present."
      />

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64">
          <label className="mb-2 block text-sm font-medium" htmlFor="classId">
            Class
          </label>
          <NativeSelect
            id="classId"
            name="classId"
            defaultValue={classId ?? ""}
            required
            className="h-11 sm:h-8"
          >
            <option value="" disabled>
              Select a class…
            </option>
            {classes.map((klass) => (
              <option key={klass.id} value={klass.id}>
                {klass.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="w-[calc(50%-0.375rem)] sm:w-44">
          <label className="mb-2 block text-sm font-medium" htmlFor="date">
            Date
          </label>
          <Input id="date" name="date" type="date" defaultValue={date} className="h-11 sm:h-8" />
        </div>
        <Button type="submit" variant="outline" className="h-11 sm:h-8">
          Go
        </Button>
      </form>

      {classId && selectedClassName && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-base font-semibold">
              {selectedClassName} —{" "}
              {new Intl.DateTimeFormat("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              }).format(new Date(`${date}T00:00:00.000Z`))}
            </h2>
            <AttendanceRosterForm classId={classId} date={date} students={students} />
          </CardContent>
        </Card>
      )}

      {classId && !selectedClassName && (
        <p className="text-sm text-muted-foreground">Class not found.</p>
      )}
    </>
  );
}
