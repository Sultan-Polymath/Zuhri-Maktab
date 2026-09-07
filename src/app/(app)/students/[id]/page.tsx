import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { calculateAge } from "@/lib/age";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotesPanel } from "@/components/notes/notes-panel";

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

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      family: { include: { guardians: true } },
      currentClass: { include: { primaryTeacher: true } },
    },
  });

  if (!student) notFound();

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
            <CardHeader>
              <CardTitle className="text-base">Class</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {student.currentClass
                ? `${student.currentClass.name}${
                    student.currentClass.primaryTeacher
                      ? ` · ${student.currentClass.primaryTeacher.name}`
                      : ""
                  }`
                : "Not assigned to a class yet — class assignment and transfer history will be available once the Classes module is built."}
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
            <CardContent className="text-sm text-muted-foreground">
              Attendance history will appear here once the Attendance module
              is built.
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
