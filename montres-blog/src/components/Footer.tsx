import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="bg-ink text-paper mt-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8 pb-10 border-b border-paper/15">
          <div>
            <span className="font-serif text-3xl font-bold leading-none">
              {siteConfig.name}
            </span>
            <p className="mt-3 text-sm text-paper/60 max-w-xs">
              Le média horloger pensé comme un magazine. Guides, comparatifs et
              reviews.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[0.72rem] uppercase tracking-[0.18em]">
            {siteConfig.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/blog/${cat.slug}`}
                className="text-paper/70 hover:text-gold transition-colors"
              >
                {cat.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="affiliate-disclosure mt-8 max-w-2xl text-paper/60">
          {siteConfig.name} participe au Programme Partenaires d&apos;Amazon EU, un
          programme d&apos;affiliation conçu pour permettre à des sites de percevoir
          une rémunération grâce à la création de liens vers Amazon.fr. En tant que
          Partenaire Amazon, nous réalisons un bénéfice sur les achats remplissant
          les conditions requises.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 text-[0.68rem] uppercase tracking-[0.2em] text-paper/40">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/mentions-legales" className="hover:text-paper">
              Mentions légales
            </Link>
            <Link href="/politique-de-confidentialite" className="hover:text-paper">
              Confidentialité
            </Link>
            <Link href="/dashboard" className="hover:text-paper">
              Dashboard
            </Link>
          </div>
          <span>
            &copy; {new Date().getFullYear()} {siteConfig.name}
          </span>
        </div>
      </div>
    </footer>
  );
}
