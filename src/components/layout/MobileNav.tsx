"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FilePlus, ClipboardList, BarChart2, Users, Plus
} from "lucide-react";

const MOBILE_NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/cases", label: "Cases", icon: ClipboardList },
  { href: "/log", label: "Log", icon: FilePlus, isCenter: true },
  { href: "/analytics", label: "Stats", icon: BarChart2 },
  { href: "/social", label: "Social", icon: Users },
];

interface MobileNavProps {
  onQuickAdd: () => void;
}

export function MobileNav({ onQuickAdd }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-[#0d0d14]/95 backdrop-blur-md border-t border-[#1e2130] safe-area-pb">
      <div className="flex items-center justify-around px-2 h-16">
        {MOBILE_NAV.map(({ href, label, icon: Icon, isCenter }) => {
          const isActive = pathname === href;

          if (isCenter) {
            return (
              <button
                key={href}
                onClick={onQuickAdd}
                className="relative -top-4 w-14 h-14 bg-[#2563eb] hover:bg-[#1d4ed8] rounded-2xl flex flex-col items-center justify-center shadow-glow-blue transition-all active:scale-95"
              >
                <Plus className="w-6 h-6 text-white" />
              </button>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
                isActive ? "text-[#2563eb]" : "text-[#64748b]"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-[#2563eb]" : ""}`} />
              <span className={`text-[10px] font-medium ${isActive ? "text-[#2563eb]" : "text-[#64748b]"}`}>
                {label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-1 h-1 bg-[#2563eb] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
