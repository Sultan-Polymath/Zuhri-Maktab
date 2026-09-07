"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleUserActive } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";

export function ToggleActiveButton({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => {
        const verb = isActive ? "deactivate" : "reactivate";
        if (!confirm(`Are you sure you want to ${verb} this user?`)) return;
        startTransition(async () => {
          try {
            await toggleUserActive(userId);
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Could not update user.",
            );
          }
        });
      }}
    >
      {isActive ? "Deactivate" : "Reactivate"}
    </Button>
  );
}
