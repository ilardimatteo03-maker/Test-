# fidélo. by ASM — Dossier produit

> La carte de fidélité digitale des commerces de quartier, éditée et revendue
> par l'agence ASM. Ce document est le dossier produit complet : concept,
> parcours, écrans, architecture et plan de lancement.

---

## 1. Concept & positionnement

**Problème.** Les cartes de fidélité en carton se perdent, ne mesurent rien, et
les solutions digitales existantes sont trop chères ou trop complexes pour un
commerçant indépendant.

**Solution.** Fidélo : le commerçant crée sa carte en 2 minutes, ajoute un
tampon (ou un point) en 1 geste — bouton ou scan QR — et le client suit sa
carte sur son téléphone, sans installer d'application.

**Positionnement B2B2C.** Fidélo est un **service opéré par ASM** : l'agence
l'installe, le configure et le facture en **abonnement mensuel** à ses
commerces clients (revenu récurrent). Le plan Découverte sert de démonstration
commerciale ; Fidélo Pro (29 €/mois) est l'offre installée par ASM.

**Cible.** Restaurants, cafés, coiffeurs, snacks, boutiques — commerçants de
40-60 ans, peu à l'aise avec la technologie. **Règle produit : toute action
courante tient en 1 geste, compréhensible en 5 secondes.**

---

## 2. Parcours commerçant (de zéro à l'usage quotidien)

1. **Landing** (`/`) — promesse « La fidélité de vos clients, gérée par ASM »,
   CTA « Démarrer avec ASM » / « Voir la démo ».
2. **Inscription** (`/signup`) — 3 champs : commerce, nom, email.
3. **Onboarding** (`/onboarding`) — 3 étapes guidées : type de commerce →
   récompense + objectif → aperçu de la carte + premier client (optionnel).
4. **Dashboard** (`/dashboard`) — « Bonjour, [prénom] », 4 chiffres clés,
   bandeau d'upgrade, tampon rapide sur les meilleurs clients, activité.
5. **Usage quotidien** — au comptoir, 2 gestes possibles :
   - **Scanner** (`/dashboard/scan`) : caméra → QR du client → tampon auto ;
   - **Clients** (`/dashboard/clients`) : recherche → bouton « Tampon ».
6. **Réglages** — `/dashboard/rewards` (type de programme tampons/points,
   récompense, objectif, aperçu en direct) et `/dashboard/settings`
   (compte, abonnement Stripe, reset démo).

## 3. Parcours client final (zéro app)

1. Reçoit le lien de sa carte (`/carte/[id]`) — envoyé par le commerçant.
2. Voit sa **carte format carte bancaire** (dégradé bleu, compteur, jauge,
   QR intégré) + « Plus que X tampons ! ».
3. La montre en caisse — le commerçant scanne le QR (`/scan/[id]` : validation
   1 tap, anti double-tampon).
4. Peut l'ajouter à **Apple / Google Wallet** (1 bouton).
5. Reçoit un **email automatique** quand sa récompense est gagnée.

---

## 4. Écrans (inventaire complet)

| Route | Rôle | Points UX clés |
| --- | --- | --- |
| `/` | Landing | Hero + carte animée, résultats chiffrés, tarifs, CTA pill « button-in-button » |
| `/signup`, `/login` | Auth | 3 champs max, bouton « compte démo », visuel carte |
| `/onboarding` | Setup guidé | 3 étapes, progression visible, suggestions de récompenses |
| `/dashboard` | Vue d'ensemble | 4 stats double-bezel, tampon en 2 clics, activité |
| `/dashboard/scan` | Mode caisse | Caméra plein cadre, visée, anti-doublon 3 s, dernier scan affiché |
| `/dashboard/clients` | CRM minimal | Recherche pill, fiche client (historique, carte, tampon), limite Free appliquée |
| `/dashboard/rewards` | Programme | Toggle Tampons/Points, objectif, aperçu live |
| `/dashboard/settings` | Compte | Infos, abonnement Stripe (Checkout/Portail), reset démo |
| `/carte/[id]` | Carte client publique | Carte bancaire + QR, encouragement, boutons Wallet |
| `/scan/[id]` | Cible du QR | Validation 1 tap, garde propriétaire, confirmation |
| `not-found` | 404 | Brandée, retour accueil |

