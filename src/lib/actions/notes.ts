"use server";

import { revalidatePath } from "next/cache";
import type { NoteEntityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "./require-user";

export type ActionState = { error?: string } | undefined;

export async function addNote(
  entityType: NoteEntityType,
  entityId: string,
  path: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "Note can't be empty." };

  await prisma.note.create({
    data: { entityType, entityId, text, authorUserId: user.id },
  });

  revalidatePath(path);
}
