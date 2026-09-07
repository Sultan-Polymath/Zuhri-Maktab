"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteGuardian } from "@/lib/actions/families";
import { Button } from "@/components/ui/button";

export function DeleteGuardianButton({ guardianId }: { guardianId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Remove guardian"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Remove this guardian from the family?")) return;
        startTransition(async () => {
          try {
            await deleteGuardian(guardianId);
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Could not remove guardian.",
            );
          }
        });
      }}
    >
      <Trash2 />
    </Button>
  );
}
