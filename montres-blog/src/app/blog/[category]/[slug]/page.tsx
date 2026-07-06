import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArticleCard } from "@/components/ArticleCard";
import { ComparisonTable } from "@/components/ComparisonTable";
import { ProductCallout } from "@/components/ProductCallout";
import { FaqSection } from "@/components/FaqSection";
import { JsonLd } from "@/components/JsonLd";
import { getAllArticles, getArticleBySlug, getRelatedArticles } from "@/lib/content";
import { buildArticleSchema, buildFaqSchema } from "@/lib/schema";
import { siteConfig } from "@/lib/site-config";

type Props = { params: { category: string; slug: string } };

const mdxComponents = {
  ComparisonTable,
  ProductCallout,
};

export function generateStaticParams() {
  return getAllArticles().map((article) => ({
    category: article.category,
    slug: article.slug,
  }));
}

export function generateMetadata({ params }: Props): Metadata {
  const article = getArticleBySlug(params.slug);
  if (!article) return {};

  const url = `/blog/${article.category}/${article.slug}`;

  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.publishedAt,
      url,
    },
  };
}

export default function ArticlePage({ params }: Props) {
  const article = getArticleBySlug(params.slug);
  if (!article || article.category !== params.category) notFound();

  const url = `${siteConfig.url}/blog/${article.category}/${article.slug}`;
  const related = getRelatedArticles(article);
  const schemas = [buildArticleSchema(article, url), buildFaqSchema(article.faq)].filter(
    Boolean
  );

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <JsonLd data={schemas as Record<string, unknown>[]} />

      <p className="text-xs uppercase tracking-wide text-brass font-medium mb-3">
        {siteConfig.categories.find((c) => c.slug === article.category)?.label}
      </p>
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
        {article.title}
      </h1>
      <div className="mt-4 flex items-center gap-4 text-sm text-ink/50">
        <time dateTime={article.publishedAt}>
          {new Date(article.publishedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </time>
        <span>·</span>
        <span>{Math.round(article.wordCount / 200)} min de lecture</span>
      </div>

      <p className="affiliate-disclosure mt-8 mb-2">
        Cet article contient des liens affiliés Amazon. Nous pouvons percevoir une
        commission sur les achats effectués via ces liens, sans surcoût pour vous.
      </p>

      <div className="prose prose-neutral max-w-none mt-10 prose-headings:font-serif prose-a:text-brass">
        <MDXRemote source={article.content} components={mdxComponents} />
      </div>

      <FaqSection faq={article.faq} />

      {related.length > 0 && (
        <section className="mt-16 border-t border-ink/10 pt-10">
          <h2 className="font-serif text-xl font-semibold mb-6">À lire aussi</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {related.map((item) => (
              <ArticleCard key={item.slug} article={item} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
