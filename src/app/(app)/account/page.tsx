import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { ChangePasswordForm } from "./change-password-form";

export default async function AccountPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="My Account"
        description={session?.user?.email ?? undefined}
      />
      <ChangePasswordForm />
    </div>
  );
}
