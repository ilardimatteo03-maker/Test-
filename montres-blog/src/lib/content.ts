import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { CategorySlug } from "./site-config";

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

export type ArticleFrontmatter = {
  title: string;
  description: string;
  category: CategorySlug;
  keyword: string;
  publishedAt: string;
  updatedAt?: string;
  wordCount: number;
  productIds: string[];
  faq: { question: string; answer: string }[];
  relatedSlugs: string[];
};

export type Article = ArticleFrontmatter & {
  slug: string;
  content: string;
};

function ensureArticlesDir(): void {
  if (!fs.existsSync(ARTICLES_DIR)) {
    fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  }
}

export function getAllArticles(): Article[] {
  ensureArticlesDir();
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".mdx"));

  const articles = files.map((filename) => {
    const slug = filename.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, filename), "utf-8");
    const { data, content } = matter(raw);
    return {
      slug,
      content,
      ...(data as ArticleFrontmatter),
    };
  });

  return articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getArticleBySlug(slug: string): Article | undefined {
  return getAllArticles().find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: CategorySlug): Article[] {
  return getAllArticles().filter((a) => a.category === category);
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  const all = getAllArticles().filter((a) => a.slug !== article.slug);

  const explicit = all.filter((a) => article.relatedSlugs?.includes(a.slug));
  if (explicit.length >= limit) return explicit.slice(0, limit);

  const sameCategory = all.filter(
    (a) => a.category === article.category && !explicit.includes(a)
  );

  return [...explicit, ...sameCategory].slice(0, limit);
}

export function articleExistsForKeyword(keyword: string): boolean {
  return getAllArticles().some(
    (a) => a.keyword.trim().toLowerCase() === keyword.trim().toLowerCase()
  );
}
