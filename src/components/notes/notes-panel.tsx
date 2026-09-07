import type { NoteEntityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AddNoteForm } from "./add-note-form";
import { Separator } from "@/components/ui/separator";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function NotesPanel({
  entityType,
  entityId,
  path,
}: {
  entityType: NoteEntityType;
  entityId: string;
  path: string;
}) {
  const notes = await prisma.note.findMany({
    where: { entityType, entityId },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <AddNoteForm entityType={entityType} entityId={entityId} path={path} />
      {notes.length > 0 && <Separator />}
      <div className="space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="text-sm">
            <p className="whitespace-pre-wrap">{note.text}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {note.author.name} · {formatDateTime(note.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
