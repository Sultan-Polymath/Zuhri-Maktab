"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { nextStudentCode } from "@/lib/student-code";
import { recalcInvoice } from "@/lib/invoice-calc";
import { requireUser } from "./require-user";
import { familySchema, guardianSchema } from "@/lib/validation/family";
import { childSchema } from "@/lib/validation/student";

export type ActionState = { error?: string } | undefined;

const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE"] as const;

function parseChild(formData: FormData, key: string) {
  return childSchema.safeParse({
    firstName: formData.get(`child_${key}_firstName`),
    middleName: formData.get(`child_${key}_middleName`),
    lastName: formData.get(`child_${key}_lastName`),
    preferredName: formData.get(`child_${key}_preferredName`),
    dob: formData.get(`child_${key}_dob`),
    gender: formData.get(`child_${key}_gender`),
    medicalInfo: formData.get(`child_${key}_medicalInfo`),
    status: formData.get(`child_${key}_status`) || "ENQUIRY",
  });
}

export async function enrolFamily(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser([...STAFF_ROLES]);

  const familyMode = formData.get("familyMode") === "new" ? "new" : "existing";

  let familyId: string | undefined;
  let newFamilyData: ReturnType<typeof familySchema.safeParse> | undefined;
  let newGuardianData: ReturnType<typeof guardianSchema.safeParse> | undefined;

  if (familyMode === "existing") {
    familyId = String(formData.get("familyId") ?? "");
    if (!familyId) return { error: "Select a family, or switch to “New family”." };
    const family = await prisma.family.findUnique({ where: { id: familyId } });
    if (!family) return { error: "Selected family not found." };
  } else {
    newFamilyData = familySchema.safeParse({
      surnameLabel: formData.get("surnameLabel"),
      addressLine1: formData.get("addressLine1"),
      addressLine2: formData.get("addressLine2"),
      city: formData.get("city"),
      postcode: formData.get("postcode"),
    });
    if (!newFamilyData.success) {
      return { error: newFamilyData.error.issues[0]?.message ?? "Please check the family details." };
    }
    newGuardianData = guardianSchema.safeParse({
      name: formData.get("guardianName"),
      relationship: formData.get("guardianRelationship"),
      phone: formData.get("guardianPhone"),
      secondaryPhone: formData.get("guardianSecondaryPhone"),
      email: formData.get("guardianEmail"),
      isPrimaryContact: true,
      isEmergencyContact: formData.get("guardianIsEmergencyContact") === "on",
      preferredContactMethod: formData.get("guardianPreferredContactMethod") || "PHONE",
    });
    if (!newGuardianData.success) {
      return { error: newGuardianData.error.issues[0]?.message ?? "Please check the guardian details." };
    }
  }

  const childKeys = String(formData.get("childKeys") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  if (childKeys.length === 0) return { error: "Add at least one child." };

  const children: { key: string; data: ReturnType<typeof childSchema.parse> }[] = [];
  for (const key of childKeys) {
    const parsed = parseChild(formData, key);
    if (!parsed.success) {
      return {
        error: `Child ${children.length + 1}: ${parsed.error.issues[0]?.message ?? "please check the details."}`,
      };
    }
    children.push({ key, data: parsed.data });
  }

  const feePlanId = String(formData.get("feePlanId") ?? "").trim() || undefined;
  const customAmountRaw = String(formData.get("customAmount") ?? "").trim();
  const customAmount = customAmountRaw ? Number(customAmountRaw) : undefined;
  if (customAmountRaw && (Number.isNaN(customAmount) || customAmount! <= 0)) {
    return { error: "Custom fee amount must be a positive number." };
  }
  let feePlan = null;
  if (feePlanId) {
    feePlan = await prisma.feePlan.findUnique({ where: { id: feePlanId } });
    if (!feePlan) return { error: "Selected fee plan not found." };
  }

  const studentIds = await prisma.$transaction(async (tx) => {
    let resolvedFamilyId = familyId;

    if (familyMode === "new" && newFamilyData?.success && newGuardianData?.success) {
      const family = await tx.family.create({ data: newFamilyData.data });
      await tx.guardian.create({
        data: { ...newGuardianData.data, isPrimaryContact: true, familyId: family.id },
      });
      await logAudit(tx, {
        entityType: "Family",
        entityId: family.id,
        action: "created",
        newValue: newFamilyData.data,
        userId: user.id,
      });
      resolvedFamilyId = family.id;
    }

    if (!resolvedFamilyId) throw new Error("Family could not be resolved.");

    const ids: string[] = [];
    for (const child of children) {
      const { seq, code } = await nextStudentCode(tx);
      const student = await tx.student.create({
        data: {
          ...child.data,
          familyId: resolvedFamilyId,
          dob: new Date(child.data.dob),
          studentSeq: seq,
          studentCode: code,
          dateEnrolled: child.data.status === "ACTIVE" ? new Date() : null,
        },
      });
      ids.push(student.id);

      if (feePlanId && feePlan) {
        const assignment = await tx.studentFeePlan.create({
          data: { studentId: student.id, feePlanId, customAmount },
        });

        // Seed the first invoice for the current month so the balance owed
        // and due date show up immediately. For termly/annual plans this is
        // just a starting point — adjust the period from the student's Fees
        // card afterwards if needed.
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const periodStart = new Date(Date.UTC(y, m, 1));
        const periodEnd = new Date(Date.UTC(y, m + 1, 0));
        const dueDate = new Date(Date.UTC(y, m, 7));
        const grossAmount = customAmount ?? feePlan.amount;

        const invoice = await tx.invoice.create({
          data: {
            studentId: student.id,
            studentFeePlanId: assignment.id,
            periodLabel: now.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
            periodStart,
            periodEnd,
            grossAmount,
            amountDue: grossAmount,
            dueDate,
          },
        });
        await recalcInvoice(tx, invoice.id);
      }

      await logAudit(tx, {
        entityType: "Student",
        entityId: student.id,
        action: "created",
        newValue: { ...child.data, familyId: resolvedFamilyId, studentCode: code },
        userId: user.id,
      });
    }

    return { ids, familyId: resolvedFamilyId };
  });

  revalidatePath("/students");
  revalidatePath(`/families/${studentIds.familyId}`);

  if (studentIds.ids.length === 1) {
    redirect(`/students/${studentIds.ids[0]}`);
  }
  redirect(`/families/${studentIds.familyId}`);
}
