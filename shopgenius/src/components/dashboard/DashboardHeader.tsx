"use client";

import { Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function DashboardHeader() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-end px-6 gap-3">
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
        className="p-2 rounded-lg hover:bg-muted transition-colors"
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <button
        aria-label="Notifications"
        className="p-2 rounded-lg hover:bg-muted transition-colors relative"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500" aria-hidden="true" />
      </button>
    </header>
  );
}
