# Installation et personnalisation

Le thème est **prêt à l'emploi** : toutes les pages, les menus, les liens et la réservation fonctionnent dès l'import,
sans créer de page ni de menu. Il reste à mettre votre logo et à adapter les contenus.
Le thème s'importe **sans être publié** : le site en ligne n'est pas modifié tant que vous ne cliquez pas sur « Publier ».

## 1. Importer le thème (2 minutes)

1. Admin Shopify › Boutique en ligne › **Thèmes** › Ajouter un thème › **Importer un fichier zip**.
2. Choisissez `dist/taxi-pro-theme-1.1.0.zip` (ou recréez-le : `node taxi-pro/tools/build-zip.mjs`).
3. Le thème apparaît dans la bibliothèque, **non publié**. Cliquez sur « Personnaliser ».

Tout est déjà en place :

| Page | Adresse | Où la modifier dans l'éditeur (menu déroulant du haut) |
| --- | --- | --- |
| Accueil (calculateur de prix) | `/` | Page d'accueil › Par défaut |
| Réservation | `/?view=reservation` | Page d'accueil › reservation |
| Nos services | `/?view=services` | Page d'accueil › services |
| Nos véhicules | `/?view=vehicules` | Page d'accueil › vehicules |
| Tarifs (générés depuis vos réglages) | `/?view=tarifs` | Page d'accueil › tarifs |
| À propos | `/?view=a-propos` | Page d'accueil › a-propos |
| Contact (formulaire Shopify) | `/?view=contact` | Page d'accueil › contact |
| Questions fréquentes | `/?view=faq` | Page d'accueil › faq |
| Conditions, confidentialité, mentions légales | `/policies/…` | Paramètres › **Politiques** (Shopify) |

Le menu de l'en-tête et du pied de page est **intégré au thème** et traduit automatiquement (FR, EN, NL, DE) :
aucun menu Shopify à créer. Chaque page a son propre titre et sa propre adresse canonique pour Google.

## 2. Personnaliser (l'essentiel)

1. **Logo** : Paramètres du thème (roue dentée) › Identité de l'entreprise › Logo (fonds clairs) et Logo (fonds foncés),
   favicon. Sans logo, le nom de la boutique s'affiche en texte.
2. **Coordonnées** : rien à saisir dans le thème. Le téléphone, l'e-mail et l'adresse sont repris automatiquement de
   Paramètres Shopify › **Détails de la boutique**. Pour afficher d'autres valeurs, remplissez Identité de l'entreprise
   (un champ rempli remplace la valeur de la boutique). Ajoutez-y WhatsApp, numéro d'entreprise, TVA, licence et réseaux sociaux.
3. **Politiques** : Paramètres Shopify › Politiques (conditions d'utilisation, confidentialité, mentions légales…).
   Elles apparaissent automatiquement dans le pied de page et la case « J'accepte les conditions » du formulaire de réservation y renvoie.
4. **Style** : Paramètres du thème › Style et préréglages : Premium Black, Corporate, Modern Taxi, Luxury Chauffeur ou Minimal,
   puis couleurs, polices, arrondis, boutons, animations (une couleur laissée vide = celle du préréglage).
5. **Tarifs** : Paramètres du thème › Tarifs et Majorations (prise en charge, prix au km, nuit, dimanche, aéroport…),
   puis, en bas de la liste des sections de n'importe quelle page, groupe « Pied de page » : **Véhicules (tarifs)**,
   Prestations, Options, Zones, Forfaits, Plages horaires. Détail des règles : `TARIFICATION.md`.
6. **Zone** : Paramètres du thème › Zone géographique : coordonnées de votre base (clic droit dans Google Maps), rayon,
   pays proposés dans la recherche d'adresse.
7. **Photos et textes** : image ou vidéo du héros, photos des véhicules (section « Véhicules (vitrine) » et « Véhicules (tarifs) »),
   textes des sections. Chaque section se modifie, se masque (icône œil), se déplace ou s'ajoute.

### Sections masquées à l'import (contenus à fournir)

Pour ne jamais publier de contenu inventé, trois sections sont **masquées** au départ. Remplissez-les puis réaffichez-les
avec l'icône œil :
- **Avis clients** (accueil) : vos vrais avis, avec la note de votre fiche Google ;
- **Chiffres clés** (accueil et À propos) : vos vrais chiffres ;
- **Équipe** (À propos) : vos chauffeurs.

Les véhicules, zones, forfaits et prix livrés sont des **exemples** (une société fictive à Bruxelles) à remplacer.

## 3. Envoi des réservations

**Dès l'import** : les demandes partent par le formulaire de contact natif de Shopify vers l'e-mail de la boutique
(Paramètres › Notifications). Le message contient le trajet, les coordonnées GPS, le véhicule, les options, le client et le
détail du prix. Le client voit « Demande envoyée, pas encore confirmée ». Pas de paiement en ligne ni d'e-mail automatique au client.

**Avec le service de réservation** (`BACKEND.md`) : prix revalidé côté serveur, paiement en ligne ou acompte, e-mails
automatiques au client (confirmation, rappel, modification, annulation), fichier agenda, tableau de bord.

**Recherche d'adresses** : réglée par défaut sur des services gratuits de démonstration (Photon, OSRM). Pour un usage réel,
ajoutez une clé Google Maps ou un jeton Mapbox (Paramètres du thème › Cartes et intégrations).

## 4. Vérifier puis publier

Suivez `TESTS.md` dans l'aperçu du thème (⋯ › Aperçu), sur ordinateur et sur téléphone, puis publiez (⋯ › Publier).
L'ancien thème reste dans la bibliothèque et peut être republié en un clic.

## 5. Facultatif : pages Shopify classiques

Une fois le thème publié, vous pouvez créer de vraies pages (Boutique en ligne › Pages) et leur associer les modèles
`reservation`, `services`, `vehicules`, `tarifs`, `a-propos`, `contact`, `faq` ou `legal`.
Shopify ne propose dans ce menu que les modèles du **thème publié**. Sélectionnez ensuite ces pages dans
Paramètres du thème › Réservation (Page de réservation) et **Pages du site** : menus et boutons y mèneront.
Pour utiliser vos propres menus Shopify : en-tête › « Liens du menu » et pied de page › bloc Menu › « Liens ».

## Réutiliser le thème pour une autre entreprise

Importez le même ZIP dans la boutique de l'autre entreprise et refaites l'étape 2 : aucune donnée d'une entreprise n'est
écrite dans le code. Un même service de réservation peut servir plusieurs entreprises (`backend/tenants.example.json`).
