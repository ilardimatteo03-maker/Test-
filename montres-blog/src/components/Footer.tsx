import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="border-t border-ink/10 mt-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 text-sm text-ink/60">
        <p className="affiliate-disclosure mb-6 max-w-2xl">
          {siteConfig.name} participe au Programme Partenaires d&apos;Amazon EU, un
          programme d&apos;affiliation conçu pour permettre à des sites de percevoir une
          rémunération grâce à la création de liens vers Amazon.fr. En tant que
          Partenaire Amazon, nous réalisons un bénéfice sur les achats remplissant les
          conditions requises.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/mentions-legales" className="hover:text-ink">
            Mentions légales
          </Link>
          <Link href="/politique-de-confidentialite" className="hover:text-ink">
            Politique de confidentialité
          </Link>
          <Link href="/dashboard" className="hover:text-ink">
            Dashboard
          </Link>
        </div>
        <p className="mt-6">
          &copy; {new Date().getFullYear()} {siteConfig.name}
        </p>
      </div>
    </footer>
  );
}
