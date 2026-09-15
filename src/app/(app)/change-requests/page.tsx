import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApproveButton } from "@/components/change-requests/approve-button";
import { RejectDialog } from "@/components/change-requests/reject-dialog";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function ChangeRequestsPage() {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const [pending, recent, classNames] = await Promise.all([
    prisma.changeRequest.findMany({
      where: { status: "PENDING" },
      include: { student: true, requestedBy: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.changeRequest.findMany({
      where: { status: { not: "PENDING" } },
      include: { student: true, requestedBy: true, reviewedBy: true },
      orderBy: { reviewedAt: "desc" },
      take: 20,
    }),
    prisma.class.findMany({ select: { id: true, name: true } }),
  ]);

  const classNameById = new Map(classNames.map((c) => [c.id, c.name]));

  function describe(req: (typeof pending)[number]) {
    // Once approved, the student record already reflects the requested
    // name/class — showing "from X to X" would be redundant, so only
    // contrast current-vs-proposed while still pending.
    if (req.type === "STUDENT_NAME_EDIT") {
      const { firstName, lastName } = req.payload as { firstName: string; lastName: string };
      const target = `"${firstName} ${lastName}"`;
      return req.status === "PENDING"
        ? `Rename "${req.student.firstName} ${req.student.lastName}" to ${target}`
        : `Rename to ${target}`;
    }
    const { toClassId } = req.payload as { toClassId: string };
    const target = classNameById.get(toClassId) ?? "an unknown class";
    return `Move "${req.student.firstName} ${req.student.lastName}" to ${target}`;
  }

  return (
    <>
      <PageHeader
        title="Change Requests"
        description="Teacher-suggested edits, awaiting your approval."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {pending.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing waiting on you.</p>
            )}
            {pending.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-0"
              >
                <div>
                  <Link href={`/students/${req.studentId}`} className="font-medium hover:underline">
                    {describe(req)}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Requested by {req.requestedBy.name} · {formatDateTime(req.createdAt)}
                    {req.note && ` · "${req.note}"`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ApproveButton requestId={req.id} />
                  <RejectDialog requestId={req.id} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recently reviewed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recent.length === 0 && (
              <p className="text-sm text-muted-foreground">No reviewed requests yet.</p>
            )}
            {recent.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{describe(req)}</p>
                  <p className="text-sm text-muted-foreground">
                    Requested by {req.requestedBy.name} · reviewed by {req.reviewedBy?.name ?? "—"}
                    {req.reviewedAt && ` · ${formatDateTime(req.reviewedAt)}`}
                    {req.reviewNote && ` · "${req.reviewNote}"`}
                  </p>
                </div>
                <Badge variant={req.status === "APPROVED" ? "secondary" : "outline"}>
                  {req.status === "APPROVED" ? "Approved" : "Rejected"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
