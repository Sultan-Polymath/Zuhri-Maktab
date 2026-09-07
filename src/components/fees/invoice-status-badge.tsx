import type { InvoiceStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { isOverdue as computeIsOverdue } from "@/lib/invoice-overdue";

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: "secondary" | "outline" | "destructive" }> = {
  PAID: { label: "Paid", variant: "secondary" },
  PARTIALLY_PAID: { label: "Partially Paid", variant: "outline" },
  PENDING: { label: "Pending", variant: "outline" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
  WAIVED: { label: "Waived", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "outline" },
};

export function InvoiceStatusBadge({
  status,
  dueDate,
}: {
  status: InvoiceStatus;
  dueDate?: Date;
}) {
  const overdue =
    dueDate &&
    computeIsOverdue(dueDate) &&
    (status === "PENDING" || status === "PARTIALLY_PAID");
  const config = overdue ? STATUS_CONFIG.OVERDUE : STATUS_CONFIG[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
