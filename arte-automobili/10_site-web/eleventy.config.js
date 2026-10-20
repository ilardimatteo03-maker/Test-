// Configuration Eleventy du site Arte Automobili.
// Les contenus se modifient dans src/_data (coordonnées, tarifs) et en tête de chaque page de src/.
import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

const NNBSP = " "; // espace fine insécable (« 60 € »)

export default function (eleventyConfig) {
  eleventyConfig.addDataExtension("yaml,yml", (contents) => yaml.load(contents));

  // Adresse publique : celle de site.yaml, sinon celle fournie par Netlify au moment du déploiement
  const site = yaml.load(readFileSync("src/_data/site.yaml", "utf8"));
  const baseUrl = (site.url || process.env.URL || "").replace(/\/$/, "");
  eleventyConfig.addGlobalData("baseUrl", baseUrl);
  eleventyConfig.addGlobalData("annee", new Date().getFullYear());

  // Images : chaque <img src="/images/…"> devient une <picture> AVIF + JPEG en plusieurs largeurs
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["avif", "jpeg"],
    widths: [480, 800, 1200, 1600, 2400],
    sharpJpegOptions: { quality: 80, progressive: true, mozjpeg: true },
    sharpAvifOptions: { quality: 52 },
    htmlOptions: { imgAttributes: { loading: "lazy", decoding: "async" } },
  });

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  for (const f of ["favicon.svg", "favicon.ico", "apple-touch-icon.png", "android-chrome-192.png", "android-chrome-512.png", "site.webmanifest"]) {
    eleventyConfig.addPassthroughCopy(`src/${f}`);
  }
  eleventyConfig.addWatchTarget("src/assets/");

  // 60 → « 60 € » ; un texte (« Sur devis ») reste tel quel
  eleventyConfig.addFilter("prix", (v) => (typeof v === "number" ? `${v.toLocaleString("fr-FR")}${NNBSP}€` : v));
  eleventyConfig.addFilter("absolu", (path) => (baseUrl ? baseUrl + path : path));
  // « 06 12 34 56 78 » → « +33612345678 » pour les liens tel:
  eleventyConfig.addFilter("tel", (v) => {
    const n = String(v).replace(/[^\d+]/g, "");
    return n.startsWith("+") ? n : n.startsWith("00") ? "+" + n.slice(2) : n.startsWith("0") ? "+33" + n.slice(1) : n;
  });
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));
  // « + » de Bodoni trop fin aux petites tailles : composé dans la police de texte
  const echapper = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  eleventyConfig.addFilter("plus", (t) => echapper(t).replace(/\s\+\s/g, ' <span class="plus">+</span> '));
  eleventyConfig.addFilter("deuxChiffres", (n) => String(n).padStart(2, "0"));

  // Données structurées schema.org : les champs vides de site.yaml sont simplement omis
  eleventyConfig.addFilter("donneesStructurees", (s, prestations, description) => {
    const abs = (p) => (baseUrl ? baseUrl + p : p);
    const c = s.contact || {};
    const d = {
      "@context": "https://schema.org",
      "@type": "AutoWash",
      name: s.nom,
      description,
      image: abs("/assets/partage.jpg"),
      logo: abs("/android-chrome-512.png"),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Prestations",
        itemListElement: prestations.map((p) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: p.nom, description: p.description },
          ...(typeof p.prix === "number" ? { price: p.prix, priceCurrency: "EUR" } : {}),
        })),
      },
    };
    if (baseUrl) d.url = baseUrl + "/";
    if (c.telephone) d.telephone = c.telephone;
    if (c.email) d.email = c.email;
    if (c.adresse) d.address = c.adresse;
    if (c.zone) d.areaServed = c.zone;
    const sameAs = Object.values(s.reseaux || {}).filter(Boolean);
    if (sameAs.length) d.sameAs = sameAs;
    return JSON.stringify(d).replace(/</g, "\\u003c");
  });

  // Typographie française : espace fine insécable avant « : ; ! ? » et à l'intérieur des guillemets
  eleventyConfig.addTransform("typographie", function (html) {
    if (!(this.page.outputPath || "").endsWith(".html")) return html;
    let ignorer = false;
    return html.split(/(<[^>]+>)/).map((part) => {
      if (part.startsWith("<")) {
        if (/^<(script|style|textarea)\b/i.test(part)) ignorer = true;
        else if (/^<\/(script|style|textarea)>/i.test(part)) ignorer = false;
        return part;
      }
      if (ignorer) return part;
      return part.replace(/[ \u00a0]([:;!?»])/g, NNBSP + "$1").replace(/«[ \u00a0]/g, "«" + NNBSP);
    }).join("");
  });

  // Rappel, à chaque construction, des informations qui restent à fournir
  const manquants = [];
  const verifier = (obj, prefixe) => {
    for (const [k, v] of Object.entries(obj || {})) {
      if (v === "" || v === null) manquants.push(`${prefixe}.${k}`);
    }
  };
  verifier({ email: site.contact?.email, telephone: site.contact?.telephone }, "contact");
  const { capital, ...legal } = site.legal || {}; // le capital ne concerne que les sociétés
  verifier(legal, "legal");
  const f = site.formulaire || {};
  if (!f.service) manquants.push("formulaire.service (le formulaire est désactivé)");
  if (f.service === "web3forms" && !f.cle_web3forms) manquants.push("formulaire.cle_web3forms");
  if (f.service === "formspree" && !f.id_formspree) manquants.push("formulaire.id_formspree");
  eleventyConfig.on("eleventy.after", () => {
    if (manquants.length) {
      console.warn(`\n[Arte Automobili] À compléter dans src/_data/site.yaml avant la mise en ligne :\n  - ${manquants.join("\n  - ")}\n`);
    }
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "md", "11ty.js"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
