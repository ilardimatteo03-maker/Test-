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
| Tableau de bord clair (clients, tampons, récompenses) | Une page carte digitale, jolie, sur son téléphone |
| Ajout d'un tampon en **2 clics** | Voit combien de tampons il lui reste |
| Configuration de la récompense en 1 écran | Message « Plus que X tampons ! » |
| Onboarding guidé en 3 étapes | Aucune app à installer |
| Abonnement Gratuit / Pro intégré | |

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

## 🔌 Passer de la démo à la production

Toute la logique de données est **isolée dans `lib/store.ts`**. Pour brancher un
vrai backend, il suffit de réimplémenter ses fonctions (mêmes signatures) avec
Supabase — les composants n'ont pas à changer.

1. **Base de données + Auth → Supabase**
   - Les types de `lib/types.ts` correspondent au schéma des tables
     (`merchants`, `clients`, `activity`).
   - Remplacez `login/signup/logout` par `supabase.auth`, et les fonctions
     `listClients/addStamp/…` par des requêtes Supabase.
2. **Paiements → Stripe**
   - Reliez `setPlan()` à un Checkout Stripe + webhook pour synchroniser le plan.
3. **Variables d'environnement** : copiez `.env.example` en `.env.local`.
4. **Déploiement → Vercel** : `vercel` (aucune config particulière requise).

---

## 🧪 Qualité

- `npm run build` : build de production vérifié (11 routes).
- Parcours cœur testé de bout en bout (login démo → tampon → récompense →
  upgrade Pro → carte publique).

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
