"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Package, Star, AlertTriangle } from "lucide-react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  order_confirmed: Package,
  order_shipped: Package,
  order_delivered: Package,
  new_review: Star,
  low_stock: AlertTriangle,
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 h-4 w-4 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-bold"
            aria-hidden="true"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-brand-500 hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={() => markAsRead(n.id)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification: n,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const Icon = ICON_MAP[n.type] ?? Bell;

  return (
    <button
      onClick={onRead}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-0",
        !n.read && "bg-brand-50/50 dark:bg-brand-900/10"
      )}
    >
      <div
        className={cn(
          "p-1.5 rounded-lg shrink-0 mt-0.5",
          !n.read ? "bg-brand-100 dark:bg-brand-900/30" : "bg-muted"
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", !n.read ? "text-brand-500" : "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", !n.read && "font-medium")}>{n.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDate(new Date(n.createdAt))}
        </p>
      </div>
      {!n.read && (
        <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" aria-hidden="true" />
      )}
    </button>
  );
}
