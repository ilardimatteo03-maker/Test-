import Link from "next/link";
import { clsx } from "clsx";

// Wordmark officiel : « fidélo. » (minuscules, point bleu) + « by ASM. »
// en dessous à droite. Aucune icône — reproduction fidèle de la charte.
export function Logo({
  className,
  light = false,
  href = "/",
  size = "md",
}: {
  className?: string;
  light?: boolean;
  href?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const wordSize = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  }[size];
  const tagSize = {
    sm: "text-[8px]",
    md: "text-[10px]",
    lg: "text-sm",
  }[size];

  const inner = (
    <span className={clsx("inline-flex flex-col leading-none", className)}>
      <span
        className={clsx(
          "font-display font-extrabold lowercase tracking-tight",
          wordSize,
          light ? "text-white" : "text-ink"
        )}
      >
        fidélo<span className="text-brand-500">.</span>
      </span>
      <span
        className={clsx(
          "-mt-0.5 self-end font-semibold tracking-[0.1em]",
          tagSize,
          light ? "text-white/60" : "text-slate-500"
        )}
      >
        by ASM<span className="text-brand-500">.</span>
      </span>
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} aria-label="fidélo. by ASM.">
      {inner}
    </Link>
  );
}
