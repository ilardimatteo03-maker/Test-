import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Header() {
  return (
    <header className="border-b border-ink/10 bg-paper/95 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-2xl font-bold tracking-tight leading-none"
        >
          {siteConfig.name}
        </Link>
        <nav className="hidden sm:flex items-center gap-7 text-[0.72rem] uppercase tracking-[0.18em] font-medium">
          {siteConfig.categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/blog/${cat.slug}`}
              className="text-ink/70 hover:text-gold transition-colors"
            >
              {cat.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
