/** True only once the due date's calendar day has fully passed — a fee due today isn't overdue yet. */
export function isOverdue(dueDate: Date, now: Date = new Date()): boolean {
  const dueMidnight = Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate());
  const todayMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return todayMidnight > dueMidnight;
}

export function daysOverdue(dueDate: Date, now: Date = new Date()): number {
  const dueMidnight = Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate());
  const todayMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.floor((todayMidnight - dueMidnight) / (1000 * 60 * 60 * 24)));
}
