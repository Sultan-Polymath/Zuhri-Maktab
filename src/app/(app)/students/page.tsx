import Link from "next/link";
import { Plus, Search, TriangleAlert } from "lucide-react";
import type { Gender, StudentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateAge } from "@/lib/age";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/forms/native-select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<StudentStatus, string> = {
  ENQUIRY: "Enquiry",
  APPLICATION: "Application",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  LEFT: "Left",
  TRANSFERRED: "Transferred",
  WAITING_LIST: "Waiting List",
};

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; gender?: string; missing?: string }>;
}) {
  const { q, status, gender, missing } = await searchParams;

  const [students, missingInfoCount] = await Promise.all([
    prisma.student.findMany({
      where: {
        AND: [
          q
            ? {
                OR: [
                  { firstName: { contains: q, mode: "insensitive" } },
                  { lastName: { contains: q, mode: "insensitive" } },
                  { preferredName: { contains: q, mode: "insensitive" } },
                  { studentCode: { contains: q, mode: "insensitive" } },
                  { family: { surnameLabel: { contains: q, mode: "insensitive" } } },
                ],
              }
            : {},
          status ? { status: status as StudentStatus } : {},
          gender ? { gender: gender as Gender } : {},
          missing === "1" ? { OR: [{ dob: null }, { gender: null }] } : {},
        ],
      },
      include: { family: true, currentClass: true },
      orderBy: [
        { currentClass: { name: "asc" } },
        { lastName: "asc" },
        { firstName: "asc" },
      ],
      take: 200,
    }),
    prisma.student.count({ where: { OR: [{ dob: null }, { gender: null }] } }),
  ]);

  return (
    <>
      <PageHeader
        title="Students"
        description="Every student record, from first enquiry to active enrolment."
        actions={
          <Button nativeButton={false} render={<Link href="/students/new" />}>
            <Plus />
            Add Student
          </Button>
        }
      />

      {missingInfoCount > 0 && missing !== "1" && (
        <Link
          href="/students?missing=1"
          className="mb-4 flex items-center gap-2 rounded-md border border-amber-600/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 hover:bg-amber-500/15 dark:text-amber-500"
        >
          <TriangleAlert className="size-4 shrink-0" />
          {missingInfoCount} student{missingInfoCount === 1 ? "" : "s"} imported without a date
          of birth or gender on file — click to review and complete them.
        </Link>
      )}

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
        {missing === "1" && <input type="hidden" name="missing" value="1" />}
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search name, student ID, family…"
            className="pl-8"
          />
        </div>
        <NativeSelect name="status" defaultValue={status ?? ""} className="w-40">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="gender" defaultValue={gender ?? ""} className="w-36">
          <option value="">All genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </NativeSelect>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Medical / Learning Info</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Family</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No students match these filters.
                  </TableCell>
                </TableRow>
              )}
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Link
                      href={`/students/${student.id}`}
                      className="font-medium hover:underline"
                    >
                      {student.preferredName || student.firstName} {student.lastName}
                    </Link>
                  </TableCell>
                  <TableCell
                    className="max-w-48 truncate text-muted-foreground"
                    title={student.medicalInfo ?? undefined}
                  >
                    {student.medicalInfo || "—"}
                  </TableCell>
                  <TableCell>{calculateAge(student.dob) ?? "—"}</TableCell>
                  <TableCell>
                    <Link
                      href={`/families/${student.familyId}`}
                      className="hover:underline"
                    >
                      {student.family.surnameLabel}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.currentClass?.name ?? "Not assigned"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{STATUS_LABELS[student.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
