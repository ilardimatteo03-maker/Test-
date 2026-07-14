"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  forwardRef,
} from "react";

/* ---------------- Button ---------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";
type ButtonSize = "sm" | "md" | "lg";

// Boutons pill, hover magnétique + ressort (soft-skill) — signature ASM.
const btnBase =
  "group/btn inline-flex items-center justify-center gap-2 font-semibold rounded-full border-2 border-transparent transition-all duration-300 ease-spring focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap active:scale-[0.98]";

const btnVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-500 text-white border-brand-500 hover:bg-brand-600 hover:border-brand-600 hover:-translate-y-0.5 hover:shadow-glow",
  secondary:
    "bg-white text-ink border-slate-200 hover:border-brand-300 hover:-translate-y-0.5 hover:shadow-soft",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-ink",
  dark: "bg-ink text-white border-ink hover:bg-ink-soft hover:border-ink-soft hover:-translate-y-0.5 hover:shadow-float",
};

// Taille de texte uniquement — le padding est géré selon `arrow` plus bas.
const btnText: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-[15px]",
  lg: "text-base",
};

// Padding sans flèche / avec flèche (l'icône occupe la droite).
const padPlain: Record<ButtonSize, string> = {
  sm: "px-4 py-2",
  md: "px-5 py-2.5",
  lg: "px-7 py-3.5",
};
const padArrow: Record<ButtonSize, string> = {
  sm: "pl-4 pr-1.5 py-1.5",
  md: "pl-5 pr-1.5 py-1.5",
  lg: "pl-7 pr-2 py-2",
};

// Cercle imbriqué de l'icône (button-in-button) — teinte selon la variante.
const iconWrap: Record<ButtonVariant, string> = {
  primary: "bg-white/15 text-white",
  secondary: "bg-brand-50 text-brand-600",
  ghost: "bg-slate-100 text-ink",
  dark: "bg-white/15 text-white",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  full?: boolean;
  /** Affiche une flèche dans un cercle imbriqué (CTA premium). */
  arrow?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  href,
  full,
  arrow,
  className,
  children,
  ...props
}: ButtonProps) {
  const cls = clsx(
    btnBase,
    btnVariants[variant],
    btnText[size],
    arrow ? padArrow[size] : padPlain[size],
    full && "w-full",
    className
  );
  const content = (
    <>
      {arrow ? <span className="pr-0.5">{children}</span> : children}
      {arrow && (
        <span
          className={clsx(
            "grid shrink-0 place-items-center rounded-full transition-transform duration-300 ease-spring",
            size === "lg" ? "h-9 w-9" : "h-7 w-7",
            "group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 group-hover/btn:scale-105",
            iconWrap[variant]
          )}
        >
          <ArrowUpRight
            className={size === "lg" ? "h-[18px] w-[18px]" : "h-4 w-4"}
            strokeWidth={2.25}
          />
        </span>
      )}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button className={cls} {...props}>
      {content}
    </button>
  );
}

/* ---------------- Card ---------------- */

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-200/80 bg-white shadow-soft",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ---------------- Input ---------------- */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, className, id, ...props }, ref) => {
    return (
      <label className="block">
        {label && (
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-ink placeholder:text-slate-400",
            "transition-all focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100",
            className
          )}
          {...props}
        />
        {hint && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}
      </label>
    );
  }
);
Input.displayName = "Input";

/* ---------------- Badge ---------------- */

export function Badge({
  children,
  color = "brand",
}: {
  children: ReactNode;
  color?: "brand" | "green" | "slate" | "amber";
}) {
  const colors = {
    brand: "bg-brand-50 text-brand-700 ring-brand-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        colors[color]
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- Avatar ---------------- */

export function Avatar({
  name,
  colorClass,
  size = 40,
}: {
  name: string;
  colorClass: string;
  size?: number;
}) {
  const inits = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        colorClass
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {inits}
    </span>
  );
}

/* ---------------- Modal ---------------- */

export function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md animate-fade-up rounded-t-3xl bg-white p-6 shadow-card sm:rounded-3xl">
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink"
              aria-label="Fermer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ---------------- Eyebrow (label de section ASM) ---------------- */

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

/* ---------------- Section heading ---------------- */

export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
