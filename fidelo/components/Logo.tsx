import Link from "next/link";
import { clsx } from "clsx";

/* eslint-disable @next/next/no-img-element */

// Logo officiel « fidélo. by ASM. » — fichier image utilisé à l'identique
// (public/brand/fidelo-logo.png, simplement détouré de son fond).
// Sur fond sombre, il est posé sur une plaque blanche pour rester intact.
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
  const height = { sm: 30, md: 40, lg: 56 }[size];

  const img = (
    <img
      src="/brand/fidelo-logo.png"
      alt="fidélo. by ASM."
      style={{ height, width: "auto" }}
      draggable={false}
    />
  );

  const inner = light ? (
    <span
      className={clsx(
        "inline-flex items-center rounded-xl bg-white px-2.5 py-1.5 shadow-sm",
        className
      )}
    >
      {img}
    </span>
  ) : (
    <span className={clsx("inline-flex items-center", className)}>{img}</span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} aria-label="fidélo. by ASM.">
      {inner}
    </Link>
  );
}
