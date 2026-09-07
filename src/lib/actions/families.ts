"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireUser } from "./require-user";
import { familySchema, guardianSchema } from "@/lib/validation/family";

export type ActionState = { error?: string; success?: boolean } | undefined;

const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE"] as const;

function parseGuardianFromForm(formData: FormData, prefix: string) {
  return guardianSchema.safeParse({
    name: formData.get(`${prefix}Name`),
    relationship: formData.get(`${prefix}Relationship`),
    phone: formData.get(`${prefix}Phone`),
    secondaryPhone: formData.get(`${prefix}SecondaryPhone`),
    email: formData.get(`${prefix}Email`),
    isPrimaryContact: formData.get(`${prefix}IsPrimaryContact`) === "on",
    isEmergencyContact: formData.get(`${prefix}IsEmergencyContact`) === "on",
    preferredContactMethod:
      formData.get(`${prefix}PreferredContactMethod`) || "PHONE",
  });
}

export async function createFamily(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...STAFF_ROLES]);

  const familyParsed = familySchema.safeParse({
    surnameLabel: formData.get("surnameLabel"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    postcode: formData.get("postcode"),
  });
  if (!familyParsed.success) {
    return { error: familyParsed.error.issues[0]?.message ?? "Invalid family details." };
  }

  const guardianParsed = parseGuardianFromForm(formData, "guardian");
  if (!guardianParsed.success) {
    return { error: guardianParsed.error.issues[0]?.message ?? "Invalid guardian details." };
  }

  const family = await prisma.$transaction(async (tx) => {
    const family = await tx.family.create({ data: familyParsed.data });
    await tx.guardian.create({
      data: {
        ...guardianParsed.data,
        isPrimaryContact: true,
        familyId: family.id,
      },
    });
    await logAudit(tx, {
      entityType: "Family",
      entityId: family.id,
      action: "created",
      newValue: familyParsed.data,
      userId: user.id,
    });
    return family;
  });

  revalidatePath("/families");
  redirect(`/families/${family.id}`);
}

export async function updateFamily(
  familyId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...STAFF_ROLES]);

  const parsed = familySchema.safeParse({
    surnameLabel: formData.get("surnameLabel"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    postcode: formData.get("postcode"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid family details." };
  }

  const before = await prisma.family.findUnique({ where: { id: familyId } });
  if (!before) return { error: "Family not found." };

  await prisma.$transaction(async (tx) => {
    await tx.family.update({ where: { id: familyId }, data: parsed.data });
    await logAudit(tx, {
      entityType: "Family",
      entityId: familyId,
      action: "updated",
      previousValue: before,
      newValue: parsed.data,
      userId: user.id,
    });
  });

  revalidatePath("/families");
  revalidatePath(`/families/${familyId}`);
  redirect(`/families/${familyId}`);
}

export async function addGuardian(
  familyId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...STAFF_ROLES]);

  const parsed = parseGuardianFromForm(formData, "guardian");
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid guardian details." };
  }

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isPrimaryContact) {
      await tx.guardian.updateMany({
        where: { familyId },
        data: { isPrimaryContact: false },
      });
    }
    const guardian = await tx.guardian.create({
      data: { ...parsed.data, familyId },
    });
    await logAudit(tx, {
      entityType: "Guardian",
      entityId: guardian.id,
      action: "created",
      newValue: parsed.data,
      userId: user.id,
    });
  });

  revalidatePath(`/families/${familyId}`);
  return { success: true };
}

export async function updateGuardian(
  guardianId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...STAFF_ROLES]);

  const parsed = parseGuardianFromForm(formData, "guardian");
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid guardian details." };
  }

  const before = await prisma.guardian.findUnique({ where: { id: guardianId } });
  if (!before) return { error: "Guardian not found." };

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isPrimaryContact && !before.isPrimaryContact) {
      await tx.guardian.updateMany({
        where: { familyId: before.familyId, id: { not: guardianId } },
        data: { isPrimaryContact: false },
      });
    }
    await tx.guardian.update({ where: { id: guardianId }, data: parsed.data });
    await logAudit(tx, {
      entityType: "Guardian",
      entityId: guardianId,
      action: "updated",
      previousValue: before,
      newValue: parsed.data,
      userId: user.id,
    });
  });

  revalidatePath(`/families/${before.familyId}`);
  return { success: true };
}

export async function deleteGuardian(guardianId: string): Promise<void> {
  const user = await requireUser([...STAFF_ROLES]);

  const guardian = await prisma.guardian.findUnique({ where: { id: guardianId } });
  if (!guardian) return;

  const remaining = await prisma.guardian.count({
    where: { familyId: guardian.familyId },
  });
  if (remaining <= 1) {
    throw new Error("A family must have at least one guardian on record.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.guardian.delete({ where: { id: guardianId } });
    await logAudit(tx, {
      entityType: "Guardian",
      entityId: guardianId,
      action: "deleted",
      previousValue: guardian,
      userId: user.id,
    });
  });

  revalidatePath(`/families/${guardian.familyId}`);
}
