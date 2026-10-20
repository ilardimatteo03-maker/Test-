# Boutique Shopify — Arte Automobili

Thème Shopify (Online Store 2.0) qui applique la direction artistique « La lampe d'inspection »,
catalogue de départ et visuels produits.

| Fichier | Contenu |
|---|---|
| `arte-automobili-theme.zip` | Le thème, prêt à importer (validé par Shopify Theme Check : 0 erreur, 0 avertissement) |
| `theme/` | Les sources du thème, modifiables |
| `produits-shopify.csv` | 8 produits au format d'import Shopify, **en brouillon** |
| `images-produits/` | Visuels 2000 × 2000 px de chaque produit |
| `apercu-*.jpg` | Aperçus de l'accueil et d'une fiche produit (rendu local simulé) |

## Mise en ligne, dans l'ordre

1. **Thème** — Admin Shopify › Boutique en ligne › Thèmes › *Ajouter un thème* › *Importer un fichier zip* ›
   `arte-automobili-theme.zip`. Prévisualiser, puis *Publier*.
2. **Produits** — Produits › *Importer* › `produits-shopify.csv`. Ils arrivent en brouillon, stock à 0.
3. **Images** — ouvrir chaque produit et déposer le visuel de `images-produits/` portant le même nom que son identifiant (*handle*).
4. **Collections** — créer trois collections automatiques :
   *Gamme atelier* (balise `gamme-atelier`), *Accessoires* (balise `accessoires`), *Coffrets et cartes cadeaux* (balise `cadeaux`).
5. **Menus** — Navigation › *Main menu* : Gamme atelier, Coffrets, Cartes cadeaux, L'atelier (lien vers le site vitrine).
   *Footer* : Livraison, Contact, Mentions légales.
6. **Personnaliser** (éditeur de thème) :
   - Accueil › *Collection en vitrine* : choisir *Gamme atelier* pour la première, *Coffrets et cartes cadeaux* pour la seconde ;
   - Réglages du thème › *Atelier* : lien « Demander un devis », téléphone, adresse, Instagram ;
   - Réglages › *Panier* : mention de livraison.
7. **Avant ouverture** — prix, stocks, frais de livraison, mentions légales et politiques (Réglages › Politiques),
   puis passer les produits en *Actif*.

## Ce que fait le thème

- Accueil : héros avec lame de lumière à l'ouverture, lampe qui suit le curseur, titre et son reflet ;
  collections en vitrine ; manifeste dont les mots s'allument au défilement ; image et texte ; engagements ; bandeau Verde.
- Fiche produit : galerie, choix de format en puces, quantité, prix en DM Mono, fiche technique à points de conduite,
  volets dépliables, données structurées Google.
- Collection avec tri et pagination, panier avec note de commande, recherche, blog « Journal de l'atelier »,
  page 404, page mot de passe « La boutique ouvre bientôt », carte cadeau, pages de compte client.
- Polices auto-hébergées (aucun appel à Google : RGPD), animations désactivées si l'utilisateur réduit les mouvements.

## À savoir avant de vendre

- Les **prix sont indicatifs** et les produits sont une **gamme à créer** : il faut un fabricant (marque blanche)
  et, pour des produits chimiques vendus dans l'UE, un étiquetage CLP et des fiches de données de sécurité.
- Les visuels sont des **illustrations** ; remplacez-les par des photos des vrais flacons dès qu'ils existent.
- L'aperçu fourni est un rendu local approximatif : vérifier l'affichage dans l'aperçu Shopify avant de publier.
