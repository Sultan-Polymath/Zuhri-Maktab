import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDays, formatTimeRange } from "@/lib/days";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { OccupancyBadge } from "@/components/classes/occupancy-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ClassesPage() {
  const classes = await prisma.class.findMany({
    include: {
      primaryTeacher: true,
      _count: { select: { students: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Classes"
        description="Class rosters, capacity and schedules."
        actions={
          <Button nativeButton={false} render={<Link href="/classes/new" />}>
            <Plus />
            Add Class
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No classes yet.
                  </TableCell>
                </TableRow>
              )}
              {classes.map((klass) => (
                <TableRow key={klass.id}>
                  <TableCell>
                    <Link
                      href={`/classes/${klass.id}`}
                      className="font-medium hover:underline"
                    >
                      {klass.name}
                    </Link>
                    {klass.yearGroup && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        {klass.yearGroup}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {klass.primaryTeacher?.name ?? "Unassigned"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDays(klass.days)} · {formatTimeRange(klass.startTime, klass.endTime)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {klass.room ?? "—"}
                  </TableCell>
                  <TableCell>
                    <OccupancyBadge current={klass._count.students} capacity={klass.capacity} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={klass.status === "ACTIVE" ? "secondary" : "outline"}>
                      {klass.status === "ACTIVE" ? "Active" : "Inactive"}
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
