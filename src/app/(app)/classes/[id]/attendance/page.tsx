import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  PRESENT: "bg-secondary text-secondary-foreground",
  LATE: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  ABSENT: "bg-destructive/15 text-destructive",
  EXCUSED: "bg-muted text-foreground",
};

const STATUS_LETTER: Record<string, string> = {
  PRESENT: "P",
  LATE: "L",
  ABSENT: "A",
  EXCUSED: "E",
};

function parseMonthParam(month?: string) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    return { year: y, monthIndex: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}

function shiftMonth(year: number, monthIndex: number, delta: number) {
  const d = new Date(Date.UTC(year, monthIndex + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function ClassMonthlyAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const { month } = await searchParams;
  const { year, monthIndex } = parseMonthParam(month);

  const monthStart = new Date(Date.UTC(year, monthIndex, 1));
  const monthEnd = new Date(Date.UTC(year, monthIndex + 1, 0));

  const [klass, sessions] = await Promise.all([
    prisma.class.findUnique({
      where: { id },
      include: { students: { orderBy: [{ lastName: "asc" }, { firstName: "asc" }] } },
    }),
    prisma.attendanceSession.findMany({
      where: { classId: id, date: { gte: monthStart, lte: monthEnd } },
      include: { records: true },
      orderBy: { date: "asc" },
    }),
  ]);

  if (!klass) notFound();

  const statusByDateAndStudent = new Map<string, Map<string, string>>();
  for (const session of sessions) {
    const dateKey = session.date.toISOString().slice(0, 10);
    const map = new Map<string, string>();
    for (const record of session.records) map.set(record.studentId, record.status);
    statusByDateAndStudent.set(dateKey, map);
  }

  const monthLabel = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(monthStart);

  return (
    <>
      <PageHeader
        title={`${klass.name} — Monthly Attendance`}
        description={sessions.length === 0 ? "No attendance taken this month yet." : undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              nativeButton={false}
              render={
                <Link href={`/classes/${id}/attendance?month=${shiftMonth(year, monthIndex, -1)}`} />
              }
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-36 text-center text-sm font-medium">{monthLabel}</span>
            <Button
              variant="outline"
              size="icon"
              nativeButton={false}
              render={
                <Link href={`/classes/${id}/attendance?month=${shiftMonth(year, monthIndex, 1)}`} />
              }
            >
              <ChevronRight />
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="sticky left-0 z-10 bg-card px-4 py-2 text-left font-medium">
                  Student
                </th>
                {sessions.map((session) => (
                  <th key={session.id} className="px-2 py-2 text-center font-medium text-muted-foreground">
                    {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(
                      session.date,
                    )}
                  </th>
                ))}
                <th className="px-4 py-2 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {klass.students.length === 0 && (
                <tr>
                  <td colSpan={sessions.length + 2} className="py-8 text-center text-muted-foreground">
                    No students in this class.
                  </td>
                </tr>
              )}
              {klass.students.map((student) => {
                let present = 0;
                let total = 0;
                return (
                  <tr key={student.id} className="border-b last:border-0">
                    <td className="sticky left-0 z-10 bg-card px-4 py-2 font-medium">
                      <Link href={`/students/${student.id}`} className="hover:underline">
                        {student.preferredName || student.firstName} {student.lastName}
                      </Link>
                    </td>
                    {sessions.map((session) => {
                      const dateKey = session.date.toISOString().slice(0, 10);
                      const status = statusByDateAndStudent.get(dateKey)?.get(student.id);
                      if (status) {
                        total++;
                        if (status === "PRESENT" || status === "LATE") present++;
                      }
                      return (
                        <td key={session.id} className="px-2 py-2 text-center">
                          {status ? (
                            <span
                              className={cn(
                                "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                                STATUS_STYLE[status],
                              )}
                            >
                              {STATUS_LETTER[status]}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {total > 0 ? `${Math.round((present / total) * 100)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
