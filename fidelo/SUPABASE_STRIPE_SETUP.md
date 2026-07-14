# Passer Fidélo en production — Supabase + Stripe

Ce guide fait passer Fidélo du **mode démo** (données dans le navigateur) à une
vraie application **multi-appareils et facturable**.

> Tant que les variables d'environnement ne sont pas renseignées, l'app reste en
> mode démo — rien ne casse.

---

## 1. Supabase (base de données + Auth)

1. Créez un projet sur [supabase.com](https://supabase.com).
2. **SQL Editor → New query** : collez le contenu de
   [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) et
   exécutez-le. Cela crée les tables (`merchants`, `clients`, `activity`), la
   **sécurité RLS**, le trigger d'inscription et les fonctions
   `add_stamp()` / `get_public_card()`.
3. **Authentication → Providers** : activez **Email** (mot de passe ou magic link).
4. **Project Settings → API** : copiez
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ serveur uniquement)

### Ce que fait la sécurité (RLS)
- Un commerçant ne voit **que ses propres** clients / activité (`merchant_id = auth.uid()`).
- L'ajout de tampon passe par la fonction `add_stamp()` (atomique, applique la
  règle « X tampons = 1 récompense » et journalise l'activité).
- La **carte publique** du client (`/carte/[id]`) lit uniquement les champs
  nécessaires via `get_public_card()` — la table `clients` n'est jamais ouverte
  en lecture publique.

---

## 2. Stripe (abonnement mensuel)

1. Créez un compte [stripe.com](https://stripe.com).
2. **Products** : créez un produit « Fidélo Pro », prix **récurrent mensuel**
   (ex : 29 €/mois). Copiez l'`API ID` du prix → `STRIPE_PRICE_PRO_MONTHLY`.
3. **Developers → API keys** : `Secret key` → `STRIPE_SECRET_KEY`.
4. **Developers → Webhooks → Add endpoint** :
   - URL : `https://VOTRE-DOMAINE/api/stripe/webhook`
   - Événements : `checkout.session.completed`,
     `customer.subscription.updated`, `customer.subscription.deleted`
   - Copiez le `Signing secret` → `STRIPE_WEBHOOK_SECRET`

### Test en local
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# → copiez le whsec_... affiché dans STRIPE_WEBHOOK_SECRET
```

Le flux : **Compte → Passer au Pro** ouvre Stripe Checkout → au paiement, le
webhook met `merchants.plan = 'pro'`. « Revenir au Gratuit » ouvre le **portail
de facturation** Stripe (annulation, factures).

---

## 3. Variables d'environnement

Copiez `.env.example` en `.env.local` et renseignez toutes les clés :

```bash
cp .env.example .env.local
```

---

## 4. Déploiement (Vercel)

1. Importez le repo sur [vercel.com](https://vercel.com).
2. Ajoutez les variables d'environnement (mêmes que `.env.local`).
3. Mettez `NEXT_PUBLIC_APP_URL` à l'URL de production.
4. Déployez. Mettez à jour l'URL du webhook Stripe avec le domaine final.

---

## 5. Architecture (démo ↔ production)

| Couche | Démo (actuel) | Production |
| --- | --- | --- |
| Données | `lib/store.ts` (localStorage) | `lib/supabase/data.ts` (async) |
| Auth | session locale | Supabase Auth + `middleware.ts` |
| Paiement | toggle instantané | Stripe Checkout + webhook |

Les deux couches exposent **la même API** (`listClients`, `addStamp`,
`getStats`…). Le fichier `lib/config.ts` détecte automatiquement le mode selon
la présence des variables Supabase.

### Dernière étape de câblage
Les pages (dashboard, clients…) lisent aujourd'hui le store **synchrone** de la
démo. Pour basculer 100 % sur Supabase, il reste à convertir ces lectures en
appels **async** vers `lib/supabase/data.ts` (Server Components) — l'API et les
types étant identiques, la bascule est mécanique. Tout le back-end
(schéma, RLS, fonctions, routes Stripe) est déjà en place et testé au build.
