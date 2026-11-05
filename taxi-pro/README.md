# TAXI PRO — thème Shopify de réservation de taxi

Thème Shopify Online Store 2.0 universel pour sociétés de taxi, VTC, chauffeurs privés et navettes aéroport,
avec calculateur de prix réel, parcours de réservation en 5 étapes et service de réservation (backend) pour la
validation serveur des prix, le paiement en ligne et les e-mails.

Aucune donnée d'entreprise n'est écrite dans le code : identité, tarifs, véhicules, zones, forfaits, horaires,
moyens de paiement et textes se règlent dans l'éditeur de thème. Le même thème sert autant d'entreprises que nécessaire.

| | |
| --- | --- |
| **Thème à importer** | `dist/taxi-pro-theme-1.0.1.zip` (108 fichiers) |
| **Sources du thème** | `theme/` |
| **Service de réservation** | `backend/` (Node.js 18+, sans dépendance) |
| **Documentation** | `docs/INSTALLATION.md` · `docs/TARIFICATION.md` · `docs/BACKEND.md` · `docs/TESTS.md` |
| **Aperçus** | `docs/apercus/` |
| **Outils et tests** | `tools/` (contrôle, aperçu local, tests navigateur, archive) · `tests/` (moteur de tarification) |

## Ce qui fonctionne, et à quelles conditions

| Fonction | État |
| --- | --- |
| Calcul automatique du prix : prise en charge, km, minute, minimum, nuit, week-end, jours fériés (dont Pâques), plages personnalisées, aéroport, gare, passagers, bagages, attente, péages, options, aller-retour, arrondi, acompte, TVA incluse | **Opérationnel** dans le thème. Moteur unique, 32 tests. |
| Forfaits, zones tarifaires, prix par véhicule, mise à disposition à l'heure, prix fixe, sur devis, priorités entre règles | **Opérationnel**. |
| Parcours en 5 étapes (trajet, véhicule, options, coordonnées, récapitulatif), mobile d'abord, accessible (WCAG 2.1 AA vérifié) | **Opérationnel**. |
| Autocomplétion des adresses | **Nécessite une clé publique** Google Places ou Mapbox. Photon (OpenStreetMap), réglé par défaut, sert aux essais : service gratuit à faible volume, sans garantie. |
| Distance et durée réelles, carte du trajet | **Nécessite** le service de réservation (recommandé, clé secrète côté serveur), ou Google / Mapbox dans le navigateur. OSRM public, réglé par défaut, est un serveur de démonstration. |
| Envoi des demandes de réservation | **Opérationnel sans backend** via le formulaire de contact Shopify (e-mail à la boutique). Statut affiché : « demande envoyée, pas encore confirmée ». |
| Validation du prix côté serveur avant confirmation ou paiement | **Nécessite le service de réservation**. Prix falsifié → refus et nouveau prix à valider. |
| Paiement en ligne de la totalité ou d'un acompte | **Nécessite le service de réservation** et Shopify (commande provisoire payée dans le checkout Shopify) ou Stripe Checkout. Confirmation uniquement à la réception du webhook signé. |
| E-mails au client (demande reçue, paiement en attente, confirmation + agenda, modification, annulation, rappel) et à l'entreprise | **Nécessite le service de réservation** et un fournisseur d'e-mails (Resend, Postmark, SendGrid ou Brevo). |
| Tableau de bord des réservations, flux d'agenda, webhook sortant (Zapier, Make, dispatch) | **Nécessite le service de réservation**. |
| 5 préréglages de style, couleurs, polices, tailles, arrondis, ombres, espacements, animations, boutons, champs | **Opérationnel** (réglages et préréglages Shopify). |
| Pages : accueil, réservation, services, véhicules, tarifs, à propos, contact, FAQ, pages légales, recherche, 404, blog, mot de passe, comptes clients | **Opérationnel**. |
| Langues | Français (par défaut), anglais, néerlandais, allemand pour les textes du site ; e-mails dans les 4 langues. Les libellés de l'éditeur de thème sont en français. |

## Architecture

