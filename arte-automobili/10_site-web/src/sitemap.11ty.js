// Plan du site pour les moteurs de recherche — produit seulement quand l'adresse publique est connue
export const data = {
  permalink: (data) => (data.baseUrl ? "/sitemap.xml" : false),
  eleventyExcludeFromCollections: true,
};

export function render({ baseUrl, collections }) {
  const pages = collections.all.filter((p) => !p.data.exclure_plan && p.url && p.url.endsWith("/"));
  const urls = pages.map((p) => `  <url><loc>${baseUrl}${p.url}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
