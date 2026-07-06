import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { getAllArticles } from "@/lib/content";
import { siteConfig } from "@/lib/site-config";

export default function HomePage() {
  const latest = getAllArticles().slice(0, 6);

  return (
    <div>
      <section className="border-b border-ink/10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-24">
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight max-w-2xl">
            Trouvez la montre qu&apos;il vous faut, sans le blabla marketing.
          </h1>
          <p className="mt-5 text-lg text-ink/70 max-w-xl">
            Guides d&apos;achat, comparatifs et reviews sur Seiko, Longines, Timex,
            Citizen et les autres grandes marques accessibles.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {siteConfig.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/blog/${cat.slug}`}
                className="rounded-full border border-ink/15 px-4 py-2 text-sm hover:border-brass hover:text-brass transition-colors"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl font-semibold">Derniers articles</h2>
          <Link href="/blog" className="text-sm text-brass hover:underline">
            Voir tout le blog →
          </Link>
        </div>

        {latest.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {latest.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <p className="text-ink/60 text-sm">
            Aucun article publié pour le moment. Lancez{" "}
            <code className="bg-ink/5 px-1.5 py-0.5 rounded">npm run generate:article</code>{" "}
            pour créer le premier.
          </p>
        )}
      </section>
    </div>
  );
}
