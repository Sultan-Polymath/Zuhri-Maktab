"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteStudent } from "@/lib/actions/students";
import { Button } from "@/components/ui/button";

export function DeleteStudentButton({ studentId, name }: { studentId: string; name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      className="h-11 sm:h-8"
      disabled={isPending}
      onClick={() => {
        if (!confirm(`Delete ${name}? This can't be undone.`)) return;
        startTransition(async () => {
          try {
            await deleteStudent(studentId);
            toast.success("Student deleted.");
            router.push("/students");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not delete student.");
          }
        });
      }}
    >
      <Trash2 />
      Delete
    </Button>
  );
}
