import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROLE_LABELS: Record<string, string> = {
  TEACHER: "Teacher",
  ASSISTANT_TEACHER: "Assistant Teacher",
  HEAD_TEACHER: "Head Teacher",
  ADMINISTRATOR: "Administrator",
};

export default async function TeachersPage() {
  const teachers = await prisma.teacher.findMany({
    include: { _count: { select: { primaryClasses: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Teachers"
        description="Teacher profiles and class assignments."
        actions={
          <Button nativeButton={false} render={<Link href="/teachers/new" />}>
            <Plus />
            Add Teacher
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No teachers yet.
                  </TableCell>
                </TableRow>
              )}
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>
                    <Link
                      href={`/teachers/${teacher.id}/edit`}
                      className="font-medium hover:underline"
                    >
                      {teacher.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ROLE_LABELS[teacher.role]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {teacher.phone ?? "—"}
                  </TableCell>
                  <TableCell>{teacher._count.primaryClasses}</TableCell>
                  <TableCell>
                    <Badge variant={teacher.status === "ACTIVE" ? "secondary" : "outline"}>
                      {teacher.status === "ACTIVE" ? "Active" : "Inactive"}
                    </Badge>
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
