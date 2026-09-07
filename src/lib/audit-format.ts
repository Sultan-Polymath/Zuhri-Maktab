const ACTION_LABELS: Record<string, string> = {
  created: "created a",
  updated: "updated a",
  deleted: "removed a",
  class_changed: "changed the class for a",
  class_removed: "removed a class assignment from a",
  password_reset: "reset the password for a",
  password_changed_self: "changed their own password",
  deactivated: "deactivated a",
  activated: "reactivated a",
};

const ENTITY_LABELS: Record<string, string> = {
  Family: "family",
  Guardian: "guardian",
  Student: "student",
  Class: "class",
  Teacher: "teacher",
  User: "user",
};

export function formatAuditEntry(entry: {
  entityType: string;
  action: string;
}): string {
  const actionLabel = ACTION_LABELS[entry.action] ?? entry.action.replace(/_/g, " ");
  if (entry.action === "password_changed_self") return actionLabel;
  const entityLabel = ENTITY_LABELS[entry.entityType] ?? entry.entityType.toLowerCase();
  return `${actionLabel} ${entityLabel}`;
}
