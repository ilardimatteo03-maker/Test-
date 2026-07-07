import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import type { Article } from "@/lib/content";

export function ArticleCard({ article }: { article: Article }) {
  const category = siteConfig.categories.find((c) => c.slug === article.category);

  return (
    <Link
      href={`/blog/${article.category}/${article.slug}`}
      className="group block border-t border-ink/15 pt-5 transition-colors"
    >
      {category && (
        <span className="eyebrow">{category.label}</span>
      )}
      <h3 className="font-serif text-xl font-bold leading-snug mt-3 mb-2 group-hover:text-gold transition-colors text-balance">
        {article.title}
      </h3>
      <p className="text-sm text-ink/65 line-clamp-3 leading-relaxed">
        {article.description}
      </p>
      <time
        className="block mt-4 text-[0.7rem] uppercase tracking-[0.16em] text-steel"
        dateTime={article.publishedAt}
      >
        {new Date(article.publishedAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </time>
    </Link>
  );
}
