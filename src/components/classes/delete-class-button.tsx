"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteClass } from "@/lib/actions/classes";
import { Button } from "@/components/ui/button";

export function DeleteClassButton({ classId, name }: { classId: string; name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      className="h-11 sm:h-8"
      disabled={isPending}
      onClick={() => {
        if (!confirm(`Delete the class "${name}"? This can't be undone.`)) return;
        startTransition(async () => {
          try {
            await deleteClass(classId);
            toast.success("Class deleted.");
            router.push("/classes");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not delete class.");
          }
        });
      }}
    >
      <Trash2 />
      Delete
    </Button>
  );
}
