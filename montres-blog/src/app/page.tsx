import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { WatchScene } from "@/components/WatchScene";
import { getAllArticles } from "@/lib/content";
import { siteConfig } from "@/lib/site-config";

export default function HomePage() {
  const latest = getAllArticles().slice(0, 6);

  return (
    <div>
      {/* HERO — bande encre, montre 3D en piece maitresse */}
      <section className="bg-ink text-paper overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          {/* Texte : rendu serveur, indexable */}
          <div>
            <p className="eyebrow">Horlogerie · Éditorial</p>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight leading-[0.98] mt-5 text-balance">
              Le temps,
              <br />
              <span className="italic font-normal">mis en scène.</span>
            </h1>
            <p className="mt-6 text-lg text-paper/70 max-w-md leading-relaxed">
              Guides d&apos;achat, comparatifs et reviews sur Seiko, Longines, Timex
              et Citizen. Le média horloger pensé comme un magazine.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[0.72rem] uppercase tracking-[0.18em]">
              {siteConfig.categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/blog/${cat.slug}`}
                  className="text-paper/70 hover:text-gold transition-colors border-b border-transparent hover:border-gold pb-1"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Montre 3D : decoratif, chargee apres coup (voir WatchScene) */}
          <WatchScene />
        </div>
      </section>

      {/* DERNIERS ARTICLES — bande papier */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="flex items-end justify-between mb-10">
          <div className="flex items-baseline gap-4">
            <span className="section-num text-4xl sm:text-5xl">01</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              À la une
            </h2>
          </div>
          <Link
            href="/blog"
            className="text-[0.72rem] uppercase tracking-[0.16em] text-gold hover:opacity-70 shrink-0"
          >
            Tout le blog →
          </Link>
        </div>

        {latest.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {latest.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <p className="text-ink/60 text-sm">
            Aucun article publié pour le moment. Lancez{" "}
            <code className="bg-ink/5 px-1.5 py-0.5">npm run generate:article</code>{" "}
            pour créer le premier.
          </p>
        )}
      </section>
    </div>
  );
}
