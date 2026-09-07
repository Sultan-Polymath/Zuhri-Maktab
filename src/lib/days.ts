export const DAY_LABELS: Record<string, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

export function formatDays(days: string[]): string {
  if (days.length === 0) return "No days set";
  return days.map((d) => DAY_LABELS[d] ?? d).join(", ");
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime}–${endTime}`;
}
