import type { UserRole } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  GraduationCap,
  UserRound,
  ClipboardCheck,
  BookOpen,
  Wallet,
  FileBarChart,
  Settings,
  History,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Omit to allow every authenticated role. */
  roles?: UserRole[];
};

const STAFF: UserRole[] = ["SUPER_ADMIN", "ADMIN", "FINANCE"];
const OPERATIONS: UserRole[] = ["SUPER_ADMIN", "ADMIN", "TEACHER"];

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Families", href: "/families", icon: UsersRound, roles: STAFF },
  { label: "Classes", href: "/classes", icon: GraduationCap, roles: OPERATIONS },
  { label: "Teachers", href: "/teachers", icon: UserRound, roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck, roles: OPERATIONS },
  { label: "Progress", href: "/progress", icon: BookOpen, roles: OPERATIONS },
  { label: "Fees & Finance", href: "/fees", icon: Wallet, roles: STAFF },
  { label: "Reports", href: "/reports", icon: FileBarChart, roles: STAFF },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Audit Log", href: "/audit-log", icon: History, roles: ["SUPER_ADMIN", "ADMIN"] },
];

export function visibleNavItems(role: UserRole): NavItem[] {
  return navItems.filter((item) => !item.roles || item.roles.includes(role));
}
