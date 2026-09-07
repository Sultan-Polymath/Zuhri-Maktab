import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { TeacherForm } from "@/components/teachers/teacher-form";

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Edit ${teacher.name}`} />
      <TeacherForm teacher={teacher} />
    </div>
  );
}
