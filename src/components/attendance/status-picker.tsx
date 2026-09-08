"use client";

import { cn } from "@/lib/utils";

const OPTIONS: { value: string; label: string; activeClass: string }[] = [
  {
    value: "PRESENT",
    label: "Present",
    activeClass: "has-checked:bg-secondary has-checked:text-secondary-foreground",
  },
  {
    value: "ABSENT",
    label: "Absent",
    activeClass: "has-checked:bg-destructive/15 has-checked:text-destructive",
  },
  {
    value: "LATE",
    label: "Late",
    activeClass: "has-checked:bg-amber-500/20 has-checked:text-amber-700 dark:has-checked:text-amber-400",
  },
  {
    value: "EXCUSED",
    label: "Excused",
    activeClass: "has-checked:bg-muted has-checked:text-foreground",
  },
];

export function StatusPicker({
  studentId,
  defaultValue,
}: {
  studentId: string;
  defaultValue: string;
}) {
  const name = `status-${studentId}`;

  return (
    <div className="grid w-full grid-cols-4 gap-1 rounded-lg border p-1 sm:w-auto">
      {OPTIONS.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex min-h-11 min-w-16 cursor-pointer items-center justify-center rounded-md px-2 py-2.5 text-center text-sm font-medium text-muted-foreground transition-colors has-checked:shadow-sm",
            option.activeClass,
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            defaultChecked={defaultValue === option.value}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
