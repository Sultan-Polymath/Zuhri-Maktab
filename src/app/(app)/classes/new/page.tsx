import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { ClassForm } from "@/components/classes/class-form";

export default async function NewClassPage() {
  const teachers = await prisma.teacher.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add Class" />
      <ClassForm teachers={teachers} />
    </div>
  );
}
