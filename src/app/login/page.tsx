import { prisma } from "@/lib/prisma";
import { LoginSwitcher } from "./login-switcher";

export default async function LoginPage() {
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER", isActive: true, pinHash: { not: null } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <LoginSwitcher teachers={teachers} />
    </div>
  );
}
