"use client";

import { useActionState, useState, useTransition } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@prisma/client";
import { updateUser, resetUserPassword } from "@/lib/actions/users";
import { userRoleOptions } from "@/lib/validation/user";
import { Field, FormError } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ROLE_LABELS: Record<(typeof userRoleOptions)[number], string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  FINANCE: "Finance",
  TEACHER: "Teacher",
};

export function UserEditForm({ user }: { user: User }) {
  const action = updateUser.bind(null, user.id);
  const [state, formAction, isPending] = useActionState(action, undefined);

  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isResetting, startReset] = useTransition();

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        <FormError message={state?.error} />
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name" required>
              <Input id="name" name="name" defaultValue={user.name} required />
            </Field>
            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                required
              />
            </Field>
            <Field label="Role" htmlFor="role" required>
              <NativeSelect id="role" name="role" defaultValue={user.role}>
                {userRoleOptions.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <div className="flex items-center gap-2 self-end pb-1">
              <Checkbox id="isActive" name="isActive" defaultChecked={user.isActive} />
              <Label htmlFor="isActive" className="font-normal">
                Active (can sign in)
              </Label>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tempPassword ? (
            <>
              <p className="text-sm text-muted-foreground">
                Share this new temporary password with them directly — it
                won&apos;t be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm">
                  {tempPassword}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(tempPassword);
                    toast.success("Copied to clipboard");
                  }}
                >
                  <Copy />
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Generate a new temporary password if this person has
                forgotten theirs.
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={isResetting}
                onClick={() => {
                  startReset(async () => {
                    const result = await resetUserPassword(user.id);
                    if (result?.error) {
                      toast.error(result.error);
                    } else if (result?.tempPassword) {
                      setTempPassword(result.tempPassword);
                    }
                  });
                }}
              >
                {isResetting ? "Resetting…" : "Reset password"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
