import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateAge } from "@/lib/age";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { DeleteStudentButton } from "@/components/students/delete-student-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotesPanel } from "@/components/notes/notes-panel";
import { AssignClassDialog } from "@/components/classes/assign-class-dialog";
import { AssignFeePlanDialog } from "@/components/fees/assign-fee-plan-dialog";
import { AdjustmentDialog } from "@/components/fees/adjustment-dialog";
import { InvoiceAdjustmentDialog } from "@/components/fees/invoice-adjustment-dialog";
import { InvoiceStatusBadge } from "@/components/fees/invoice-status-badge";
import { formatMoney } from "@/lib/money";

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

  const [
    currentFeePlan,
    invoices,
    feePlans,
    familyMembers,
    familyAdjustments,
    attendanceRecords,
    attendanceStatusGroups,
  ] = await Promise.all([
      prisma.studentFeePlan.findFirst({
        where: { studentId: student.id, endDate: null },
        include: { feePlan: true },
      }),
      prisma.invoice.findMany({
        where: { studentId: student.id },
        orderBy: { periodStart: "desc" },
      }),
      prisma.feePlan.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.student.findMany({
        where: { familyId: student.familyId },
        include: {
          feePlans: { where: { endDate: null }, include: { feePlan: true } },
          invoices: true,
        },
        orderBy: { firstName: "asc" },
      }),
      prisma.adjustment.findMany({
        where: {
          scope: "FAMILY",
          familyId: student.familyId,
          isRecurring: true,
          effectiveFrom: { lte: new Date() },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
        },
      }),
      prisma.attendanceRecord.findMany({
        where: { studentId: student.id },
        include: { session: true },
        orderBy: { session: { date: "desc" } },
        take: 10,
      }),
      prisma.attendanceRecord.groupBy({
        by: ["status"],
        where: { studentId: student.id },
        _count: { _all: true },
      }),
    ]);

  const siblings = familyMembers.filter((m) => m.id !== student.id);
  const familyTotalDue = familyMembers.reduce(
    (sum, m) => sum + m.invoices.reduce((s, i) => s + Number(i.amountDue), 0),
    0,
  );
  const familyTotalPaid = familyMembers.reduce(
    (sum, m) => sum + m.invoices.reduce((s, i) => s + Number(i.amountPaid), 0),
    0,
  );
  const familyOutstanding = Math.max(0, familyTotalDue - familyTotalPaid);

  const feePlanOptions = feePlans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    amount: Number(plan.amount).toFixed(2),
    frequency: plan.frequency,
  }));

  const totalAttendanceRecords = attendanceStatusGroups.reduce(
    (sum, g) => sum + g._count._all,
    0,
  );
  const attendedCount = attendanceStatusGroups
    .filter((g) => g.status === "PRESENT" || g.status === "LATE")
    .reduce((sum, g) => sum + g._count._all, 0);
  const attendancePercent =
    totalAttendanceRecords > 0
      ? Math.round((attendedCount / totalAttendanceRecords) * 100)
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

  const session = await auth();
  const canDelete = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";

  return (
    <>
      <PageHeader
        title={displayName}
        description={STATUS_LABELS[student.status]}
        actions={
          <>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/students/${student.id}/edit`} />}
              className="h-11 sm:h-8"
            >
              <Pencil />
              Edit
            </Button>
            {canDelete && <DeleteStudentButton studentId={student.id} name={displayName} />}
          </>
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
                  {student.dob
                    ? `${formatDate(student.dob)} (${calculateAge(student.dob)} years old)`
                    : "Not on file"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Gender</p>
                <p className="font-medium">
                  {student.gender === "MALE"
                    ? "Male"
                    : student.gender === "FEMALE"
                      ? "Female"
                      : "Not set"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Address</p>
                <p className="font-medium">{address || "No address on file"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Medical / learning information</p>
                <p className="whitespace-pre-wrap font-medium">
                  {student.medicalInfo || "None on file"}
                </p>
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
                currentStatus={student.status}
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Fees</CardTitle>
              <div className="flex gap-2">
                <AdjustmentDialog
                  scope="STUDENT"
                  entityId={student.id}
                  path={`/students/${student.id}`}
                />
                <AssignFeePlanDialog
                  studentId={student.id}
                  feePlans={feePlanOptions}
                  hasPlan={!!currentFeePlan}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {currentFeePlan ? (
                <p>
                  <span className="font-medium">{currentFeePlan.feePlan.name}</span>
                  <span className="ml-2 text-muted-foreground">
                    {formatMoney(currentFeePlan.customAmount ?? currentFeePlan.feePlan.amount)}
                    {currentFeePlan.customAmount && " (custom)"}
                  </span>
                </p>
              ) : (
                <p className="text-muted-foreground">No fee plan assigned yet.</p>
              )}

              {invoices.length > 0 && (
                <div className="space-y-1 border-t pt-3">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between gap-2 py-1"
                    >
                      <div>
                        <span className="font-medium">{invoice.periodLabel}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {formatMoney(invoice.amountPaid)} / {formatMoney(invoice.amountDue)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <InvoiceStatusBadge status={invoice.status} dueDate={invoice.dueDate} />
                        <InvoiceAdjustmentDialog
                          invoiceId={invoice.id}
                          path={`/students/${student.id}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {siblings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Family Fees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {familyAdjustments.length > 0 && (
                  <div className="space-y-1">
                    {familyAdjustments.map((adj) => (
                      <p key={adj.id} className="text-muted-foreground">
                        {adj.amount
                          ? `${formatMoney(adj.amount)} off`
                          : `${Number(adj.percent)}% off`}{" "}
                        — {adj.reason}
                      </p>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1.5">
                    <span className="font-medium">
                      {student.preferredName || student.firstName} {student.lastName}{" "}
                      <span className="text-xs text-muted-foreground">(this student)</span>
                    </span>
                    <span className="text-muted-foreground">
                      {currentFeePlan
                        ? formatMoney(currentFeePlan.customAmount ?? currentFeePlan.feePlan.amount)
                        : "No plan"}
                    </span>
                  </div>
                  {siblings.map((sibling) => {
                    const plan = sibling.feePlans[0];
                    return (
                      <Link
                        key={sibling.id}
                        href={`/students/${sibling.id}`}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
                      >
                        <span>
                          {sibling.preferredName || sibling.firstName} {sibling.lastName}
                        </span>
                        <span className="text-muted-foreground">
                          {plan
                            ? formatMoney(plan.customAmount ?? plan.feePlan.amount)
                            : "No plan"}
                        </span>
                      </Link>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-3 border-t pt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Family total due</p>
                    <p className="font-semibold">{formatMoney(familyTotalDue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Family outstanding</p>
                    <p className="font-semibold">{formatMoney(familyOutstanding)}</p>
                  </div>
                </div>
                <Link
                  href={`/families/${student.familyId}`}
                  className="text-xs underline underline-offset-2"
                >
                  View family profile
                </Link>
              </CardContent>
            </Card>
          )}

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
