# Chrono Guide — blog d'affiliation automatisé (montres)

Blog Next.js qui publie automatiquement un article de 2500+ mots par jour sur
l'univers des montres (Seiko, Longines, Timex, Citizen...), avec liens
d'affiliation Amazon, SEO on-page complet et maillage interne.

## Ce qui est réellement automatisé, et ce qui ne peut pas l'être

Avant d'aller plus loin, deux points de friction réels à connaître : ce
projet est un scaffold complet et fonctionnel, mais deux briques dépendent
d'accès externes que je ne peux pas créer à votre place.

1. **La génération de contenu** appelle l'API Claude (Anthropic). Il vous
   faut votre propre clé API (`ANTHROPIC_API_KEY`), facturée à l'usage. Un
   article de 2700 mots coûte quelques centimes à quelques dizaines de
   centimes selon le modèle utilisé.
2. **Les liens Amazon** utilisent ici une base de produits **curatée à la
   main** (`data/products.json`) plutôt que la Product Advertising API (PA
   API) d'Amazon. Ce n'est pas un choix arbitraire : la PA API n'est
   accessible qu'aux comptes Associates ayant déjà généré des ventes
   qualifiées (3 ventes en 180 jours). Un site tout neuf ne peut
   techniquement pas y accéder au démarrage. La structure du code
   (`src/lib/products.ts`, `src/lib/affiliate.ts`) est faite pour qu'on
   puisse brancher la PA API plus tard sans tout réécrire.

**Avertissement honnête sur le modèle économique** : publier en masse du
contenu généré automatiquement, y compris de bonne qualité, est exactement
le type de pratique visé par les mises à jour "Helpful Content" de Google
depuis 2023. Des sites utilisant ce type de pipeline se sont déjà fait
désindexer. Rien n'empêche de le faire, mais ne partez pas du principe que
le trafic organique suivra automatiquement parce que le nombre de mots est
respecté. Une relecture humaine périodique et un vrai travail éditorial
(photos réelles, tests produits) réduisent significativement ce risque.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- Contenu stocké en fichiers **MDX** (`content/articles/`), pas de base de
  données : chaque article est un fichier versionné dans Git. C'est un choix
  délibéré (voir "Pourquoi pas Postgres/Mongo ?" plus bas), pas un oubli.
- Génération : `@anthropic-ai/sdk` (Claude), appelé via un script Node
  autonome (`scripts/generate-article.mjs`)
- Automatisation : **GitHub Actions** (cron quotidien), pas de serveur à
  maintenir
- Déploiement suggéré : **Vercel** (déploiement automatique à chaque push)

## Installation

```bash
cd montres-blog
npm install
cp .env.example .env
# Remplir ANTHROPIC_API_KEY, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG dans .env
npm run dev
```

Le site tourne sur http://localhost:3000. Un article de démonstration est
déjà présent dans `content/articles/` pour vérifier que tout s'affiche
correctement avant de brancher la génération automatique.

## Générer un article manuellement

```bash
npm run generate:dry-run   # génère et affiche un aperçu, n'écrit rien sur disque
npm run generate:article   # génère et écrit vraiment le fichier .mdx
```

Le script :

1. lit `data/keyword-queue.json` et prend le premier mot-clé qui n'a pas
   encore d'article correspondant (déduplication automatique) ;
2. appelle Claude avec un schéma structuré (tool-use) pour obtenir un JSON
   fiable : titre, meta description, corps Markdown/MDX, FAQ — pas de
   parsing fragile de texte libre ;
3. vérifie que l'article fait au moins 2500 mots, relance une fois si ce
   n'est pas le cas, abandonne proprement sinon (code de sortie 1, visible
   dans les logs GitHub Actions) ;
4. écrit `content/articles/<slug>.mdx` et journalise la publication dans
   `data/published.json`.

### Ajouter des mots-clés

`data/keyword-queue.json` est la file d'attente éditoriale. Chaque entrée :

```json
{
  "keyword": "avis seiko presage srpb77",
  "category": "reviews",
  "type": "review",
  "productIds": ["seiko-presage-srpb77"]
}
```

`category` doit correspondre à un slug de `src/lib/site-config.ts`
(`guides-achat`, `comparatifs`, `reviews`, `tops`). `productIds` référence
`data/products.json` : ce sont les seuls produits que Claude a le droit de
citer pour cet article, ce qui évite les ASIN inventés.

**Sur la "recherche automatique de mots-clés longue traîne"** demandée dans
le brief initial : je n'ai pas branché d'outil réel (Ahrefs, SEMrush,
Google Keyword Planner ont tous des API payantes ou un accès restreint). La
file de mots-clés est pour l'instant une liste de départ à enrichir à la
main ou avec l'outil de votre choix. C'est le seul point du cahier des
charges que je n'ai pas automatisé de bout en bout, par honnêteté : le
simuler aurait juste caché le problème.

## Ajouter des produits

