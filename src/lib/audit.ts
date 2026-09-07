import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export async function logAudit(
  db: Db,
  params: {
    entityType: string;
    entityId: string;
    action: string;
    previousValue?: unknown;
    newValue?: unknown;
    userId: string;
  },
) {
  await db.auditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      previousValue: params.previousValue as Prisma.InputJsonValue,
      newValue: params.newValue as Prisma.InputJsonValue,
      userId: params.userId,
    },
  });
}
