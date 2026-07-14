import Link from "next/link";
import { clsx } from "clsx";

export function Logo({
  className,
  light = false,
  href = "/",
}: {
  className?: string;
  light?: boolean;
  href?: string | null;
}) {
  const inner = (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 shadow-glow">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2.5l2.7 5.9 6.3.7-4.7 4.3 1.3 6.3L12 16.9l-5.9 2.8 1.3-6.3-4.7-4.3 6.3-.7L12 2.5z"
            fill="white"
          />
        </svg>
      </span>
      <span
        className={clsx(
          "text-xl font-bold tracking-tight",
          light ? "text-white" : "text-ink"
        )}
      >
        Fidélo
      </span>
    </span>
  );
  if (href === null) return inner;
  return <Link href={href}>{inner}</Link>;
}
