import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import type { Article } from "@/lib/content";

export function ArticleCard({ article }: { article: Article }) {
  const category = siteConfig.categories.find((c) => c.slug === article.category);

  return (
    <Link
      href={`/blog/${article.category}/${article.slug}`}
      className="group block border border-ink/10 rounded-lg p-5 hover:border-brass/60 transition-colors bg-white/60"
    >
      {category && (
        <span className="text-xs uppercase tracking-wide text-brass font-medium">
          {category.label}
        </span>
      )}
      <h3 className="font-serif text-lg font-semibold mt-2 mb-2 group-hover:text-brass transition-colors">
        {article.title}
      </h3>
      <p className="text-sm text-ink/70 line-clamp-3">{article.description}</p>
      <time className="block mt-3 text-xs text-ink/50" dateTime={article.publishedAt}>
        {new Date(article.publishedAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </time>
    </Link>
  );
}
