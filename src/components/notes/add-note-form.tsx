"use client";

import { useActionState, useRef, useEffect } from "react";
import type { NoteEntityType } from "@prisma/client";
import { addNote } from "@/lib/actions/notes";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/forms/field";

export function AddNoteForm({
  entityType,
  entityId,
  path,
}: {
  entityType: NoteEntityType;
  entityId: string;
  path: string;
}) {
  const action = addNote.bind(null, entityType, entityId, path);
  const [state, formAction, isPending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const prevPending = useRef(isPending);

  useEffect(() => {
    if (prevPending.current && !isPending && !state?.error) {
      formRef.current?.reset();
    }
    prevPending.current = isPending;
  }, [isPending, state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <FormError message={state?.error} />
      <Textarea
        name="text"
        placeholder="Add a note…"
        required
        className="min-h-16"
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Adding…" : "Add note"}
        </Button>
      </div>
    </form>
  );
}
