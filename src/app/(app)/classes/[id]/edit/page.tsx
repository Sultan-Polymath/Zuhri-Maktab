import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { ClassForm } from "@/components/classes/class-form";

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [klass, teachers] = await Promise.all([
    prisma.class.findUnique({ where: { id } }),
    prisma.teacher.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!klass) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Edit ${klass.name}`} />
      <ClassForm klass={klass} teachers={teachers} />
    </div>
  );
}
