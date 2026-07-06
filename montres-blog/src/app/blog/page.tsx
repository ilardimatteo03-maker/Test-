import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { getAllArticles } from "@/lib/content";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Blog",
  description: "Tous les guides, comparatifs, reviews et tops sur les montres.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const articles = getAllArticles();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-2">Le blog</h1>
      <p className="text-ink/60 mb-8">{articles.length} article(s) publié(s).</p>

      <div className="flex flex-wrap gap-3 mb-10">
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
