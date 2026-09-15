"use client";

import { useState, useTransition } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { createTeacherPinLogin, resetTeacherPin } from "@/lib/actions/teachers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TeacherPinLoginCard({
  teacherId,
  hasLogin,
}: {
  teacherId: string;
  hasLogin: boolean;
}) {
  const [pin, setPin] = useState<string | null>(null);
  const [loginExists, setLoginExists] = useState(hasLogin);
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<{ error?: string; pin?: string } | undefined>) => {
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.pin) {
        setPin(result.pin);
        setLoginExists(true);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">PIN Login</CardTitle>
        <CardDescription>
          Lets this teacher sign in on the Teacher Login screen with just their
          name and a 6-digit PIN — no email or password to remember.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pin ? (
          <>
            <p className="text-sm text-muted-foreground">
              Share this PIN with them directly — it won&apos;t be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2 text-lg tracking-widest">
                {pin}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(pin);
                  toast.success("Copied to clipboard");
                }}
              >
                <Copy />
              </Button>
            </div>
          </>
        ) : loginExists ? (
          <>
            <p className="text-sm text-muted-foreground">
              This teacher already has a PIN login. Reset it if they&apos;ve
              forgotten it.
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => run(() => resetTeacherPin(teacherId))}
            >
              {isPending ? "Resetting…" : "Reset PIN"}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => run(() => createTeacherPinLogin(teacherId))}
          >
            {isPending ? "Creating…" : "Create PIN login"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
