"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  Gift,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Avatar, Badge } from "@/components/ui";
import { currentMerchant, logout } from "@/lib/store";
import { useStoreVersion } from "@/lib/useStore";
import { avatarColor } from "@/lib/format";
import type { Merchant } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/rewards", label: "Carte & récompense", icon: Gift },
  { href: "/dashboard/settings", label: "Compte", icon: Settings },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  useStoreVersion();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Garde d'authentification (démo : session en localStorage).
  useEffect(() => {
    const m = currentMerchant();
    if (!m) {
      router.replace("/login");
      return;
    }
    setMerchant(m);
    setReady(true);
  }, [router, pathname]);

  if (!ready || !merchant) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
      </div>
    );
  }

  function onLogout() {
    logout();
    router.replace("/login");
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-ink"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <Avatar name={merchant.ownerName || merchant.shopName} colorClass={avatarColor(merchant.id)} size={38} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{merchant.shopName}</p>
            <p className="truncate text-xs text-slate-400">{merchant.email}</p>
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between px-3 py-1">
          <Badge color={merchant.plan === "pro" ? "brand" : "slate"}>
            {merchant.plan === "pro" ? "Plan Pro" : "Plan Gratuit"}
          </Badge>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
            Quitter
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        {sidebar}
      </aside>

      {/* Topbar mobile */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Logo />
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-600"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-card">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-2 text-slate-500"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      {/* Contenu */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
