# Site vitrine sur Shopify — Arte Automobili

Le site de `10_site-web` porté en thème Shopify (Online Store 2.0) : même direction artistique, mêmes quatre pages,
mêmes textes et tarifs. Aucune vente en ligne : pas de panier ni de fiche produit mises en avant.

| Fichier | Contenu |
|---|---|
| `arte-automobili-vitrine-theme.zip` | Le thème, prêt à importer (validé par Shopify Theme Check : 0 erreur, 0 avertissement) |
| `theme/` | Les sources du thème |
| `apercu-*.jpg` | Aperçus de l'accueil, des services et de la confirmation d'envoi (rendu local simulé) |

| Page | Adresse sur Shopify | Modèle du thème |
|---|---|---|
| Accueil | `/` | `index` |
| Services | `/pages/services` | `page.services` |
| Présentation | `/pages/presentation` | `page.presentation` |
| Contact | `/pages/contact` | `page.contact` |
| Mentions légales, Confidentialité | `/policies/…` | Politiques Shopify, liées dans le pied de page |

## Mise en ligne, dans l'ordre

1. **Importer le thème** : Boutique en ligne › Thèmes › *Ajouter un thème* › *Importer un fichier zip* ›
   `arte-automobili-vitrine-theme.zip`.
2. **Créer les pages** : Boutique en ligne › Pages › *Ajouter une page*. Le contenu peut rester vide : tout vient du thème.
   - « Services » → *Modèle de thème* : `services` ;
   - « Présentation » → *Modèle de thème* : `presentation` (l'adresse doit être `/pages/presentation`) ;
   - « Contact » : la page existe souvent déjà ; lui attribuer le modèle `contact`.
   Dans chaque page, *Modifier l'aperçu du référencement* pour la méta-description.
3. **Prévisualiser** le thème, puis *Publier*.
4. **Accueil** : Boutique en ligne › Préférences › titre et méta-description de la page d'accueil
   (proposition : « Arte Automobili — L'art du détail automobile »).
5. **Politiques** : Paramètres › Politiques › *Mentions légales* et *Politique de confidentialité*
   (Shopify propose des modèles ; y mentionner Arte Automobili, le SIRET, l'hébergeur Shopify, etc.).
   Elles apparaissent automatiquement dans le pied de page.
6. **Cookies** : Paramètres › Confidentialité des clients › activer la bannière de cookies
   (Shopify dépose des cookies techniques et statistiques : obligatoire pour les visiteurs européens).
7. **Retirer le mot de passe** de la boutique (Boutique en ligne › Préférences), ce qui nécessite un forfait payant.

Le menu se règle tout seul : sans menu choisi dans l'éditeur (En-tête › Menu), l'en-tête affiche les quatre pages.

## Le formulaire de contact

C'est le formulaire natif de Shopify : chaque demande est envoyée **par Shopify** à l'adresse e-mail de la boutique,
sans service tiers ni clé à configurer. Pour la recevoir sur votre adresse professionnelle, renseignez-la dans
Paramètres › Détails de la boutique (adresse e-mail de contact) et vérifiez Paramètres › Notifications ›
*E-mail de l'expéditeur* (selon la version de l'interface). Faites un essai après publication.

La confirmation « Merci, votre demande est bien partie » n'apparaît qu'après la réponse de Shopify ;
en cas d'erreur, Shopify renvoie le message et les champs déjà saisis. Shopify peut ajouter une vérification
anti-robot (hCaptcha) : c'est normal. Les champs Service, Véhicule, Date et Consentement figurent dans l'e-mail reçu.

## Modifier le contenu (éditeur de thème)

Boutique en ligne › Thèmes › *Personnaliser* :

- **Réglages du thème › Prestations et tarifs** : nom, prix affiché (« 60 € », « Sur devis »), description, photo,
  bouton, présence sur l'accueil, prestation valorisée. Utilisés sur l'accueil, la page Services et dans le formulaire.
- **Réglages du thème › Coordonnées** et **Réseaux sociaux** : un champ vide n'est pas affiché.
- **Textes et images de chaque page** : cliquer sur la section (Héros, Cartes de prestations, Approche, Bandeau final,
  Services et tarifs, Présentation, Contact). Une image téléversée remplace le rendu 3D fourni.
- **Réglages du thème › Identité** : favicon, signature, image d'aperçu de partage.

Les visuels fournis sont des **rendus 3D d'illustration** (modèle « Car Concept », Khronos Group, licence CC BY 4.0 :
crédit à mentionner dans les mentions légales tant qu'ils sont utilisés). Remplacez-les par vos photos.

## Nom de domaine

Paramètres › Domaines › *Connecter un domaine existant* (ou en acheter un). Chez votre registraire : un enregistrement
`A` pour le domaine vers `23.227.38.65` et un `CNAME` pour `www` vers `shops.myshopify.com` ; Shopify affiche les
valeurs exactes et active le HTTPS automatiquement.

## Différences avec la version Eleventy (`10_site-web`)

- Formulaire : natif Shopify au lieu de Netlify Forms / Web3Forms / Formspree.
- Mentions légales et confidentialité : politiques Shopify au lieu de pages du site. Le texte de confidentialité de
  `10_site-web` (« aucun cookie ») **ne s'applique pas** à Shopify.
- Adresses : `/pages/services` au lieu de `/services/`.
- Feuille de style générée depuis celle du site (`_source/build_site_shopify.py`) : une évolution du design se fait
  dans `10_site-web/src/assets/css/site.css`, puis on relance le script.
