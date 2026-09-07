import Link from "next/link";
import { Users } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const session = await auth();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configuration for how the Maktab runs day to day."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isSuperAdmin && (
          <Link href="/settings/users">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader className="flex-row items-center gap-3">
                <Users className="size-5 text-muted-foreground" />
                <CardTitle className="text-base">Users & Roles</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Add staff and teacher accounts, and manage permissions.
              </CardContent>
            </Card>
          </Link>
        )}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-base">Subjects</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Coming with the Progress module.
          </CardContent>
        </Card>
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-base">Fee Plans & Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Coming with the Fees & Finance module.
          </CardContent>
        </Card>
      </div>
    </>
  );
}
