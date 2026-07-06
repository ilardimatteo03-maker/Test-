#!/usr/bin/env node
/**
 * Genere un article de blog par jour :
 *   1. Prend le premier mot-cle non traite dans data/keyword-queue.json
 *   2. Demande a Claude de le rediger en MDX structure (via tool-use, pas de
 *      parsing de texte libre : le schema JSON est valide par l'API)
 *   3. Verifie le nombre de mots (>= 2500), relance une fois si besoin
 *   4. Ecrit content/articles/<slug>.mdx et met a jour data/published.json
 *
 * Necessite ANTHROPIC_API_KEY dans l'environnement (voir README).
 * Usage : npm run generate:article
 *         npm run generate:dry-run   (genere sans rien ecrire sur disque)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const KEYWORD_QUEUE_PATH = path.join(ROOT, "data", "keyword-queue.json");
const PRODUCTS_PATH = path.join(ROOT, "data", "products.json");
const PUBLISHED_LOG_PATH = path.join(ROOT, "data", "published.json");

const MIN_WORDS = 2500;
const MODEL = "claude-sonnet-5";
const DRY_RUN = process.argv.includes("--dry-run");

function log(step, message) {
  console.log(`[generate-article] ${step}: ${message}`);
}

function fail(message, error) {
  console.error(`[generate-article] ERREUR: ${message}`);
  if (error) console.error(error);
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function slugify(input) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function getExistingArticles() {
  if (!fs.existsSync(ARTICLES_DIR)) fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(ARTICLES_DIR, filename), "utf-8");
      const { data } = matter(raw);
      return { slug: filename.replace(/\.mdx$/, ""), ...data };
    });
}

function pickNextKeyword(existingArticles) {
  const queue = readJson(KEYWORD_QUEUE_PATH);
  const usedKeywords = new Set(
    existingArticles.map((a) => String(a.keyword || "").toLowerCase())
  );
  return queue.find((item) => !usedKeywords.has(item.keyword.toLowerCase()));
}

function countWords(markdown) {
  const stripped = markdown
    .replace(/<[^>]+>/g, " ") // composants MDX
    .replace(/[#>*_`-]/g, " ") // syntaxe markdown
    .trim();
  if (!stripped) return 0;
  return stripped.split(/\s+/).filter(Boolean).length;
}

const ARTICLE_TOOL = {
  name: "submit_article",
  description: "Soumet l'article finalise pret a etre publie.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Titre SEO, 50-65 caracteres" },
      description: {
        type: "string",
        description: "Meta description, 140-160 caracteres, incitant au clic",
      },
      body: {
        type: "string",
        description:
          "Corps de l'article en Markdown/MDX (sans le H1, qui est deja le titre). Doit contenir des H2/H3, au moins un <ComparisonTable ids=\"id1,id2\" /> et 2 a 3 <ProductCallout id=\"...\" />, en utilisant EXCLUSIVEMENT les product ids fournis dans le prompt. Ne jamais utiliser la syntaxe productIds={[...]} (accolades/tableau) : uniquement des attributs chaine de caracteres.",
      },
      faq: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
          },
          required: ["question", "answer"],
        },
        minItems: 3,
        maxItems: 5,
      },
    },
    required: ["title", "description", "body", "faq"],
  },
};

function buildPrompt({ keywordEntry, products, existingArticles, minWords }) {
  const productList = products
    .filter((p) => keywordEntry.productIds.includes(p.id))
    .map(
      (p) =>
        `- id="${p.id}" | ${p.brand} ${p.name} | ${p.priceRangeEur} EUR | ideal pour: ${p.bestFor}`
    )
    .join("\n");

  const interlinkList = existingArticles
    .slice(0, 15)
    .map((a) => `- /blog/${a.category}/${a.slug} : ${a.title}`)
    .join("\n");

  return `Tu es redacteur specialise horlogerie pour un blog francais d'affiliation Amazon sur les montres (Seiko, Longines, Timex, Citizen...).

Ecris un article de type "${keywordEntry.type}" cible sur le mot-cle : "${keywordEntry.keyword}".

Contraintes strictes :
- Francais courant, naturel, jamais robotique ni repetitif. Zero tiret cadratin.
- Minimum ${minWords} mots dans le champ "body" (hors FAQ). Vise plutot 2700-2900 mots pour garder de la marge.
- Structure avec des H2 (##) et H3 (###) clairs, jamais de sur-titre H1 (le titre est deja gere separement).
- Contenu concret et specifique (chiffres, mecanismes, cas d'usage reels), pas de remplissage generique.
- Utilise ces produits UNIQUEMENT (n'invente aucun autre produit ni ASIN) :
${productList}
- Insere une fois, avec EXACTEMENT cette syntaxe (attribut string, pas de tableau JS) : <ComparisonTable ids="${keywordEntry.productIds.join(",")}" />
- Insere 2 a 3 fois, aux endroits pertinents : <ProductCallout id="ID_PRODUIT" />
- Termine par une conclusion avec une recommandation claire.
- Propose une FAQ de 3 a 5 questions reellement utiles pour cette recherche.

Voici des articles deja publies sur le site, vers lesquels tu peux faire un lien Markdown contextuel (2-3 liens maximum, seulement si pertinent, avec une ancre naturelle) :
${interlinkList || "(aucun article existant pour le moment)"}

Reponds uniquement via l'outil submit_article.`;
}

async function generateWithClaude(client, keywordEntry, products, existingArticles) {
  const prompt = buildPrompt({
    keywordEntry,
    products,
    existingArticles,
    minWords: MIN_WORDS,
  });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    tools: [ARTICLE_TOOL],
    tool_choice: { type: "tool", name: "submit_article" },
    messages: [{ role: "user", content: prompt }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse) throw new Error("Pas de reponse structuree renvoyee par le modele.");

  return toolUse.input;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    fail(
      "ANTHROPIC_API_KEY manquante. Ajoutez-la a votre .env local ou aux secrets GitHub Actions."
    );
  }

  const existingArticles = getExistingArticles();
  const keywordEntry = pickNextKeyword(existingArticles);

  if (!keywordEntry) {
    log(
      "info",
      "Aucun mot-cle restant dans data/keyword-queue.json. Ajoutez-en avant le prochain run."
    );
    process.exit(0);
  }

  log("mot-cle", keywordEntry.keyword);

  const products = readJson(PRODUCTS_PATH);
  const client = new Anthropic({ apiKey });

  let article;
  let attempt = 0;
  const maxAttempts = 2;

  while (attempt < maxAttempts) {
    attempt += 1;
    log("generation", `tentative ${attempt}/${maxAttempts} via ${MODEL}`);

    try {
      article = await generateWithClaude(client, keywordEntry, products, existingArticles);
    } catch (error) {
      fail("Echec de l'appel a l'API Claude.", error);
    }

    const wordCount = countWords(article.body);
    log("verification", `${wordCount} mots (minimum requis: ${MIN_WORDS})`);

    if (wordCount >= MIN_WORDS) {
      article.wordCount = wordCount;
      break;
    }

    if (attempt >= maxAttempts) {
      fail(
        `Article trop court apres ${maxAttempts} tentatives (${wordCount} mots). Abandon pour eviter de publier du contenu insuffisant.`
      );
    }
    log("retry", "Article trop court, nouvelle tentative...");
  }

  const slug = slugify(article.title);
  const outputPath = path.join(ARTICLES_DIR, `${slug}.mdx`);

  if (fs.existsSync(outputPath)) {
    fail(`Un fichier existe deja pour ce slug : ${slug}.mdx`);
  }

  const frontmatter = {
    title: article.title,
    description: article.description,
    category: keywordEntry.category,
    keyword: keywordEntry.keyword,
    publishedAt: new Date().toISOString().slice(0, 10),
    wordCount: article.wordCount,
    productIds: keywordEntry.productIds,
    faq: article.faq,
    relatedSlugs: [],
  };

  const fileContents = matter.stringify(article.body.trim() + "\n", frontmatter);

  if (DRY_RUN) {
    log("dry-run", `Article genere (non ecrit) : "${article.title}" (${article.wordCount} mots)`);
    console.log("\n--- Apercu frontmatter ---\n");
    console.log(fileContents.split("\n").slice(0, 20).join("\n"));
    process.exit(0);
  }

  fs.writeFileSync(outputPath, fileContents, "utf-8");
  log("ecriture", `content/articles/${slug}.mdx`);

  const publishedLog = fs.existsSync(PUBLISHED_LOG_PATH)
    ? readJson(PUBLISHED_LOG_PATH)
    : [];
  publishedLog.push({
    slug,
    keyword: keywordEntry.keyword,
    category: keywordEntry.category,
    wordCount: article.wordCount,
    publishedAt: frontmatter.publishedAt,
  });
  fs.writeFileSync(PUBLISHED_LOG_PATH, JSON.stringify(publishedLog, null, 2) + "\n", "utf-8");
  log("log", "data/published.json mis a jour");

  log("succes", `Article publie : "${article.title}"`);
}

main().catch((error) => fail("Erreur inattendue.", error));
