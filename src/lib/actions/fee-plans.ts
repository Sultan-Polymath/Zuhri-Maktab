"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireUser } from "./require-user";
import { feePlanSchema } from "@/lib/validation/fee-plan";

export type ActionState = { error?: string; success?: boolean } | undefined;

const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE"] as const;

function parseFeePlanForm(formData: FormData) {
  return feePlanSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    frequency: formData.get("frequency"),
    isActive: formData.get("isActive") === "on",
    notes: formData.get("notes"),
  });
}

export async function createFeePlan(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...FINANCE_ROLES]);

  const parsed = parseFeePlanForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  await prisma.$transaction(async (tx) => {
    const plan = await tx.feePlan.create({ data: parsed.data });
    await logAudit(tx, {
      entityType: "FeePlan",
      entityId: plan.id,
      action: "created",
      newValue: parsed.data,
      userId: user.id,
    });
  });

  revalidatePath("/settings/fee-plans");
  return { success: true };
}

export async function updateFeePlan(
  feePlanId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...FINANCE_ROLES]);

  const parsed = parseFeePlanForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const before = await prisma.feePlan.findUnique({ where: { id: feePlanId } });
  if (!before) return { error: "Fee plan not found." };

  await prisma.$transaction(async (tx) => {
    await tx.feePlan.update({ where: { id: feePlanId }, data: parsed.data });
    await logAudit(tx, {
      entityType: "FeePlan",
      entityId: feePlanId,
      action: "updated",
      previousValue: before,
      newValue: parsed.data,
      userId: user.id,
    });
  });

  revalidatePath("/settings/fee-plans");
  return { success: true };
}
