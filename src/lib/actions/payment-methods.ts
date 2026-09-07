"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireUser } from "./require-user";
import { paymentMethodSchema } from "@/lib/validation/payment-method";

export type ActionState = { error?: string } | undefined;

const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE"] as const;

export async function createPaymentMethod(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...FINANCE_ROLES]);

  const parsed = paymentMethodSchema.safeParse({
    name: formData.get("name"),
    isActive: true,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const existing = await prisma.paymentMethod.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) return { error: "A payment method with this name already exists." };

  await prisma.$transaction(async (tx) => {
    const maxOrder = await tx.paymentMethod.aggregate({ _max: { sortOrder: true } });
    const method = await tx.paymentMethod.create({
      data: { ...parsed.data, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
    });
    await logAudit(tx, {
      entityType: "PaymentMethod",
      entityId: method.id,
      action: "created",
      newValue: parsed.data,
      userId: user.id,
    });
  });

  revalidatePath("/settings/payment-methods");
}

export async function togglePaymentMethodActive(methodId: string): Promise<void> {
  const user = await requireUser([...FINANCE_ROLES]);

  const method = await prisma.paymentMethod.findUnique({ where: { id: methodId } });
  if (!method) return;

  await prisma.$transaction(async (tx) => {
    await tx.paymentMethod.update({
      where: { id: methodId },
      data: { isActive: !method.isActive },
    });
    await logAudit(tx, {
      entityType: "PaymentMethod",
      entityId: methodId,
      action: method.isActive ? "deactivated" : "activated",
      userId: user.id,
    });
  });

  revalidatePath("/settings/payment-methods");
}
