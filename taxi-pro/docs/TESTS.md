# Procédure de test

## 1. Tests automatisés (développeur)

Prérequis : Node.js 18.17 ou plus récent ; pour les tests navigateur, Playwright et Chromium.

```bash
cd taxi-pro
node --test tests/*.test.mjs                 # moteur de tarification : 33 tests
cd backend && npm test && cd ..              # service de réservation : 17 tests
cd tools && npm install && cd ..             # une fois : Theme Check, LiquidJS, axe-core
node tools/check-theme.mjs                   # Theme Check officiel + validation des modèles, traductions, icônes
node tools/e2e.mjs                           # navigateur : 98 contrôles ; --shots enregistre les captures dans docs/apercus
node tools/audit.mjs                         # chaque lien (≈ 1 600) et chaque bouton, puis 70 essais de clic
node tools/build-zip.mjs                     # archive du thème dans dist/
```

| Suite | Ce qui est vérifié |
| --- | --- |
| `tests/pricing.test.mjs` | Tarif km, minute, minimum, nuit après minuit, dimanche, fériés fixes et Pâques, combinaisons (plus forte, cumul, priorité), plages personnalisées, forfaits (sens inverse, prix par véhicule, coefficient, priorité, majorations), aéroport, gare, péages, zone tarifaire, zone interdite, hors zone, distance maximale, capacités, options (fixe, unité, %, restrictions, quantités), aller-retour, attente, délais, horaires (plages passant minuit), réservation immédiate au fuseau de l'entreprise, mise à disposition, prix fixe, sur devis, arrondi, acompte, TVA, détection aéroport. |
| `backend/test/backend.test.mjs` | Devis serveur, CORS, demande de réservation et e-mails, **prix falsifié refusé (409)**, validations, adresse sans coordonnées, mode de paiement non autorisé, Stripe (session, signature invalide refusée, montant insuffisant refusé, confirmation, webhook rejoué), acompte, Shopify (commande provisoire, HMAC), administration (accès, confirmation, modification avec recalcul, rappels, agenda, annulation), fichier .ics, limitation de débit, lecture de la configuration **réellement produite par le thème**, polyligne, fuseaux horaires. |
| `tools/check-theme.mjs` | Theme Check de Shopify (85 règles) ; chaque valeur des modèles, groupes et préréglages contrôlée contre le schéma de sa section (options, bornes, types, valeurs vides refusées à l'import) ; curseurs d'au moins 4 positions ; clés de traduction présentes dans les 4 langues ; snippets et icônes existants ; absence de clé secrète. |
| `tools/audit.mjs` | Exploration de 20 pages sur ordinateur et mobile : chaque lien interne répond, chaque ancre existe, tel: et mailto: valides, aucun lien vide ; chaque bouton a une action. Puis clic de chaque élément : menus (ordinateur et mobile, Échap, fermeture), logo, « Réserver » de l'en-tête, du héros, de chaque service (prestation présélectionnée) et de chaque véhicule (véhicule présélectionné), liens de sections, carte à la demande, FAQ, appel à l'action, carrousel, compteurs, 404, recherche, formulaire de contact (confirmation affichée), barre mobile, et dans la réservation : position, inversion, quand, quantités, aller-retour, prestations, Continuer / Retour, progression, options, conditions, Modifier, envoi, Nouvelle réservation. |
| `tools/e2e.mjs` | 12 pages (dont la réservation intégrée `/?view=reservation`) × ordinateur et mobile (erreurs console, un seul h1, débordement horizontal, alt, boutons nommés) ; audit **axe-core WCAG 2.1 AA** ; parcours complet sans backend (formulaire Shopify) ; formulaire rapide → réservation préremplie ; parcours avec backend (prix revalidé, demande, paiement Stripe simulé, retour, confirmation par webhook, prix falsifié) ; diagnostic dans l'éditeur et configuration rendue dans le pied de page ; mobile ; contraste des 5 préréglages. |

Les services cartographiques (Photon, OSRM, tuiles) sont simulés dans les tests navigateur avec des réponses au
format documenté. Les vrais services doivent être vérifiés sur la boutique (section 2).

## 2. Recette sur la boutique (aperçu du thème non publié)

Cochez chaque point sur ordinateur **et** sur téléphone.

### Affichage
- [ ] Accueil : héros, calculateur rapide, toutes les sections ; en-tête transparent sur l'image puis opaque au défilement.
- [ ] Dans l'éditeur, `/?view=reservation` (Page d'accueil › reservation) : le bandeau « Diagnostic » indique le bon nombre de véhicules, prestations, zones et forfaits.
- [ ] Menu mobile : ouverture, fermeture (bouton, touche Échap), liens.
- [ ] Pages Services, Véhicules, Tarifs (montants = réglages), À propos, Contact, FAQ, pages légales.
- [ ] Barre « Appeler / Réserver » en bas de l'écran mobile ; le bouton d'appel compose le bon numéro.
- [ ] Essai rapide de chaque préréglage de style.

### Calcul du prix
- [ ] Autocomplétion : suggestions après 3 lettres, navigation au clavier, adresse sélectionnée.
- [ ] Distance et durée affichées, tracé sur la carte.
- [ ] Trajet simple en journée : prix = prise en charge + km × prix/km (voir le détail du prix).
- [ ] Même trajet à 23 h, un dimanche, un jour férié : majorations attendues.
- [ ] Trajet vers l'aéroport : forfait ou supplément aéroport, champ « numéro de vol » à l'étape Coordonnées.
- [ ] Aller-retour avec retour de nuit : deux trajets dans le détail.
- [ ] 6 passagers : seuls les véhicules assez grands sont sélectionnables.
- [ ] Adresse hors zone : « sur devis » ou refus selon le réglage.
- [ ] Date trop proche, hors horaires : message clair.

### Envoi
- [ ] Sans service de réservation : envoi → « Demande envoyée » (jamais « confirmée ») et e-mail reçu par la boutique avec tous les détails.
- [ ] Avec service : e-mail « demande reçue » au client et notification à l'entreprise ; réservation visible dans `/admin`.
- [ ] Confirmation depuis `/admin` → e-mail de confirmation au client avec le fichier agenda.
- [ ] Paiement en ligne (mode test Stripe ou Shopify Payments en mode test) : page de paiement, montant exact,
      retour sur le site « Paiement en cours de vérification » puis « Réservation confirmée ».
- [ ] Modification de l'heure et annulation depuis `/admin` → e-mails au client.
- [ ] Rappel reçu pour une course confirmée dans les 24 h (`REMINDER_HOURS`).

### Contrôles techniques
- [ ] Clé Google ou jeton Mapbox restreints au domaine de la boutique ; clé de routage serveur restreinte à l'IP du service.
- [ ] Webhooks de paiement déclarés et secrets renseignés.
- [ ] Test de vitesse (PageSpeed Insights) sur l'accueil et la réservation.
- [ ] Données structurées valides (Test des résultats enrichis de Google) sur l'accueil et la FAQ.
