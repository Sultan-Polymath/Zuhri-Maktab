import { PrismaClient, FeeFrequency } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@maktab.local").toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists (${email}), skipping.`);
    return;
  }

  const password = process.env.SEED_ADMIN_PASSWORD ?? randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name: "Admin",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log("─".repeat(60));
  console.log("Created first admin account:");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log("Sign in and change this password as soon as possible.");
  console.log("─".repeat(60));
}

async function seedSubjects() {
  const subjects = [
    "Qaida",
    "Nazirah (Quran Reading)",
    "Tajweed",
    "Hifz",
    "Duas",
    "Salah",
    "Fiqh",
    "Aqeedah",
    "Islamic Studies",
    "Adab & Akhlaq",
  ];

  for (const [index, name] of subjects.entries()) {
    await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder: index },
    });
  }
  console.log(`Seeded ${subjects.length} subjects.`);
}

async function seedPaymentMethods() {
  const methods = ["Cash", "Bank Transfer", "Standing Order", "Card", "Other"];
  for (const [index, name] of methods.entries()) {
    await prisma.paymentMethod.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder: index },
    });
  }
  console.log(`Seeded ${methods.length} payment methods.`);
}

async function seedFeePlan() {
  const existing = await prisma.feePlan.findFirst({
    where: { name: "Standard Monthly" },
  });
  if (existing) {
    console.log("Default fee plan already exists, skipping.");
    return;
  }

  await prisma.feePlan.create({
    data: {
      name: "Standard Monthly",
      amount: 40,
      frequency: FeeFrequency.MONTHLY,
    },
  });
  console.log("Seeded default fee plan: Standard Monthly (£40).");
}

async function main() {
  await seedAdmin();
  await seedSubjects();
  await seedPaymentMethods();
  await seedFeePlan();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
