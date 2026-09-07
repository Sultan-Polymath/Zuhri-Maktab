import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { StudentNewForm } from "./student-new-form";

export default async function NewStudentPage({
  searchParams,
}: {
  searchParams: Promise<{ familyId?: string }>;
}) {
  const { familyId } = await searchParams;

  const families = await prisma.family.findMany({
    include: { guardians: { where: { isPrimaryContact: true }, take: 1 } },
    orderBy: { surnameLabel: "asc" },
  });

  const familyOptions = families.map((family) => ({
    id: family.id,
    surnameLabel: family.surnameLabel,
    primaryGuardianName: family.guardians[0]?.name,
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Add Student"
        description="Create a new student record and link them to a family."
      />
      <StudentNewForm families={familyOptions} defaultFamilyId={familyId} />
    </div>
  );
}
