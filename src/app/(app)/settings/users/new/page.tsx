import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { UserNewForm } from "./user-new-form";

export default async function NewUserPage() {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/settings");

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Add User"
        description="Create a staff or teacher account. A temporary password is generated for you to share with them."
      />
      <UserNewForm />
    </div>
  );
}