**Design system.** Geist (grotesque, poids lourds, tracking serré) · palette
noir `#0A0A0A` / blanc / bleu `#2F6BFF` / bleu-nuit `#0D1526` · cartes
« double-bezel » · boutons pill avec flèche imbriquée · reveals au scroll
(IntersectionObserver, GPU-safe) · `prefers-reduced-motion` respecté ·
logo wordmark « fidélo. » + « by ASM. » (points bleus).

---

## 5. Architecture technique

```
Next.js 14 (App Router, TypeScript, Tailwind)
├── Mode démo (zéro config) : lib/store.ts — localStorage, données seedées
└── Mode production (auto-détecté via lib/config.ts) :
    ├── Supabase  : Auth + PostgreSQL + RLS stricte
    │   ├── supabase/migrations/0001_init.sql (tables, trigger, RLS,
    │   │   add_stamp() atomique, get_public_card())
    │   └── lib/supabase/{client,server,admin,data,middleware}.ts
    ├── Stripe    : /api/stripe/{checkout,portal,webhook} → merchants.plan
    ├── Wallet    : /api/wallet/{apple,google}/[id] (.pkpass signé / JWT)
    └── Resend    : /api/notify/reward (email récompense)
```

- **Une seule API de données** (`listClients`, `addStamp`, `getStats`…) avec
  deux implémentations interchangeables (démo sync / Supabase async).
- **Sécurité** : RLS `merchant_id = auth.uid()` partout ; la carte publique
  passe par une fonction SQL qui n'expose que 5 champs ; le webhook Stripe est
  le seul à utiliser la clé service-role.
- **Déploiement** : Vercel (HTTPS requis pour la caméra). Variables dans
  `.env.example` ; guides `SUPABASE_STRIPE_SETUP.md` et `WALLET_SETUP.md`.

---

## 6. Monétisation

| | Découverte (0 €) | **Fidélo Pro — 29 €/mois** |
| --- | --- | --- |
| Clients | 30 max (appliqué) | Illimités |
| Installation & accompagnement ASM | ❌ | ✅ |
| Notifications email | ❌ | ✅ |
| Stats avancées / export | ❌ | ✅ |

Leviers : bandeau d'upgrade à 70 % de la limite, modale au plafond, page
Compte → Stripe Checkout. **Upsell futur** : SMS, multi-établissements,
campagnes de relance (« on ne vous a pas vu depuis 30 jours »).

Marge agence : prix et limites dans `lib/plan.ts`.

---

## 7. Plan de lancement rapide (ASM)

**Semaine 1 — Production.** Créer Supabase (migration SQL) + Stripe (produit
29 €/mois + webhook) → `.env` → déployer sur Vercel → tester le parcours réel.

**Semaine 2 — Pilotes.** 3 commerces clients existants d'ASM en Découverte,
installés par ASM (compte + carte + QR imprimé au comptoir). Collecter les
retours, ajuster les libellés.

**Semaine 3 — Commercialisation.** Passer les pilotes en Pro (témoignages),
argumentaire : « vos clients reviennent, on installe tout, 29 €/mois ». Ajouter
Fidélo à la page services d'ASM avec le lien « Voir la démo » (compte démo
public inclus dans le produit).

**Mois 2+.** Wallet (certificats Apple/Google), Resend (emails), puis SMS et
relances automatiques comme options Pro+.

---

## 8. État du produit

✅ Fini et testé (build + parcours navigateur) : tout ce qui précède.
🔌 Nécessite des comptes externes : Supabase, Stripe, Resend, Apple/Google
Wallet (guides fournis, code prêt, détection automatique).
🧭 Roadmap suggérée : bascule async des pages sur `lib/supabase/data.ts` dès
le projet Supabase créé ; mise à jour push des cartes Wallet ; campagnes SMS.
