import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function FamiliesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const families = await prisma.family.findMany({
    where: q
      ? {
          OR: [
            { surnameLabel: { contains: q, mode: "insensitive" } },
            { guardians: { some: { name: { contains: q, mode: "insensitive" } } } },
            { guardians: { some: { phone: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : undefined,
    include: {
      guardians: { where: { isPrimaryContact: true }, take: 1 },
      _count: { select: { students: true } },
    },
    orderBy: { surnameLabel: "asc" },
    take: 100,
  });

  return (
    <>
      <PageHeader
        title="Families"
        description="Households and guardians. Each family holds its children and financial position together."
        actions={
          <Button nativeButton={false} render={<Link href="/families/new" />}>
            <Plus />
            Add Family
          </Button>
        }
      />

      <form method="get" className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search family, guardian or phone…"
            className="pl-8"
          />
        </div>
      </form>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Family</TableHead>
                <TableHead>Primary contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Children</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {families.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    {q ? "No families match your search." : "No families yet."}
                  </TableCell>
                </TableRow>
              )}
              {families.map((family) => {
                const primary = family.guardians[0];
                return (
                  <TableRow key={family.id}>
                    <TableCell>
                      <Link
                        href={`/families/${family.id}`}
                        className="font-medium hover:underline"
                      >
                        {family.surnameLabel}
                      </Link>
                    </TableCell>
                    <TableCell>{primary?.name ?? "—"}</TableCell>
                    <TableCell>{primary?.phone ?? "—"}</TableCell>
                    <TableCell>{family._count.students}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
