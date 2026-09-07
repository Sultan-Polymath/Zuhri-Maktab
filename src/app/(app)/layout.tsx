import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { visibleNavItems } from "@/lib/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { name, email, role } = session.user;

  return (
    <AppShell
      items={visibleNavItems(role)}
      user={{ name: name ?? "Unknown", email: email ?? "", role }}
    >
      {children}
    </AppShell>
  );
}