```
Navigateur ──► thème Shopify (Liquid, CSS, JavaScript sans dépendance)
   │            ├─ snippets/tp-config-settings.liquid + sections « … (tarifs) » du pied de page → configuration JSON publique
   │            ├─ assets/tp-pricing.js   moteur de tarification (navigateur ET serveur)
   │            ├─ assets/tp-geo.js       autocomplétion, itinéraire, carte (Google, Mapbox, Photon, OSRM, backend)
   │            └─ assets/tp-booking.js   parcours de réservation, formulaire rapide
   │
   ├──► Google / Mapbox (clés publiques restreintes au domaine)
   │
   └──► service de réservation (backend/)
          ├─ lit la configuration sur la boutique (/?view=taxi-config)  ← source unique : l'éditeur de thème
          ├─ itinéraire avec clé secrète, recalcul du prix, statut
          ├─ paiement : Shopify (draft order) ou Stripe Checkout ── webhooks signés ──► confirmation
          ├─ e-mails, rappels, fichiers agenda, tableau de bord /admin
          └─ webhook sortant vers vos outils
```

Principes : aucune clé secrète dans le thème ; le serveur ne fait jamais confiance au prix envoyé par le navigateur ;
une réservation n'est jamais présentée comme confirmée tant que l'entreprise ne l'a pas validée ou que le paiement
n'est pas reçu.

## Démarrage rapide

1. Importer `dist/taxi-pro-theme-1.0.1.zip` comme **nouveau thème non publié** (Boutique en ligne › Thèmes).
   La réservation est tout de suite disponible à l'adresse `/?view=reservation`, sans créer de page.
2. Créer les pages et leur associer les modèles, régler l'identité, les tarifs et la configuration Taxi Pro :
   `docs/INSTALLATION.md`.
3. (Recommandé) Déployer le service de réservation : `docs/BACKEND.md`.
4. Recette complète : `docs/TESTS.md`. Puis publier.

## Commandes de développement

```bash
node --test taxi-pro/tests/*.test.mjs            # moteur de tarification
(cd taxi-pro/backend && npm test)                # service de réservation
(cd taxi-pro/tools && npm install)               # une fois
node taxi-pro/tools/check-theme.mjs              # Theme Check + validation des modèles et traductions
node taxi-pro/tools/preview/server.mjs 8791      # aperçu local : http://127.0.0.1:8791 (?preset=Corporate…)
node taxi-pro/tools/e2e.mjs --shots              # tests navigateur + captures
node taxi-pro/tools/gen-strings.mjs              # après ajout d'un texte « taxi.booking » dans fr.default.json
node taxi-pro/tools/build-zip.mjs                # archive du thème
(cd taxi-pro/backend && npm run sync-engine)     # après modification du moteur de tarification
```

L'aperçu local (`tools/preview/`) rend les vrais fichiers Liquid avec LiquidJS et des équivalents des objets Shopify.
Il sert aux tests et aux captures ; la référence reste l'aperçu Shopify.

## Limites connues

- **Ce qui n'a pas pu être vérifié ici** : l'import du ZIP dans une vraie boutique, les appels réels à Google, Mapbox,
  Photon, OSRM, Stripe, Shopify Admin API et aux fournisseurs d'e-mails (le réseau de l'environnement de développement
  les bloque ; ils sont simulés dans les tests avec leurs formats documentés). Faites la recette de `docs/TESTS.md` sur
  la boutique avant de publier.
- Le prix est calculé à l'**heure de prise en charge** (une course commencée à 21 h 50 n'est pas majorée « nuit »).
- Les péages ne sont pas calculés automatiquement : ils se saisissent sur les forfaits et zones tarifaires.
- L'attente réelle et les détours se facturent à bord ; le formulaire ne connaît que l'attente prévue.
- Le stockage du service de réservation est un fichier JSON par entreprise : suffisant pour une PME, à remplacer
  par une base de données pour un gros volume ou plusieurs serveurs.
- Pas de gestion des disponibilités de chauffeurs ni de dispatch : chaque réservation est validée par l'entreprise
  (ou confirmée par le paiement). Le webhook sortant permet de brancher un logiciel de dispatch.
- Paiement Shopify : la commande provisoire est créée sans taxe car les prix sont TVA comprise ; la ventilation
  comptable de la TVA est à valider avec l'expert-comptable.
- La politique de l'OpenStreetMap Foundation interdit l'usage intensif de ses serveurs de tuiles et de Photon/OSRM
  publics : configurez un fournisseur commercial en production.
- Les libellés de l'éditeur de thème sont en français (pas de fichier de traduction des schémas).
- Le thème n'est pas conçu pour vendre des produits : les pages produit, collection et panier sont fonctionnelles mais minimales.
