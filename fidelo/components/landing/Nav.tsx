"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { clsx } from "clsx";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";

const links = [
  { href: "#fonctionnement", label: "Fonctionnalités" },
  { href: "#resultats", label: "Résultats" },
  { href: "#tarifs", label: "Tarifs" },
];

// Barre de navigation blanche solide, minimaliste — style ASM.
export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 border-b bg-white transition-shadow",
        scrolled ? "border-slate-200 shadow-soft" : "border-slate-100"
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between">
        <Logo size="sm" />
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
            Démarrer
          </Button>
        </div>
        <button
          className="rounded-lg p-2 text-slate-700 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-700 hover:bg-slate-50"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Button href="/login" variant="secondary" full>
                Se connecter
              </Button>
              <Button href="/signup" full>
                Démarrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
