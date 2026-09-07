import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, ClipboardCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { calculateAge } from "@/lib/age";
import { formatDays, formatTimeRange } from "@/lib/days";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OccupancyBadge } from "@/components/classes/occupancy-badge";
import { RemoveFromClassButton } from "@/components/classes/remove-from-class-button";

export default async function ClassProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const klass = await prisma.class.findUnique({
    where: { id },
    include: {
      primaryTeacher: true,
      assistants: { include: { teacher: true } },
      students: { orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
    },
  });

  if (!klass) notFound();

  return (
    <>
      <PageHeader
        title={klass.name}
        description={`${formatDays(klass.days)} · ${formatTimeRange(klass.startTime, klass.endTime)}${klass.room ? ` · ${klass.room}` : ""}`}
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href={`/attendance?classId=${klass.id}`} />}>
              <ClipboardCheck />
              Take Attendance
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href={`/classes/${klass.id}/edit`} />}>
              <Pencil />
              Edit
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Roster</CardTitle>
              <OccupancyBadge current={klass.students.length} capacity={klass.capacity} />
            </CardHeader>
            <CardContent className="space-y-1">
              {klass.students.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No students assigned to this class yet.
                </p>
              )}
              {klass.students.map((student) => (
                <div
                  key={student.id}
                  className="-mx-2 flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted"
                >
                  <Link href={`/students/${student.id}`} className="flex-1">
                    <span className="font-medium">
                      {student.preferredName || student.firstName} {student.lastName}
                    </span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {calculateAge(student.dob)} yrs · {student.studentCode}
                    </span>
                  </Link>
                  <RemoveFromClassButton studentId={student.id} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Class details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Primary teacher</p>
                <p className="font-medium">
                  {klass.primaryTeacher?.name ?? "Unassigned"}
                </p>
              </div>
              {klass.assistants.length > 0 && (
                <div>
                  <p className="text-muted-foreground">Assistant teachers</p>
                  <p className="font-medium">
                    {klass.assistants.map((a) => a.teacher.name).join(", ")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={klass.status === "ACTIVE" ? "secondary" : "outline"}>
                  {klass.status === "ACTIVE" ? "Active" : "Inactive"}
                </Badge>
              </div>
              {klass.notes && (
                <div>
                  <p className="text-muted-foreground">Notes</p>
                  <p className="whitespace-pre-wrap">{klass.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
