"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { removeStudentFromClass } from "@/lib/actions/class-transfer";
import { Button } from "@/components/ui/button";

export function RemoveFromClassButton({ studentId }: { studentId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Remove from class"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Remove this student from the class?")) return;
        startTransition(async () => {
          try {
            await removeStudentFromClass(studentId);
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Could not remove student.",
            );
          }
        });
      }}
    >
      <X />
    </Button>
  );
}
