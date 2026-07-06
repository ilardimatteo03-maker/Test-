export const siteConfig = {
  name: "Chrono Guide",
  tagline: "Guides, comparatifs et avis sur les montres Seiko, Longines, Timex, Citizen et plus",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
  locale: "fr-FR",
  amazonAssociateTag: process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || "votretag-21",
  categories: [
    {
      slug: "guides-achat",
      label: "Guides d'achat",
      description: "Comment choisir la bonne montre selon votre budget et votre usage.",
    },
    {
      slug: "comparatifs",
      label: "Comparatifs",
      description: "Marque contre marque, modèle contre modèle : les vrais différences.",
    },
    {
      slug: "reviews",
      label: "Reviews",
      description: "Avis détaillés, modèle par modèle.",
    },
    {
      slug: "tops",
      label: "Tops & classements",
      description: "Les meilleures montres par catégorie de prix et d'usage.",
    },
  ],
} as const;

export type CategorySlug = (typeof siteConfig.categories)[number]["slug"];
