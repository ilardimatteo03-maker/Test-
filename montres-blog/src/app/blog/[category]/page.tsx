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
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20">
      <p className="eyebrow mb-4">Catégorie</p>
      <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">
        {category.label}
      </h1>
      <p className="font-serif italic text-lg text-ink/70 mt-4 mb-12 max-w-xl">
        {category.description}
      </p>

      {articles.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <p className="text-steel text-sm">
          Aucun article dans cette catégorie pour le moment.
        </p>
      )}
    </div>
  );
}
