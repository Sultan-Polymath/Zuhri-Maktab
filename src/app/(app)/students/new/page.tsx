import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EnrolmentForm } from "./enrolment-form";

export default async function NewStudentPage({
  searchParams,
}: {
  searchParams: Promise<{ familyId?: string }>;
}) {
  const { familyId } = await searchParams;

  const [families, feePlans] = await Promise.all([
    prisma.family.findMany({
      include: { guardians: { where: { isPrimaryContact: true }, take: 1 } },
      orderBy: { surnameLabel: "asc" },
    }),
    prisma.feePlan.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const familyOptions = families.map((family) => ({
    id: family.id,
    surnameLabel: family.surnameLabel,
    primaryGuardianName: family.guardians[0]?.name,
  }));
  const feePlanOptions = feePlans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    amount: Number(plan.amount).toFixed(2),
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Enrol Student(s)"
        description="Create a new family or pick an existing one, add one or more children, and optionally assign a fee plan — all in one go."
      />
      <EnrolmentForm
        families={familyOptions}
        feePlans={feePlanOptions}
        defaultFamilyId={familyId}
      />
    </div>
  );
}
