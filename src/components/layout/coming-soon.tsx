import { PageHeader } from "./page-header";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {description}
        </CardContent>
      </Card>
    </>
  );
}
