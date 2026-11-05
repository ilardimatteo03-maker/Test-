# Installation et configuration

Durée : environ une heure pour une première entreprise, sans écrire de code.
Le thème s'importe **sans être publié** : le site en ligne n'est pas modifié tant que vous ne cliquez pas sur « Publier ».

## 1. Importer le thème

1. Admin Shopify › Boutique en ligne › **Thèmes** › Ajouter un thème › **Importer un fichier zip**.
2. Choisissez `dist/taxi-pro-theme-1.0.1.zip` (ou recréez-le : `node taxi-pro/tools/build-zip.mjs`).
3. Le thème apparaît dans la bibliothèque, **non publié**. Cliquez sur « Personnaliser ».

## 2. Page de réservation : tout de suite, sans créer de page

La réservation complète est disponible dès l'import à l'adresse **`/?view=reservation`**
(dans l'éditeur : menu déroulant du haut › Page d'accueil › **reservation**). Tous les boutons « Réserver » du thème
y mènent tant que le réglage « Page de réservation » est vide. Le calculateur rapide du héros de l'accueil y envoie
aussi le visiteur, avec le trajet prérempli.

## 2 bis. Créer les pages et les associer aux modèles

> **Important :** dans Shopify, le menu « Modèle de thème » d'une page ne propose que les modèles du **thème publié**.
> Tant que TAXI PRO n'est pas publié, vous ne verrez pas « reservation », « services », etc. dans ce menu.
> Pour vérifier une page avant publication, ouvrez son modèle dans l'éditeur (menu déroulant du haut › Pages › modèle) :
> l'éditeur l'affiche avec une page existante, quel que soit son titre. Une fois le thème publié, associez les modèles :

Boutique en ligne › Pages › Ajouter une page. Pour chaque page, choisissez le **modèle** dans la colonne de droite :

| Page (titre conseillé) | Modèle | Adresse |
| --- | --- | --- |
| Réservation (facultative : `/?view=reservation` existe déjà) | `reservation` | /pages/reservation |
| Nos services | `services` | /pages/services |
| Nos véhicules | `vehicules` | /pages/vehicules |
| Tarifs | `tarifs` | /pages/tarifs |
| À propos | `a-propos` | /pages/a-propos |
| Contact | `contact` | /pages/contact |
| Questions fréquentes | `faq` | /pages/faq |
| Conditions générales, Politique de confidentialité, Politique de cookies, Mentions légales | `legal` | au choix |

Si vous créez la page « Réservation », indiquez-la ensuite dans Paramètres du thème › Réservation › **Page de réservation**.
Le contenu des pages légales se saisit dans l'éditeur de pages Shopify (texte juridique validé par votre conseil).
Le modèle `legal` ajoute automatiquement l'identification de l'entreprise (raison sociale, siège, numéros).
Pour le RGPD, Shopify propose aussi ses propres pages de politiques (Paramètres › Politiques).

## 3. Menus

Boutique en ligne › Navigation :
- **Menu principal** (`main-menu`) : Accueil, Services, Véhicules, Tarifs, À propos, Contact.
- **Pied de page** (`footer`) : Conditions générales, Confidentialité, Cookies, Mentions légales.

## 4. Paramètres du thème (roue dentée de l'éditeur)

| Catégorie | À faire |
| --- | --- |
| Style et préréglages | Choisir Premium Black, Corporate, Modern Taxi, Luxury Chauffeur ou Minimal ; ajuster les couleurs si besoin (une couleur vide = celle du préréglage). La lisibilité est vérifiée automatiquement : si l'accent est trop clair sur le fond, les liens passent dans la couleur du texte. |
| Typographie, formes, animations | Polices, tailles, arrondis, ombres, style des boutons et des champs, animations. |
| Identité de l'entreprise | Nom, logos (fonds clairs et foncés), favicon, téléphone, WhatsApp, e-mail, adresse, raison sociale, numéro d'entreprise, TVA, licence, réseaux sociaux, fiche Google. |
| Tarifs, Majorations et suppléments | Vos tarifs (voir `TARIFICATION.md`). Chaque supplément se désactive individuellement. |
| Zone géographique | Coordonnées de votre base (clic droit dans Google Maps), rayon, pays proposés, fuseau horaire. |
| Réservation | **Page de réservation** : vide pour `/?view=reservation`, ou la page créée à l'étape 2 bis ; délais, horaires, passagers max., modes de paiement, conditions générales. |
| Cartes et intégrations | Fournisseur d'autocomplétion et d'itinéraire, clés **publiques**, carte, URL du service de réservation. |
| Référencement et partage | Image de partage, données structurées TaxiService. |

## 5. Tarifs Taxi Pro (véhicules, forfaits, zones…)

Dans l'éditeur, en bas de la liste des sections, groupe **« Pied de page »**, six sections suivies de « (tarifs) » :

1. **Prestations** : gardez, renommez ou désactivez les 7 prestations d'exemple ; le **code** relie les boutons
   « Réserver ce service » au formulaire.
2. **Véhicules** : photo, capacité, équipements, règle de prix (coefficient ou tarif propre).
3. **Options** : prix fixe, à l'unité ou en pourcentage, restriction éventuelle à certaines prestations.
4. **Zones** : vos aéroports, gares et zones de référence (coordonnées + rayon ou polygone).
5. **Forfaits** : prix fixes entre zones (ex. centre-ville ↔ aéroport).
6. **Plages horaires** : majorations ponctuelles (heures de pointe, réveillon…).

Les données livrées sont **des exemples** (une société fictive à Bruxelles) : remplacez-les par les vôtres.

## 6. Contenus

Chaque section se modifie, se masque, se déplace ou s'ajoute depuis l'éditeur : héros (image ou vidéo, calculateur
rapide), services, étapes, véhicules, avantages, chiffres clés, avis clients, zones desservies, FAQ, appel à l'action,
image et texte, équipe, logos, carte, contact, grille tarifaire, texte, Liquid personnalisé.
Remplacez les avis, chiffres et membres d'équipe d'exemple par des informations réelles.

## 7. Envoi des réservations : deux niveaux

**Sans service de réservation (immédiat, gratuit)** : les demandes partent par le formulaire de contact natif de
Shopify vers l'e-mail de la boutique (Paramètres › Notifications › e-mail de l'expéditeur). Le message contient le
trajet, les coordonnées GPS, le véhicule, les options, le client et le détail du prix indicatif. Pas de paiement en
ligne, pas d'e-mail automatique au client : la confirmation se fait par vos soins.

**Avec le service de réservation** (`docs/BACKEND.md`) : prix revalidé côté serveur, paiement en ligne ou acompte,
e-mails automatiques au client (confirmation, rappel, modification, annulation), fichier agenda, tableau de bord.

## 8. Vérifier puis publier

Suivez la procédure de `TESTS.md` dans l'aperçu du thème (⋯ › Aperçu), sur ordinateur et sur téléphone.
Publiez ensuite (⋯ › Publier). L'ancien thème reste dans la bibliothèque et peut être republié en un clic.

## Réutiliser le thème pour une autre entreprise

Importez le même ZIP dans la boutique de l'autre entreprise et refaites les étapes 2 bis à 7 : aucune donnée d'une
entreprise n'est écrite dans le code. Un même service de réservation peut servir plusieurs entreprises
(`TENANTS_FILE`, voir `backend/tenants.example.json`).
