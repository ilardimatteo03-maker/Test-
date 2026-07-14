"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";

export function Nav() {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#fonctionnement", label: "Comment ça marche" },
    { href: "#avantages", label: "Avantages" },
    { href: "#tarifs", label: "Tarifs" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-lg">
      <nav className="container-page flex h-16 items-center justify-between">
        <Logo />
        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Button href="/login" variant="ghost" size="sm">
            Se connecter
          </Button>
          <Button href="/signup" size="sm">
            Essai gratuit
          </Button>
        </div>
        <button
          className="rounded-lg p-2 text-slate-600 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-slate-100 bg-white px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Button href="/login" variant="secondary" full>
                Se connecter
              </Button>
              <Button href="/signup" full>
                Essai gratuit
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
