import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { calculateAge } from "@/lib/age";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotesPanel } from "@/components/notes/notes-panel";
import { AssignClassDialog } from "@/components/classes/assign-class-dialog";

const STATUS_LABELS: Record<string, string> = {
  ENQUIRY: "Enquiry",
  APPLICATION: "Application",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  LEFT: "Left",
  TRANSFERRED: "Transferred",
  WAITING_LIST: "Waiting List",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [student, classes] = await Promise.all([
    prisma.student.findUnique({
      where: { id },
      include: {
        family: { include: { guardians: true } },
        currentClass: { include: { primaryTeacher: true } },
        classTransfers: {
          include: { fromClass: true, toClass: true, changedBy: true },
          orderBy: { transferDate: "desc" },
        },
      },
    }),
    prisma.class.findMany({
      where: { status: "ACTIVE" },
      include: { _count: { select: { students: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!student) notFound();

  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: { studentId: student.id },
    include: { session: true },
    orderBy: { session: { date: "desc" } },
    take: 10,
  });
  const allAttendanceStatuses = await prisma.attendanceRecord.findMany({
    where: { studentId: student.id },
    select: { status: true },
  });
  const attendedCount = allAttendanceStatuses.filter(
    (r) => r.status === "PRESENT" || r.status === "LATE",
  ).length;
  const attendancePercent =
    allAttendanceStatuses.length > 0
      ? Math.round((attendedCount / allAttendanceStatuses.length) * 100)
      : null;

  const classOptions = classes.map((klass) => ({
    id: klass.id,
    name: klass.name,
    studentCount: klass._count.students,
    capacity: klass.capacity,
  }));

  const displayName = `${student.preferredName || student.firstName} ${student.lastName}`;
  const primaryGuardian =
    student.family.guardians.find((g) => g.isPrimaryContact) ??
    student.family.guardians[0];
  const address = [
    student.addressLine1 ?? student.family.addressLine1,
    student.addressLine2 ?? student.family.addressLine2,
    student.city ?? student.family.city,
    student.postcode ?? student.family.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PageHeader
        title={displayName}
        description={`${student.studentCode} · ${STATUS_LABELS[student.status]}`}
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href={`/students/${student.id}/edit`} />}>
            <Pencil />
            Edit
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Full name</p>
                <p className="font-medium">
                  {[student.firstName, student.middleName, student.lastName]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Preferred name</p>
                <p className="font-medium">{student.preferredName || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date of birth</p>
                <p className="font-medium">
                  {formatDate(student.dob)} ({calculateAge(student.dob)} years old)
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Gender</p>
                <p className="font-medium">
                  {student.gender === "MALE" ? "Male" : "Female"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Address</p>
                <p className="font-medium">{address || "No address on file"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date enrolled</p>
                <p className="font-medium">
                  {student.dateEnrolled ? formatDate(student.dateEnrolled) : "—"}
                </p>
              </div>
              {student.status === "LEFT" && (
                <div>
                  <p className="text-muted-foreground">Leaving date</p>
                  <p className="font-medium">
                    {student.leavingDate ? formatDate(student.leavingDate) : "—"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Class</CardTitle>
              <AssignClassDialog
                studentId={student.id}
                currentClassId={student.currentClassId}
                classes={classOptions}
                hasClass={!!student.currentClass}
              />
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {student.currentClass ? (
                <p>
                  <Link
                    href={`/classes/${student.currentClass.id}`}
                    className="font-medium hover:underline"
                  >
                    {student.currentClass.name}
                  </Link>
                  {student.currentClass.primaryTeacher && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {student.currentClass.primaryTeacher.name}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-muted-foreground">Not assigned to a class yet.</p>
              )}

              {student.classTransfers.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Transfer history
                  </p>
                  {student.classTransfers.map((transfer) => (
                    <div key={transfer.id} className="text-xs text-muted-foreground">
                      {formatDate(transfer.transferDate)}:{" "}
                      {transfer.fromClass ? transfer.fromClass.name : "(none)"} →{" "}
                      {transfer.toClass.name}
                      {transfer.reason && ` — ${transfer.reason}`}
                      {" · "}
                      {transfer.changedBy.name}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quran Progress</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Progress tracking will appear here once the Progress module is
              built.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fees</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Fee plan, invoices and payment history will appear here once
              the Fees & Finance module is built.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <NotesPanel
                entityType="STUDENT"
                entityId={student.id}
                path={`/students/${student.id}`}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Family</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Link
                href={`/families/${student.familyId}`}
                className="font-medium hover:underline"
              >
                {student.family.surnameLabel}
              </Link>
              {primaryGuardian && (
                <div className="space-y-0.5 text-muted-foreground">
                  <p>{primaryGuardian.name} ({primaryGuardian.relationship})</p>
                  {primaryGuardian.phone && <p>{primaryGuardian.phone}</p>}
                  {primaryGuardian.email && <p>{primaryGuardian.email}</p>}
                </div>
              )}
              <p className="text-muted-foreground">
                {student.family.guardians.length} guardian
                {student.family.guardians.length === 1 ? "" : "s"} on file
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {attendancePercent === null ? (
                <p className="text-muted-foreground">No attendance recorded yet.</p>
              ) : (
                <>
                  <p>
                    <span className="text-2xl font-semibold">{attendancePercent}%</span>
                    <span className="ml-1 text-muted-foreground">attendance</span>
                  </p>
                  <div className="space-y-1">
                    {attendanceRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between text-xs text-muted-foreground"
                      >
                        <span>{formatDate(record.session.date)}</span>
                        <Badge variant="outline" className="text-xs">
                          {record.status.charAt(0) + record.status.slice(1).toLowerCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
