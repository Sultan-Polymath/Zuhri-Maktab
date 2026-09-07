import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { StudentEditForm } from "./student-edit-form";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [student, families] = await Promise.all([
    prisma.student.findUnique({ where: { id } }),
    prisma.family.findMany({
      select: { id: true, surnameLabel: true },
      orderBy: { surnameLabel: "asc" },
    }),
  ]);
  if (!student) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`Edit ${student.firstName} ${student.lastName}`}
      />
      <StudentEditForm student={student} families={families} />
    </div>
  );
}