`data/products.json`. Remplacez `REMPLACER_PAR_ASIN_REEL` par le véritable
ASIN Amazon du produit (visible dans l'URL de la fiche produit Amazon).
Ajoutez une vraie photo dans `public/products/` (les fiches utilisent
actuellement un placeholder SVG généré, à but uniquement démonstratif —
utiliser les visuels Amazon nécessite l'autorisation du programme
Associates, vérifiez les règles d'usage des images avant de les réutiliser
telles quelles).

## Automatisation quotidienne (GitHub Actions)

`.github/workflows/daily-article.yml` tourne chaque jour à 6h UTC, génère un
article et le commit directement sur la branche par défaut du dépôt. Si
vous déployez sur Vercel avec l'intégration Git, chaque commit redéploie
automatiquement le site : la boucle est donc complète et sans intervention
humaine.

Secrets GitHub à configurer (`Settings > Secrets and variables > Actions`) :

- `ANTHROPIC_API_KEY`

Point d'attention : GitHub n'exécute les workflows programmés
(`schedule`) que sur la **branche par défaut** du dépôt. Si ce projet vit
sur une branche secondaire, le cron ne se déclenchera pas tant qu'elle
n'est pas fusionnée ou définie comme branche par défaut.

### Variante plus prudente : publier via Pull Request

Le brief demande une publication "sans intervention humaine", donc le
workflow committe directement. Si vous préférez garder un filet de
sécurité (relire un article avant qu'il soit vraiment en ligne), remplacez
les étapes `git commit` / `git push` par
[`peter-evans/create-pull-request`](https://github.com/peter-evans/create-pull-request) :
le job ouvre une pull request au lieu de pousser sur la branche par défaut,
et vous validez (ou corrigez) depuis l'interface GitHub avant de merger.

## SEO

- Métadonnées par page (`generateMetadata`), title/description/canonical
- `app/sitemap.ts` et `app/robots.ts` générés dynamiquement à partir des
  articles réellement publiés
- JSON-LD `Article`, `FAQPage` et `Product` (`src/lib/schema.ts`)
- Maillage interne : le prompt de génération reçoit la liste des articles
  existants et est invité à créer 2-3 liens contextuels ; chaque article
  affiche aussi 2-3 "à lire aussi" calculés côté serveur
- Balises `rel="nofollow sponsored"` sur tous les liens Amazon (conforme aux
  recommandations Google sur le contenu sponsorisé)
- Bandeau de divulgation d'affiliation sur chaque article et en pied de
  page (obligatoire dans les conditions du programme Amazon Associates, et
  une bonne pratique légale au-delà)

## Pourquoi pas Postgres/Mongo comme suggéré dans le brief ?

Le brief proposait PostgreSQL/MongoDB. J'ai choisi des fichiers MDX
versionnés dans Git à la place, pour une raison concrète : avec une vraie
base de données, il faudrait aussi un serveur applicatif qui tourne en
continu (ou une base serverless payante), plus une couche d'API, pour un
gain minime sur ce cas d'usage précis (un article par jour). Le pattern
"contenu = fichiers Git" fonctionne nativement avec Next.js (build-time
static generation), Vercel (déploiement gratuit sur commit) et GitHub
Actions (cron gratuit) — donc un hébergement à coût quasi nul tant que le
volume reste raisonnable (quelques centaines d'articles).

Si vous voulez un vrai back-office (édition en ligne, validation avant
publication par plusieurs personnes, historique de versions autre que Git),
c'est le signal qu'il faut migrer vers une base de données + une interface
d'admin — `src/lib/content.ts` isole déjà l'accès aux données pour rendre
cette migration ciblée plutôt que globale.

## Dashboard (`/dashboard`)

Page non indexée (`robots: noindex`) listant les articles publiés, la
moyenne de mots par article et la file de mots-clés restante. Elle lit
directement le système de fichiers : **aucune authentification n'est en
place**. Avant toute mise en ligne publique, protégez cette route (Vercel
Password Protection sur l'environnement, ou middleware Next.js avec Basic
Auth).

## Pages légales

`/mentions-legales` et `/politique-de-confidentialite` sont des modèles à
compléter avec vos informations réelles avant mise en ligne — obligatoires
en France (LCEN) et sous RGPD dès qu'un outil de mesure d'audience est
utilisé.

## Déploiement (Vercel)

1. Poussez ce dossier vers un dépôt GitHub dédié (ou gardez-le dans ce
   monorepo, Vercel permet de définir `montres-blog` comme "Root Directory"
   du projet).
2. Importez le dépôt sur [vercel.com](https://vercel.com/new).
3. Renseignez les variables d'environnement (`NEXT_PUBLIC_SITE_URL`,
   `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG`) dans les réglages du projet Vercel.
4. `ANTHROPIC_API_KEY` n'a pas besoin d'être sur Vercel : elle n'est utilisée
   que par le script de génération, exécuté dans GitHub Actions.

## Structure du projet

```
montres-blog/
├── content/articles/       # les articles, un fichier MDX par article
├── data/
│   ├── products.json       # base produits curatée (ASIN à completer)
│   ├── keyword-queue.json  # file de mots-cles a traiter
│   └── published.json      # historique des publications (log)
├── scripts/
│   └── generate-article.mjs
├── src/
│   ├── app/                 # routes Next.js (App Router)
│   ├── components/
│   └── lib/
├── .github/workflows/daily-article.yml
└── public/products/         # visuels produits
```
