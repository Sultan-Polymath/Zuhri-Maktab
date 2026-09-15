import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatAuditEntry } from "@/lib/audit-format";
import { formatMoney } from "@/lib/money";
import { isOverdue } from "@/lib/invoice-overdue";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { AlertItem } from "@/components/dashboard/alert-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  PoundSterling,
} from "lucide-react";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  if (session?.user?.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: { primaryClasses: true, assistantOf: { include: { class: true } } },
    });
    if (teacher) {
      const classIds = new Set([
        ...teacher.primaryClasses.map((c) => c.id),
        ...teacher.assistantOf.map((a) => a.class.id),
      ]);
      if (classIds.size === 1) {
        redirect(`/attendance?classId=${[...classIds][0]}`);
      }
    }
  }

  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const isAdminViewer = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";

  const [
    statusCounts,
    classes,
    allAttendanceRecords,
    recentActivity,
    unpaidInvoices,
    missingInfoCount,
    pendingChangeRequestCount,
  ] = await Promise.all([
      prisma.student.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.class.findMany({
        where: { status: "ACTIVE" },
        include: { _count: { select: { students: true } } },
        orderBy: { name: "asc" },
      }),
      // Only the last 60 days: enough to judge "today" and a recent
      // attendance trend, without scanning the whole history as it grows.
      prisma.attendanceRecord.findMany({
        where: { session: { date: { gte: sixtyDaysAgo } } },
        select: { studentId: true, status: true, session: { select: { date: true } } },
      }),
      prisma.auditLog.findMany({
        orderBy: { timestamp: "desc" },
        take: 8,
        include: { user: true },
      }),
      prisma.invoice.findMany({
        where: { status: { in: ["PENDING", "PARTIALLY_PAID"] } },
        select: { amountDue: true, amountPaid: true, dueDate: true, studentId: true },
      }),
      prisma.student.count({ where: { OR: [{ dob: null }, { gender: null }] } }),
      isAdminViewer ? prisma.changeRequest.count({ where: { status: "PENDING" } }) : 0,
    ]);

  const totalOutstanding = unpaidInvoices.reduce(
    (sum, inv) => sum + (Number(inv.amountDue) - Number(inv.amountPaid)),
    0,
  );
  const overdueStudentIds = new Set(
    unpaidInvoices.filter((inv) => isOverdue(inv.dueDate)).map((inv) => inv.studentId),
  );

  const countFor = (status: string) =>
    statusCounts.find((s) => s.status === status)?._count._all ?? 0;
  const activeStudents = countFor("ACTIVE");
  const enquiries = countFor("ENQUIRY");
  const applications = countFor("APPLICATION");
  const waitingList = countFor("WAITING_LIST");

  const totalClasses = classes.length;
  const availableSpaces = classes.reduce(
    (sum, c) => sum + Math.max(0, c.capacity - c._count.students),
    0,
  );
  const fullClasses = classes.filter((c) => c._count.students >= c.capacity);
  const nearFullClasses = classes.filter(
    (c) => c._count.students < c.capacity && c._count.students / c.capacity >= 0.85,
  );

  const todayStr = todayIsoDate();
  const todayRecords = allAttendanceRecords.filter(
    (r) => r.session.date.toISOString().slice(0, 10) === todayStr,
  );
  const todayPresentish = todayRecords.filter(
    (r) => r.status === "PRESENT" || r.status === "LATE",
  ).length;
  const todayPercent =
    todayRecords.length > 0
      ? Math.round((todayPresentish / todayRecords.length) * 100)
      : null;

  const attendanceByStudent = new Map<string, { total: number; present: number }>();
  for (const r of allAttendanceRecords) {
    const entry = attendanceByStudent.get(r.studentId) ?? { total: 0, present: 0 };
    entry.total++;
    if (r.status === "PRESENT" || r.status === "LATE") entry.present++;
    attendanceByStudent.set(r.studentId, entry);
  }
  const lowAttendanceStudentIds = [...attendanceByStudent.entries()]
    .filter(([, v]) => v.total >= 3 && v.present / v.total < 0.75)
    .map(([id]) => id);

  const lowAttendanceStudents =
    lowAttendanceStudentIds.length > 0
      ? await prisma.student.findMany({
          where: { id: { in: lowAttendanceStudentIds }, status: "ACTIVE" },
          select: { id: true, firstName: true, lastName: true, preferredName: true },
        })
      : [];

  const hasAlerts =
    fullClasses.length > 0 ||
    nearFullClasses.length > 0 ||
    lowAttendanceStudents.length > 0 ||
    applications > 0 ||
    overdueStudentIds.size > 0 ||
    missingInfoCount > 0 ||
    pendingChangeRequestCount > 0;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's what's happening at the Maktab."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Active Students"
          value={activeStudents}
          sublabel={`${enquiries} enquiries · ${waitingList} waiting`}
          icon={Users}
          href="/students?status=ACTIVE"
        />
        <StatCard
          label="Classes"
          value={totalClasses}
          sublabel={`${availableSpaces} spaces available`}
          icon={GraduationCap}
          href="/classes"
        />
        <StatCard
          label="Today's Attendance"
          value={todayPercent === null ? "—" : `${todayPercent}%`}
          sublabel={todayPercent === null ? "No attendance taken yet" : `${todayRecords.length} students marked`}
          icon={ClipboardCheck}
          href="/attendance"
        />
        <StatCard
          label="Applications"
          value={applications}
          sublabel="awaiting review"
          icon={Clock}
          href="/students?status=APPLICATION"
        />
        <StatCard
          label="Fees Outstanding"
          value={formatMoney(totalOutstanding)}
          sublabel={
            overdueStudentIds.size > 0
              ? `${overdueStudentIds.size} student${overdueStudentIds.size === 1 ? "" : "s"} overdue`
              : "none overdue"
          }
          icon={PoundSterling}
          href="/fees"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Needs your attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!hasAlerts && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4" />
                Nothing needs your attention right now.
              </div>
            )}
            {fullClasses.map((c) => (
              <AlertItem key={c.id} href={`/classes/${c.id}`}>
                {c.name} is at capacity ({c._count.students}/{c.capacity})
              </AlertItem>
            ))}
            {nearFullClasses.map((c) => (
              <AlertItem key={c.id} href={`/classes/${c.id}`}>
                {c.name} is nearly full ({c._count.students}/{c.capacity})
              </AlertItem>
            ))}
            {lowAttendanceStudents.length > 0 && (
              <AlertItem href="/students">
                {lowAttendanceStudents.length} student
                {lowAttendanceStudents.length === 1 ? "" : "s"} have attendance below
                75%:{" "}
                {lowAttendanceStudents
                  .map((s) => s.preferredName || s.firstName)
                  .join(", ")}
              </AlertItem>
            )}
            {applications > 0 && (
              <AlertItem href="/students?status=APPLICATION">
                {applications} new enrolment application
                {applications === 1 ? "" : "s"} awaiting review
              </AlertItem>
            )}
            {overdueStudentIds.size > 0 && (
              <AlertItem href="/fees">
                {overdueStudentIds.size} student
                {overdueStudentIds.size === 1 ? " has" : "s have"} overdue fees (
                {formatMoney(totalOutstanding)} outstanding)
              </AlertItem>
            )}
            {missingInfoCount > 0 && (
              <AlertItem href="/students?missing=1">
                {missingInfoCount} student{missingInfoCount === 1 ? "" : "s"} imported without a
                date of birth or gender on file — needs completing
              </AlertItem>
            )}
            {pendingChangeRequestCount > 0 && (
              <AlertItem href="/change-requests">
                {pendingChangeRequestCount} teacher change request
                {pendingChangeRequestCount === 1 ? "" : "s"} awaiting your approval
              </AlertItem>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            )}
            {recentActivity.map((entry) => (
              <div key={entry.id} className="text-sm">
                <span className="font-medium">{entry.user?.name ?? "System"}</span>{" "}
                <span className="text-muted-foreground">
                  {formatAuditEntry(entry)}
                </span>
                <span className="ml-1 text-xs text-muted-foreground">
                  · {formatDateTime(entry.timestamp)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
