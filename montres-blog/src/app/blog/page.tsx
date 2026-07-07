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
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20">
      <p className="eyebrow mb-4">Le magazine</p>
      <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">
        Tout le blog
      </h1>
      <p className="text-steel mt-3 text-[0.8rem] uppercase tracking-[0.16em]">
        {articles.length} article{articles.length > 1 ? "s" : ""} publié
        {articles.length > 1 ? "s" : ""}
      </p>

      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-8 mb-12 text-[0.72rem] uppercase tracking-[0.18em]">
        {siteConfig.categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/blog/${cat.slug}`}
            className="text-ink/70 hover:text-gold border-b border-transparent hover:border-gold pb-1 transition-colors"
          >
            {cat.label}
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
