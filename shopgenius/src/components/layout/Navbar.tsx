"use client";

import Link from "next/link";
import { ShoppingCart, User, Sun, Moon, Store } from "lucide-react";
import { useTheme } from "next-themes";
import { useCartStore } from "@/store/cart";
import { NotificationBell } from "./NotificationBell";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const totalItems = useCartStore((s) => s.totalItems());

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Store className="h-6 w-6 text-brand-500" />
          <span>ShopGenius</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">
            Products
          </Link>
          <Link href="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
            Categories
          </Link>
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            Sell
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* Cart */}
          <Link
            href="/cart"
            aria-label={`Cart with ${totalItems} items`}
            className="relative p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-medium">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          {/* Account */}
          <Link
            href="/auth/login"
            aria-label="Account"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
