"use client";

import { useActionState, useState } from "react";
import { authenticateWithPin } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TeacherLoginForm({ teachers }: { teachers: { id: string; name: string }[] }) {
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const action = authenticateWithPin.bind(null, selected?.id ?? "");
  const [errorMessage, formAction, isPending] = useActionState(action, undefined);

  if (!selected) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Zuhri Maktab</CardTitle>
          <CardDescription>Tap your name to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          {teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No teacher logins have been set up yet. Ask an admin to create one.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {teachers.map((teacher) => (
                <Button
                  key={teacher.id}
                  type="button"
                  variant="outline"
                  className="h-11"
                  onClick={() => setSelected(teacher)}
                >
                  {teacher.name}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">{selected.name}</CardTitle>
        <CardDescription>Enter your 6-digit PIN.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              autoComplete="one-time-code"
              className="h-11 text-center text-2xl tracking-[0.5em]"
              required
            />
          </div>
          {errorMessage && (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          )}
          <Button type="submit" className="h-11 w-full" disabled={isPending}>
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full"
            onClick={() => setSelected(null)}
          >
            Not you? Pick again
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
