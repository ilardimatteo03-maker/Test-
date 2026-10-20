export const data = { permalink: "/robots.txt", eleventyExcludeFromCollections: true };

export function render({ baseUrl }) {
  return `User-agent: *\nAllow: /\n${baseUrl ? `\nSitemap: ${baseUrl}/sitemap.xml\n` : ""}`;
}
