"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { approveChangeRequest } from "@/lib/actions/change-requests";
import { Button } from "@/components/ui/button";

export function ApproveButton({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Approve this request? It will be applied immediately.")) return;
        startTransition(async () => {
          const result = await approveChangeRequest(requestId);
          if (result?.error) toast.error(result.error);
          else toast.success("Approved.");
        });
      }}
    >
      <Check />
      Approve
    </Button>
  );
}
