import { cn } from "@/lib/utils";

export function OccupancyBadge({
  current,
  capacity,
}: {
  current: number;
  capacity: number;
}) {
  const ratio = capacity > 0 ? current / capacity : 0;
  const isFull = current >= capacity;
  const isNearFull = !isFull && ratio >= 0.85;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        isFull
          ? "bg-destructive/10 text-destructive"
          : isNearFull
            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
            : "bg-secondary text-secondary-foreground",
      )}
    >
      {current} / {capacity}
    </span>
  );
}
