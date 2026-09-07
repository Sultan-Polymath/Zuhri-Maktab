import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus, Star, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { calculateAge } from "@/lib/age";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GuardianDialog } from "@/components/families/guardian-dialog";
import { DeleteGuardianButton } from "@/components/families/delete-guardian-button";

function formatAddress(entity: {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
}) {
  const parts = [
    entity.addressLine1,
    entity.addressLine2,
    entity.city,
    entity.postcode,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "No address on file";
}

export default async function FamilyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const family = await prisma.family.findUnique({
    where: { id },
    include: {
      guardians: { orderBy: [{ isPrimaryContact: "desc" }, { name: "asc" }] },
      students: { orderBy: { firstName: "asc" } },
    },
  });

  if (!family) notFound();

  return (
    <>
      <PageHeader
        title={family.surnameLabel}
        description={formatAddress(family)}
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href={`/families/${family.id}/edit`} />}>
            <Pencil />
            Edit Family
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Guardians</CardTitle>
              <GuardianDialog familyId={family.id} />
            </CardHeader>
            <CardContent className="space-y-4">
              {family.guardians.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No guardians on file.
                </p>
              )}
              {family.guardians.map((guardian, index) => (
                <div key={guardian.id}>
                  {index > 0 && <Separator className="mb-4" />}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{guardian.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {guardian.relationship}
                        </span>
                        {guardian.isPrimaryContact && (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="size-3" /> Primary
                          </Badge>
                        )}
                        {guardian.isEmergencyContact && (
                          <Badge variant="secondary" className="gap-1">
                            <ShieldAlert className="size-3" /> Emergency
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                        {guardian.phone && <div>{guardian.phone}</div>}
                        {guardian.secondaryPhone && (
                          <div>{guardian.secondaryPhone} (secondary)</div>
                        )}
                        {guardian.email && <div>{guardian.email}</div>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <GuardianDialog familyId={family.id} guardian={guardian} />
                      <DeleteGuardianButton guardianId={guardian.id} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Children</CardTitle>
              <Button size="sm" nativeButton={false} render={<Link href={`/students/new?familyId=${family.id}`} />}>
                <Plus />
                Add Child
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {family.students.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No children linked to this family yet.
                </p>
              )}
              {family.students.map((student) => (
                <Link
                  key={student.id}
                  href={`/students/${student.id}`}
                  className="-mx-2 flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted"
                >
                  <div>
                    <span className="font-medium">
                      {student.preferredName || student.firstName} {student.lastName}
                    </span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {calculateAge(student.dob)} yrs · {student.studentCode}
                    </span>
                  </div>
                  <Badge variant="outline">{student.status.replace("_", " ")}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fees & Finance</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Family billing and payment history will appear here once the
              Fees & Finance module is built.
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
