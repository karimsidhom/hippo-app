"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function WorkspaceThemeToggle() {
  const { resolved, setMode } = useTheme();
  const next = resolved === "light" ? "dark" : "light";
  const Icon = next === "dark" ? Moon : Sun;
  const label = `Switch to ${next} mode`;
  return (
    <button className="workspace-theme-toggle" type="button" aria-label={label} title={label}
      onClick={() => setMode(next)}><Icon size={18} aria-hidden="true" /></button>
  );
}
