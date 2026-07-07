import type { Metadata } from "next";
import { getAllArticles } from "@/lib/content";
import keywordQueue from "../../../data/keyword-queue.json";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  const articles = getAllArticles();
  const publishedKeywords = new Set(articles.map((a) => a.keyword.toLowerCase()));
  const remainingKeywords = (keywordQueue as { keyword: string }[]).filter(
    (k) => !publishedKeywords.has(k.keyword.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-2">Dashboard</h1>
      <p className="text-ink/60 mb-1 text-sm">
        Vue interne, non indexée (voir <code>robots</code> dans le frontmatter de la
        page). À protéger par une authentification avant mise en production
        publique.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 my-8">
        <div className="border border-ink/10 rounded-lg p-5">
          <p className="text-3xl font-semibold">{articles.length}</p>
          <p className="text-sm text-ink/60">Articles publiés</p>
        </div>
        <div className="border border-ink/10 rounded-lg p-5">
          <p className="text-3xl font-semibold">{remainingKeywords.length}</p>
          <p className="text-sm text-ink/60">Mots-clés en attente</p>
        </div>
        <div className="border border-ink/10 rounded-lg p-5">
          <p className="text-3xl font-semibold">
            {articles.length
              ? Math.round(
                  articles.reduce((sum, a) => sum + (a.wordCount || 0), 0) /
                    articles.length
                )
              : 0}
          </p>
          <p className="text-sm text-ink/60">Mots / article (moyenne)</p>
        </div>
      </div>

      <h2 className="font-serif text-xl font-semibold mb-4">Articles publiés</h2>
      <div className="overflow-x-auto mb-12">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-ink/15">
              <th className="py-2 pr-4">Titre</th>
              <th className="py-2 pr-4">Catégorie</th>
              <th className="py-2 pr-4">Mots-clé</th>
              <th className="py-2 pr-4">Mots</th>
              <th className="py-2 pr-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.slug} className="border-b border-ink/10">
                <td className="py-2 pr-4">
                  <a
                    href={`/blog/${a.category}/${a.slug}`}
                    className="hover:text-gold"
                  >
                    {a.title}
                  </a>
                </td>
                <td className="py-2 pr-4 text-ink/60">{a.category}</td>
                <td className="py-2 pr-4 text-ink/60">{a.keyword}</td>
                <td className="py-2 pr-4 text-ink/60">{a.wordCount}</td>
                <td className="py-2 pr-4 text-ink/60">
                  {new Date(a.publishedAt).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
            {!articles.length && (
              <tr>
                <td colSpan={5} className="py-6 text-ink/50">
                  Aucun article pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="font-serif text-xl font-semibold mb-4">
        File d&apos;attente de mots-clés
      </h2>
      <ul className="text-sm text-ink/70 space-y-1 list-disc list-inside">
        {remainingKeywords.map((k) => (
          <li key={k.keyword}>{k.keyword}</li>
        ))}
        {!remainingKeywords.length && (
          <li className="list-none text-ink/50">
            File vide — ajoutez des mots-clés dans data/keyword-queue.json.
          </li>
        )}
      </ul>
    </div>
  );
}
