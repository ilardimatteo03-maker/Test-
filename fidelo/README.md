# Fidélo — La carte de fidélité digitale pour les commerces de quartier

Fidélo remplace la carte de fidélité en carton (celle qu'on perd toujours) par
une **carte digitale ultra-simple**. Le commerçant ajoute un tampon en 2 clics,
le client suit sa carte sur son téléphone, et une récompense l'attend à la fin.

Pensé pour un commerçant de 40–60 ans : **simple, beau, sans friction**.

> 🎯 **Une seule fonctionnalité, faite parfaitement : la fidélité par tampons.**

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
└── tailwind.config.ts        # Palette noir / blanc / violet, Inter
```

---

## 🎨 Design

- **Palette** : noir (`#0B0B0F`) · blanc · violet (`brand-600 #7C3AED`)
- **Typographie** : Inter (via `next/font`, auto-hébergée)
- **Style** : minimaliste, aéré, type Stripe / Notion
- **Responsive** : mobile-first (sidebar → drawer, grilles adaptatives)
- Micro-interactions : toasts, animation « pop » des tampons, halos violets

---

## 💰 Monétisation (intégrée dès le départ)

| | Gratuit | Pro — 19€/mois |
| --- | --- | --- |
| Clients | 30 max | Illimités |
| Récompenses personnalisées | ❌ | ✅ |
| Statistiques avancées / export | ❌ | ✅ |
| Support prioritaire | ❌ | ✅ |

La limite du plan gratuit est **réellement appliquée** (modale d'upgrade quand
on atteint 30 clients, bandeau à 70 %). Le changement de plan se fait dans
**Compte** — en production, ce bouton ouvre le paiement Stripe.

Voir `lib/plan.ts` pour ajuster les limites.

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
