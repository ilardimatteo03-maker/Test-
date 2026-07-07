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

  const category = siteConfig.categories.find((c) => c.slug === article.category);

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20">
      <JsonLd data={schemas as Record<string, unknown>[]} />

      <p className="eyebrow mb-4">{category?.label}</p>
      <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight leading-[1.02] text-balance">
        {article.title}
      </h1>

      {/* Chapo en Bodoni italique (signature editoriale) */}
      <p className="font-serif italic text-xl sm:text-2xl text-ink/75 leading-snug mt-6 max-w-2xl">
        {article.description}
      </p>

      <div className="mt-6 flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.16em] text-steel">
        <time dateTime={article.publishedAt}>
          {new Date(article.publishedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </time>
        <span className="text-gold">·</span>
        <span>{Math.round(article.wordCount / 200)} min de lecture</span>
      </div>

      <div className="rule-gold mt-8" />

      <p className="affiliate-disclosure mt-8 mb-2">
        Cet article contient des liens affiliés Amazon. Nous pouvons percevoir une
        commission sur les achats effectués via ces liens, sans surcoût pour vous.
      </p>

      <div className="prose prose-editorial max-w-none mt-10 leading-relaxed">
        <MDXRemote source={article.content} components={mdxComponents} />
      </div>

      <FaqSection faq={article.faq} />

      {related.length > 0 && (
        <section className="mt-20 border-t border-ink pt-10">
          <div className="flex items-baseline gap-3 mb-8">
            <span className="section-num text-3xl">→</span>
            <h2 className="font-serif text-2xl font-bold">À lire aussi</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
            {related.map((item) => (
              <ArticleCard key={item.slug} article={item} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
