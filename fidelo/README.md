# Fidélo by ASM — La carte de fidélité digitale pour les commerces de quartier

Fidélo remplace la carte de fidélité en carton (celle qu'on perd toujours) par
une **carte digitale ultra-simple**. Le commerçant ajoute un tampon en 2 clics,
le client suit sa carte sur son téléphone, et une récompense l'attend à la fin.

**Fidélo est un produit édité et opéré par l'agence ASM** : c'est un service
que l'agence **installe, configure et revend** à ses commerces clients, avec un
**abonnement mensuel** (revenu récurrent pour l'agence).

Pensé pour un commerçant de 40–60 ans : **simple, beau, sans friction**.

> 🎯 **Une seule fonctionnalité, faite parfaitement : la fidélité par tampons.**

### Direction artistique (DA ASM.)

- **Palette** : noir `#0A0A0A` · blanc · gris clair + **bleu électrique `#2F6BFF`**
- **Sections sombres** : bleu-nuit `#0D1526`
- **Typographie** : grotesque neutre, très **gras et serré** (Inter 800/900)
- **Boutons** : gros **pills bleus** pleins · **eyebrows** bleus en majuscules
- **Signature** : le point bleu après le nom — `Fidélo by ASM.`

![Fidélo](https://img.shields.io/badge/Next.js-14-black) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)

---

## ✨ Ce que fait le produit

| Pour le commerçant | Pour le client |
| --- | --- |
| Tableau de bord clair (clients, tampons, récompenses) | Une carte digitale format « carte bancaire », QR intégré |
| Ajout d'un tampon en **2 clics** ou par **scan QR** (mode caisse) | Voit combien de tampons/points il lui reste |
| Programme **tampons ou points**, récompense en 1 écran | Message « Plus que X tampons ! » |
| Fiche client : téléphone, email, **historique des visites** | Ajout à **Apple / Google Wallet** |
| Onboarding guidé en 3 étapes | **Email automatique** quand la récompense est gagnée |
| Abonnement Gratuit / Pro intégré (Stripe) | Aucune app à installer |

> 📘 Dossier produit complet (concept, écrans, architecture, plan de
> lancement) : **[`PRODUCT.md`](./PRODUCT.md)**

---

## 🚀 Démarrage rapide

```bash
cd fidelo
npm install
npm run dev
```

Ouvrez **http://localhost:3000**.

### Tester immédiatement (données mockées)

- Cliquez sur **« Voir la démo »** (ou `/login` → *Découvrir avec le compte démo*).
- Un commerce fictif (**Café des Halles**) est déjà rempli avec 24 clients et de
  l'activité. Ajoutez des tampons, gagnez des récompenses, changez de plan.
- Vous pouvez aussi créer un vrai compte via **« Essai gratuit »** — l'onboarding
  en 3 étapes vous guide.

> Les données de démo sont stockées dans le navigateur (localStorage). Pour tout
> remettre à zéro : **Compte → Réinitialiser la démo**.

---

## 🧭 Parcours (3 clics max par action)

```
Landing ──► Inscription ──► Onboarding (3 étapes) ──► Dashboard
                                                          │
   ┌──────────────────────────────────────────────────────┤
   ▼                    ▼                    ▼              ▼
 Clients          Ajouter un tampon    Carte & récompense  Compte / Abonnement
   │                                                        
   └──► Page publique de la carte  (/carte/[id])  ← ce que voit le client
```

---

## 🗂️ Structure du projet

```
fidelo/
├── app/
│   ├── layout.tsx            # Layout racine + police Inter + Toasts
│   ├── page.tsx              # Landing page (hero, tarifs, CTA)
│   ├── login/                # Connexion (+ compte démo)
│   ├── signup/               # Inscription
│   ├── onboarding/           # Guide en 3 étapes
│   ├── dashboard/
│   │   ├── layout.tsx        # Garde d'auth + sidebar
│   │   ├── page.tsx          # Vue d'ensemble (stats, activité, tampon rapide)
│   │   ├── clients/          # ⭐ Cœur du produit : liste, ajout, tampons
│   │   ├── rewards/          # Configuration carte + aperçu en direct
│   │   └── settings/         # Compte + abonnement (Free/Pro)
│   └── carte/[id]/           # Page publique côté client
├── components/
│   ├── ui.tsx                # Button, Card, Input, Badge, Modal, Avatar…
│   ├── StampCard.tsx         # La carte de fidélité visuelle (réutilisée)
│   ├── Toast.tsx             # Retour visuel instantané
│   ├── AuthShell.tsx         # Mise en page connexion/inscription
│   ├── Logo.tsx
│   ├── landing/Nav.tsx
│   └── dashboard/Shell.tsx   # Sidebar + navigation + responsive
├── lib/
│   ├── types.ts              # Modèle de données (pensé pour Supabase)
│   ├── store.ts              # 🔌 Couche de données (mock localStorage)
│   ├── seed.ts               # Données de démonstration
│   ├── plan.ts               # Limites Free / Pro (monétisation)
│   ├── format.ts             # Helpers (dates, avatars)
│   └── useStore.ts           # Hook de synchronisation React
└── tailwind.config.ts        # Palette noir / blanc / bleu ASM, Inter
```

---

## 🎨 Design (DA ASM.)

- **Palette** : noir (`#0A0A0A`) · blanc · gris clair + bleu électrique (`brand-500 #2F6BFF`) ; sombre en bleu-nuit (`#0D1526`)
- **Typographie** : Inter en poids lourds (800/900), tracking serré — grotesque éditorial
- **Style** : minimaliste, éditorial, gros chiffres bleus, beaucoup d'espace
- **Responsive** : mobile-first (sidebar → drawer, grilles adaptatives)
- Micro-interactions : toasts, animation « pop » des tampons, halos bleus

---

## 💰 Monétisation — un service revendu par ASM (revenu récurrent)

Le modèle est **B2B2C** : ASM propose Fidélo comme service additionnel à ses
commerces clients et facture un **abonnement mensuel**.

| | Découverte (gratuit) | Fidélo Pro — 29€/mois |
| --- | --- | --- |
| Clients | 30 max | Illimités |
| Installé & configuré par ASM | ❌ | ✅ |
| Récompenses personnalisées | ❌ | ✅ |
| Statistiques avancées / export | ❌ | ✅ |
| Accompagnement & support ASM | ❌ | ✅ |

La limite du plan gratuit est **réellement appliquée** (modale d'upgrade quand
on atteint 30 clients, bandeau à 70 %). Le changement de plan se fait dans
**Compte** — en production, ce bouton ouvre le paiement Stripe.

> 💡 **Prix ajustables** dans `lib/plan.ts` (nom, montant mensuel, limites).
> C'est là que se règle la marge de l'agence sur chaque commerce.

---

## 🔌 Passer de la démo à la production — Supabase + Stripe

**Tout le back-end de production est déjà écrit et compilé.** Il suffit de créer
les comptes, lancer la migration et coller les clés. Guide complet :
👉 **[`SUPABASE_STRIPE_SETUP.md`](./SUPABASE_STRIPE_SETUP.md)**

Ce qui est fourni, prêt à l'emploi :

| Élément | Fichier |
| --- | --- |
| Schéma SQL + **RLS** + fonctions (`add_stamp`, `get_public_card`) | `supabase/migrations/0001_init.sql` |
| Clients Supabase (navigateur / serveur / admin) | `lib/supabase/*.ts` |
| Couche de données async (même API que la démo) | `lib/supabase/data.ts` |
| Protection des routes + refresh session | `middleware.ts` |
| Stripe Checkout / Portail / Webhook | `app/api/stripe/*` |
| Détection auto démo ↔ production | `lib/config.ts` |

L'app **bascule automatiquement** en mode production dès que les variables
Supabase sont présentes (sinon elle reste en démo localStorage). Les deux couches
exposent **la même API** (`listClients`, `addStamp`, `getStats`…), donc la
bascule des composants en lectures async est mécanique — voir la fin du guide.

**Déploiement → Vercel** : importez le repo, ajoutez les variables d'env, déployez.

---

## 🧪 Qualité

- `npm run build` : build de production vérifié (14 routes + middleware).
- Parcours cœur testé de bout en bout au navigateur (login démo → tampon →
  récompense → scan QR → upgrade Pro → carte publique).
- Back-end Supabase + Stripe vérifié au build (typecheck complet).

---

## 🔮 Améliorations futures

- **QR code par client** : le commerçant scanne, le tampon s'ajoute tout seul.
- **Notifications** (SMS / WhatsApp) : « Il vous reste 1 tampon ! ».
- **Vraie auth Supabase** + magic link, et multi-établissements.
- **Stripe Billing** complet (essai, factures, TVA).
- **Statistiques avancées** : meilleurs jours, taux de retour, cohortes.
- **Multi-langues** et personnalisation des couleurs de la carte par commerce.
- **Mode « borne »** : une tablette sur le comptoir où le client tape son numéro.

---

Fait pour les commerces de quartier. **Simplicité > complexité.**
