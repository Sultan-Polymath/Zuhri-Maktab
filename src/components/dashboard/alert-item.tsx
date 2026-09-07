import Link from "next/link";
import { TriangleAlert } from "lucide-react";

export function AlertItem({
  children,
  href,
}: {
  children: React.ReactNode;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-2 text-sm">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500" />
      <span className={href ? "hover:underline" : undefined}>{children}</span>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
