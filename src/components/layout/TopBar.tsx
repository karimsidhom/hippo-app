"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { Avatar } from "@/components/ui/avatar";
import { Menu, Plus, Bell, ChevronDown, Settings, User, LogOut } from "lucide-react";
import Link from "next/link";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/log": "Log a Case",
  "/cases": "Case History",
  "/analytics": "Analytics",
  "/benchmarks": "Benchmarks",
  "/leaderboard": "Leaderboard",
  "/social": "Social",
  "/profile": "Profile",
  "/settings": "Settings",
};

interface TopBarProps {
  onMenuToggle: () => void;
  onQuickAdd: () => void;
}

export function TopBar({ onMenuToggle, onQuickAdd }: TopBarProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const title = PAGE_TITLES[pathname] || "Hippo";

  const notifications = [
    { id: "1", text: "You earned a new milestone: 20 RARP cases!", time: "2 days ago", unread: true },
    { id: "2", text: "Dr. S. Kim sent you a friend request", time: "5 days ago", unread: true },
    { id: "3", text: "Your 30-day streak is active!", time: "1 week ago", unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="h-16 bg-[#0d0d14]/90 backdrop-blur-sm border-b border-[#1e2130] flex items-center justify-between px-4 md:px-6 flex-shrink-0 sticky top-0 z-20">
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#16161f] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-[#f1f5f9] font-semibold text-base md:text-lg">{title}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Add */}
        <button
          onClick={onQuickAdd}
          className="hidden sm:flex items-center gap-2 px-3 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium rounded-lg transition-all active:scale-95 shadow-glow-blue"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">Quick Log</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotificationsOpen(!notificationsOpen); setUserMenuOpen(false); }}
            className="relative p-2 rounded-lg text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#16161f] transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#ef4444] rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#111118] border border-[#252838] rounded-xl shadow-card-hover z-50 animate-slide-down">
              <div className="p-3 border-b border-[#1e2130]">
                <p className="font-semibold text-[#f1f5f9] text-sm">Notifications</p>
              </div>
              <div className="divide-y divide-[#1e2130]">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-3 hover:bg-[#16161f] transition-colors cursor-pointer ${n.unread ? "border-l-2 border-[#2563eb]" : ""}`}>
                    <p className={`text-xs ${n.unread ? "text-[#f1f5f9]" : "text-[#94a3b8]"}`}>{n.text}</p>
                    <p className="text-xs text-[#64748b] mt-0.5">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotificationsOpen(false); }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#16161f] transition-colors"
          >
            <Avatar src={undefined} name={user?.name} size="sm" />
            <ChevronDown className="w-3 h-3 text-[#64748b] hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#111118] border border-[#252838] rounded-xl shadow-card-hover z-50 animate-slide-down overflow-hidden">
              <div className="p-3 border-b border-[#1e2130]">
                <p className="text-sm font-medium text-[#f1f5f9] truncate">{user?.name || "Surgeon"}</p>
                <p className="text-xs text-[#64748b] truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#16161f] transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#16161f] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#ef4444] hover:bg-[#16161f] transition-colors"
                  onClick={() => {
                    setUserMenuOpen(false);
                    if (confirm("Sign out?")) window.location.href = "/";
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Close dropdowns when clicking outside */}
      {(notificationsOpen || userMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setNotificationsOpen(false); setUserMenuOpen(false); }}
        />
      )}
    </header>
  );
}
