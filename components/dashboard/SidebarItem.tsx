import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
}

export default function SidebarItem({
  href,
  icon: Icon,
  label,
  active = false,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-blue-600 text-white shadow-lg"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
}