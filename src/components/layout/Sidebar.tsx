"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useSubscription } from "@/context/SubscriptionContext";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/ui/avatar";
import {
  LayoutDashboard, FilePlus, ClipboardList, BarChart2, Trophy,
  Users, User, Settings, ChevronLeft, ChevronRight, Plus, TrendingUp, Zap, LogOut
} from "lucide-react";
import { HippoMark } from "@/components/HippoMark";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/log", label: "Log Case", icon: FilePlus },
  { href: "/cases", label: "Case History", icon: ClipboardList },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/benchmarks", label: "Benchmarks", icon: TrendingUp },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/social", label: "Social", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onQuickAdd: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, onQuickAdd }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useUser();
  const { isFree } = useSubscription();
  const { logout } = useAuth();
  const isPro = !isFree;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="h-full flex flex-col bg-[#0d0d14] border-r border-[#1e2130]">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-[#1e2130] flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <HippoMark size={30} />
            <div>
              <p className="font-bold text-[#f1f5f9] text-sm leading-none">Hippo</p>
              <p className="text-[10px] text-[#0EA5E9] font-medium mt-0.5">Track mastery. Share growth.</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <HippoMark size={28} />
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-[#64748b] hover:text-[#94a3b8] hover:bg-[#16161f] transition-colors hidden md:flex"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Add Button */}
      <div className="px-3 pt-3 pb-1 flex-shrink-0">
        <button
          onClick={onQuickAdd}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium rounded-xl transition-all active:scale-95 shadow-glow-blue ${collapsed ? "justify-center" : ""}`}
          title="Quick Add Case"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Quick Log</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                isActive
                  ? "bg-[#1a1a2e] text-[#f1f5f9] border-l-2 border-[#2563eb] pl-[10px]"
                  : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#16161f]"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? label : undefined}
            >
              <Icon
                className={`flex-shrink-0 transition-colors ${
                  isActive ? "text-[#2563eb]" : "text-[#64748b] group-hover:text-[#94a3b8]"
                } ${collapsed ? "w-5 h-5" : "w-4 h-4"}`}
              />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Pro Upgrade CTA (free tier) */}
      {!isPro && !collapsed && (
        <div className="mx-3 mb-3 p-3 bg-[#16161f] border border-[#1e2130] rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-[#f59e0b]" />
            <span className="text-xs font-semibold text-[#f1f5f9]">Upgrade to Pro</span>
          </div>
          <p className="text-xs text-[#64748b] mb-2.5 leading-relaxed">
            Unlock unlimited logging, exports, percentile benchmarks & more
          </p>
          <button className="w-full py-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-black text-xs font-semibold rounded-lg transition-colors">
            Upgrade Now
          </button>
        </div>
      )}

      {/* User Info + Logout */}
      <div className={`border-t border-[#1e2130] px-3 py-3 flex items-center gap-3 flex-shrink-0 ${collapsed ? "justify-center flex-col" : ""}`}>
        <Avatar src={undefined} name={user?.name} size="sm" online />
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#f1f5f9] truncate">
              {user?.name || "Surgeon"}
            </p>
            <p className="text-xs text-[#64748b] truncate">
              {profile?.trainingYearLabel || "Resident"} · {isPro ? "Pro" : "Free"}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          title="Log out"
          className="p-1.5 rounded-lg text-[#64748b] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all flex-shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
