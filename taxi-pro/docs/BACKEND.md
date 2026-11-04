# Service de réservation (backend)

Un thème Shopify ne peut pas, seul, garder une clé secrète, recalculer un prix de façon fiable,
encaisser un montant variable ni envoyer d'e-mails au client. Le dossier `backend/` fournit ce service :
un serveur Node.js **sans dépendance** (Node 18.17 ou plus récent), multi-entreprises.

## Ce qu'il fait

| Fonction | Détail |
| --- | --- |
| Itinéraire serveur | `POST /api/route` : distance et durée calculées avec la clé **secrète** (Google Routes API, Mapbox Directions ou OSRM), mises en cache 30 min. |
| Devis serveur | `POST /api/quote` : prix recalculé pour chaque véhicule. |
| Réservation | `POST /api/bookings` : recalcul complet du prix avec la configuration lue **sur la boutique** ; un prix différent de celui affiché renvoie `409 PRICE_CHANGED` et le visiteur doit valider le nouveau prix. |
| Statuts | `pending_validation` (demande, paiement au chauffeur) → `confirmed` par l'entreprise ; `awaiting_payment` (en ligne, acompte) → `confirmed` **uniquement** à la réception du webhook de paiement signé ; `completed`, `cancelled`. |
| Paiement | Shopify (commande provisoire payable dans le checkout Shopify / Shopify Payments) ou Stripe Checkout. Montant toujours fixé par le serveur. |
| E-mails | Demande reçue, paiement en attente, confirmation (avec fichier agenda .ics), modification, annulation, rappel avant le trajet, notification à l'entreprise. Logo, nom et couleurs du thème. FR, EN, NL, DE. |
| Agenda | `.ics` pour le client ; flux d'agenda de l'entreprise à ajouter dans Google Agenda, Outlook ou Apple Calendrier. |
| Gestion | Tableau de bord `/admin` (liste, filtres, confirmer, modifier l'heure, annuler, terminer, notes internes). |
| Intégrations | Webhook sortant signé (`X-TaxiPro-Signature`, HMAC SHA-256) vers Zapier, Make ou un logiciel de dispatch. |
| Sécurité | CORS limité aux domaines de la boutique, limitation de débit, champ piège anti-robots, signatures HMAC vérifiées en temps constant, jetons aléatoires, corps limités à 64 Ko. |

## Comment il lit les tarifs

Le thème publie sa configuration sur une page technique : `https://votre-boutique/?view=taxi-config`
(`templates/index.taxi-config.liquid`, sans habillage, `noindex`). Le service lit cette page (mise en cache 60 s) :
les tarifs restent donc gérés **uniquement dans l'éditeur de thème**, et le serveur ne fait jamais confiance
aux montants envoyés par le navigateur.

- Boutique protégée par mot de passe : renseignez `STOREFRONT_PASSWORD`.
- Test d'un thème non publié : renseignez `PREVIEW_THEME_ID` (identifiant numérique du thème, visible dans l'URL de l'éditeur).
- Site non Shopify ou tests : `CONFIG_FILE=chemin/vers/config.json`.

## Déploiement

N'importe quel hébergement Node convient (Render, Railway, Fly.io, Scaleway, OVH, un VPS…).

```bash
cd taxi-pro/backend
cp .env.example .env        # puis complétez les valeurs
npm test                    # 17 tests
npm start                   # écoute sur PORT (8787 par défaut)
```

Avec Docker : `docker build -t taxi-pro-backend taxi-pro/backend && docker run -p 8787:8787 --env-file .env -v taxipro-data:/app/data taxi-pro-backend`.

Points importants :
- Servez le service en **HTTPS** (fourni par la plupart des hébergeurs) et renseignez `PUBLIC_URL`.
- Le dossier `DATA_DIR` contient les réservations (un fichier JSON par entreprise) : il doit être **persistant et sauvegardé**.
  Pour un gros volume, remplacez `src/store.js` par une base de données (même interface : `get`, `list`, `save`, `update`).
- Une seule instance à la fois (le stockage fichier n'est pas partagé entre plusieurs serveurs).
- Dans le thème : Paramètres › Cartes et intégrations › **URL du service de réservation** = `PUBLIC_URL`,
  et « Calcul de la distance » = **Service de réservation (recommandé)**.

## Configuration par variables d'environnement

Voir `backend/.env.example` (une entreprise) ou `backend/tenants.example.json` (plusieurs entreprises,
`TENANTS_FILE=tenants.json`). Dans le fichier, les secrets s'écrivent `"env:NOM_DE_VARIABLE"` : ils restent dans
les variables d'environnement de l'hébergeur, jamais dans un fichier versionné.

## APIs et comptes nécessaires

| Besoin | Service | Où le régler | Clé |
| --- | --- | --- | --- |
| Autocomplétion des adresses | **Google Maps Platform** : Maps JavaScript API + Places API (New) | Thème › Cartes et intégrations | Clé **publique** restreinte par référent HTTP (votre domaine) |
| ou | **Mapbox** : Search Box API | Thème | Jeton public `pk.` restreint par URL |
| ou (tests, faible volume) | Photon / OpenStreetMap | Thème | Aucune (service de démonstration) |
| Distance et durée | **Google Routes API** (Compute Routes) | Backend `ROUTING_PROVIDER=google` | Clé **secrète** restreinte par IP du serveur |
| ou | Mapbox Directions | Backend | Jeton (secret conseillé) |
| ou | OSRM auto-hébergé | Backend `OSRM_URL` | Aucune |
| Carte du trajet | Google Maps (si Google) ou tuiles OpenStreetMap / fournisseur de tuiles | Thème | En production, utilisez un fournisseur de tuiles (Mapbox, MapTiler, Stadia…) : la politique d'OpenStreetMap interdit l'usage intensif de ses serveurs |
| Paiement Shopify | Application personnalisée Shopify (Paramètres › Applications › Développer des applications) avec `write_draft_orders`, `read_orders` | Backend `SHOPIFY_ADMIN_TOKEN` | Jeton Admin API `shpat_…` |
| ou paiement Stripe | Stripe Checkout | Backend `STRIPE_SECRET_KEY` | Clé secrète `sk_…` |
| E-mails | Resend, Postmark, SendGrid ou Brevo | Backend `EMAIL_PROVIDER`, `EMAIL_API_KEY` | Clé API + domaine expéditeur vérifié (SPF, DKIM) |

## Paiement par Shopify

1. Créez une application personnalisée avec les accès `write_draft_orders` et `read_orders`, installez-la,
   copiez le jeton Admin API dans `SHOPIFY_ADMIN_TOKEN`.
2. Paramètres › Notifications › **Webhooks** › Créer un webhook : événement **Paiement de commande**
   (`orders/paid`), format JSON, URL `https://votre-service/webhooks/shopify/<id-entreprise>`.
   Copiez la clé de signature affichée sous la liste des webhooks dans `SHOPIFY_WEBHOOK_SECRET`.
3. Thème › Réservation : cochez « Paiement en ligne » et/ou « Acompte » ; backend : `PAYMENT_PROVIDER=shopify`.

Le client paie la facture de la commande provisoire dans le checkout Shopify. La ligne est créée **non taxable**
car les prix du thème s'entendent TVA comprise : vérifiez avec votre comptable le traitement de la TVA dans Shopify.
Après le paiement, Shopify affiche sa page de commande ; la confirmation de réservation part par e-mail dès
réception du webhook.

## Paiement par Stripe

1. `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY=sk_live_…`.
2. Stripe › Développeurs › Webhooks : point de terminaison `https://votre-service/webhooks/stripe/<id-entreprise>`,
   événements `checkout.session.completed` et `checkout.session.async_payment_succeeded` ; copiez le secret
   `whsec_…` dans `STRIPE_WEBHOOK_SECRET`.
3. Après paiement, Stripe renvoie le client sur la page de réservation, qui affiche « Paiement en cours de
   vérification » puis « Réservation confirmée » dès que le webhook est reçu (actualisation automatique).

## Tableau de bord et agenda

- `https://votre-service/admin` : identifiant de l'entreprise + `ADMIN_TOKEN` (long jeton aléatoire).
- Flux d'agenda : bouton « Flux d'agenda » du tableau de bord. L'adresse contient le jeton : ne la partagez pas.
- Les rappels partent automatiquement `REMINDER_HOURS` heures avant les courses **confirmées** (vérification toutes les 5 minutes).

## Référence de l'API

| Méthode et chemin | Corps / paramètres | Réponse |
| --- | --- | --- |
| `GET /health` | — | `{ ok, tenants }` |
| `POST /api/route` | `{ shop, from:{lat,lng}, to:{lat,lng} }` | `{ distanceKm, durationMin, geometry, provider, estimated }` |
| `POST /api/quote` | `{ shop, request }` | `{ route, quote, errors, vehicles[] }` |
| `POST /api/bookings` | `{ shop, request, customer, payment, clientTotal, acceptTotal?, returnUrl, locale }` | `201 { booking:{id,ref,status,token}, paymentUrl }` · `409 { code:'PRICE_CHANGED', quote }` · `422 { errors }` |
| `GET /api/bookings/:id?token=` | — | `{ booking:{ref,status,datetime,total,paymentUrl} }` |
| `GET /api/bookings/:id/ics?token=` | — | fichier `text/calendar` |
| `POST /webhooks/shopify/:tenant` | corps Shopify, en-têtes `X-Shopify-Hmac-Sha256`, `X-Shopify-Topic` | `{ ok }` |
| `POST /webhooks/stripe/:tenant` | corps Stripe, en-tête `Stripe-Signature` | `{ ok }` |
| `GET /admin/api/bookings?tenant=` | `Authorization: Bearer <ADMIN_TOKEN>` | `{ bookings[] }` |
| `POST /admin/api/bookings/:id/(confirm\|cancel\|complete\|update)?tenant=` | `{ note }` ou `{ datetime, adminNote, notify }` | `{ booking }` |
| `GET /admin/calendar.ics?tenant=&token=` | — | flux iCalendar |

`request` : `{ serviceId, vehicleId, pickup:{lat,lng,label}, dropoff, immediate, datetime:'AAAA-MM-JJTHH:MM', roundTrip,
returnDatetime, passengers, luggage, hours, waitingMin, options:{ code: quantité } }` (heure locale de l'entreprise).
