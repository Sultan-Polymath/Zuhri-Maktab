import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's what's happening at the Maktab."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dashboard is under construction</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Student, class, attendance and finance summaries will appear here
          once those modules are built.
        </CardContent>
      </Card>
    </>
  );
}
