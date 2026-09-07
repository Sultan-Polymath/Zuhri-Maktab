"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { togglePaymentMethodActive } from "@/lib/actions/payment-methods";
import { Button } from "@/components/ui/button";

export function ToggleMethodActiveButton({
  methodId,
  isActive,
}: {
  methodId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await togglePaymentMethodActive(methodId);
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Could not update method.",
            );
          }
        });
      }}
    >
      {isActive ? "Deactivate" : "Reactivate"}
    </Button>
  );
}
