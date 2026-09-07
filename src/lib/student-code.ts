import type { Prisma } from "@prisma/client";

/**
 * Reserves the next value of the Student.studentSeq sequence and formats it
 * as a student code. Must be called inside the same transaction that creates
 * the Student row, passing the returned seq/code into that create() call —
 * this avoids ever inserting a placeholder studentCode that could collide
 * under concurrent enrolments.
 */
export async function nextStudentCode(
  tx: Prisma.TransactionClient,
): Promise<{ seq: number; code: string }> {
  const [{ nextval }] = await tx.$queryRaw<
    [{ nextval: bigint }]
  >`SELECT nextval('"Student_studentSeq_seq"') as nextval`;
  const seq = Number(nextval);
  return { seq, code: `MKT-${String(seq).padStart(5, "0")}` };
}
