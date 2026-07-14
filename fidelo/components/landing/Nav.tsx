"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { clsx } from "clsx";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";

const links = [
  { href: "#fonctionnement", label: "Comment ça marche" },
  { href: "#avantages", label: "Avantages" },
  { href: "#tarifs", label: "Tarifs" },
];

// Nav « fluid island » : pill flottante en verre, détachée du haut (soft-skill).
export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 pointer-events-none">
      <div className="container-page">
        <nav
          className={clsx(
            "pointer-events-auto mx-auto mt-4 flex items-center justify-between gap-6 rounded-full px-3 py-2 pl-5 transition-all duration-500 ease-spring",
            scrolled
              ? "border border-slate-200/70 bg-white/80 shadow-soft backdrop-blur-xl"
              : "border border-transparent bg-white/40 backdrop-blur-md"
          )}
        >
          <Logo />
          <div className="hidden items-center gap-7 md:flex">
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
            className="rounded-full p-2 text-slate-700 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </div>

      {/* Overlay mobile plein écran (staggered reveal) */}
      {open && (
        <div className="pointer-events-auto fixed inset-0 z-50 bg-white/85 backdrop-blur-2xl md:hidden">
          <div className="container-page flex h-16 items-center justify-between pt-4">
            <Logo />
            <button
              className="rounded-full p-2 text-slate-700"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="container-page mt-8 flex flex-col gap-2">
            {links.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="reveal is-in text-2xl font-semibold tracking-tight text-ink"
                style={{ transitionDelay: `${80 + i * 60}ms` }}
              >
                {l.label}
              </a>
            ))}
            <div className="mt-8 flex flex-col gap-3">
              <Button href="/login" variant="secondary" full size="lg">
                Se connecter
              </Button>
              <Button href="/signup" full size="lg" arrow>
                Essai gratuit
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
