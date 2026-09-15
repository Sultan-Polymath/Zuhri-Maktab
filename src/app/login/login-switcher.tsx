"use client";

import { useState } from "react";
import { LoginForm } from "./login-form";
import { TeacherLoginForm } from "./teacher-login-form";
import { Button } from "@/components/ui/button";

export function LoginSwitcher({ teachers }: { teachers: { id: string; name: string }[] }) {
  const [mode, setMode] = useState<"teacher" | "staff">("teacher");

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      {mode === "teacher" ? <TeacherLoginForm teachers={teachers} /> : <LoginForm />}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setMode(mode === "teacher" ? "staff" : "teacher")}
      >
        {mode === "teacher" ? "Staff login instead" : "Teacher login instead"}
      </Button>
    </div>
  );
}
