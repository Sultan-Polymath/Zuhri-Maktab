import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { FamilyEditForm } from "./family-edit-form";

export default async function EditFamilyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const family = await prisma.family.findUnique({ where: { id } });
  if (!family) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Edit ${family.surnameLabel}`} />
      <FamilyEditForm family={family} />
    </div>
  );
}
