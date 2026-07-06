import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { getArticlesByCategory } from "@/lib/content";
import { siteConfig, type CategorySlug } from "@/lib/site-config";

type Props = { params: { category: string } };

function getCategory(slug: string) {
  return siteConfig.categories.find((c) => c.slug === slug);
}

export function generateStaticParams() {
  return siteConfig.categories.map((cat) => ({ category: cat.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const category = getCategory(params.category);
  if (!category) return {};
  return {
    title: category.label,
    description: category.description,
    alternates: { canonical: `/blog/${category.slug}` },
  };
}

export default function CategoryPage({ params }: Props) {
  const category = getCategory(params.category);
  if (!category) notFound();

  const articles = getArticlesByCategory(params.category as CategorySlug);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-2">{category.label}</h1>
      <p className="text-ink/60 mb-10 max-w-xl">{category.description}</p>

      {articles.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <p className="text-ink/60 text-sm">Aucun article dans cette catégorie pour le moment.</p>
      )}
    </div>
  );
}
