"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { createUser } from "@/lib/actions/users";
import { userRoleOptions } from "@/lib/validation/user";
import { Field, FormError } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ROLE_LABELS: Record<(typeof userRoleOptions)[number], string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  FINANCE: "Finance",
  TEACHER: "Teacher",
};

export function UserNewForm() {
  const [state, formAction, isPending] = useActionState(createUser, undefined);

  if (state?.tempPassword) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">User created</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share this temporary password with them directly — it won&apos;t be
            shown again. They can change it after signing in.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm">
              {state.tempPassword}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(state.tempPassword!);
                toast.success("Copied to clipboard");
              }}
            >
              <Copy />
            </Button>
          </div>
          <Button nativeButton={false} render={<Link href="/settings/users" />}>
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state?.error} />
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" required>
            <Input id="name" name="name" required />
          </Field>
          <Field label="Email" htmlFor="email" required>
            <Input id="email" name="email" type="email" required />
          </Field>
          <Field label="Role" htmlFor="role" required>
            <NativeSelect id="role" name="role" defaultValue="TEACHER">
              {userRoleOptions.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create user"}
        </Button>
      </div>
    </form>
  );
}
