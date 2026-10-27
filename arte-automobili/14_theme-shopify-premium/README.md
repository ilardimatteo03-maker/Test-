# Arte Automobili : thème Shopify enrichi (version 2.1.0)

Copie de développement du thème **arte-automobili-vitrine-theme**, enrichie pour être réglable depuis l'éditeur de thème.
Les personnalisations déjà faites sur la boutique ont été conservées.

**Rien n'a été publié.** Le thème en ligne n'a pas été touché, et aucun réglage de la boutique, produit, commande, client,
application, domaine ou paiement n'a été modifié. Le livrable est un fichier ZIP à importer comme **nouveau thème non publié**,
pour le vérifier en aperçu avant toute décision.

| Fichier | Rôle |
| --- | --- |
| `arte-automobili-theme-premium.zip` | Le thème enrichi, à importer (voir § 3). |
| `theme/` | Les mêmes fichiers, décompressés (copie de développement). |
| `sauvegarde/` | L'export d'origine, intact, et sa procédure de restauration. |
| `apercus/` | Captures de la page de lancement, avec des données de test, en mise en scène cinématographique et sobre. |

---

## Espace client (2.1.0)

La version 2.1.0 ajoute un espace client et le programme de fidélité Arte Club : 12 sections, une page « Espace client »
et une page « Programme de fidélité », sans application. Activation et usage : `../15_espace-client/README.md`.

---

## Suppléments de prestation

Nouvelle section **« Suppléments de prestation »**, à ajouter où vous voulez depuis l'éditeur (Ajouter une section).
Elle ne modifie aucune page existante.

- **Contenu proposé :** 22 suppléments, répartis en 4 catégories.
  - Intérieur : shampooing, cuir, vapeur, ozone, poils d'animaux, ciel de toit, siège enfant, protection des tissus.
  - Extérieur : décontamination, phares, jantes, vitres, plastiques, insectes et goudron, moteur.
  - Protection et finition : cire, polissage, céramique, contrôle sous lumière.
  - Services : collecte et livraison, préparation à la vente, entretien régulier.
- **Prix et durées indicatifs**, à adapter : chaque supplément est un bloc (nom, description, prix libre comme
  « dès 40 € » ou « Sur devis », durée, icône, photo, badge, lien).
- **Deux présentations :**
  - « Carte élégante » : liste avec pointillés jusqu'au prix, catégories en colonnes ;
  - « Grille de cartes ».
- **Filtres par catégorie**, badges (Le plus demandé, Recommandé, Nouveau, Exclusif), mention et bouton vers le Contact.
- **Deux variantes prêtes à l'emploi :**
  - « Suppléments de prestation » : la carte complète ;
  - « Suppléments en grille » : les 7 suppléments mis en avant.
- **Modèle de page facultatif `supplements` :** créez une page « Suppléments » et choisissez ce modèle.

Fichiers ajoutés :
- `sections/supplements.liquid` ;
- `assets/supplements.css` et `assets/supplements.js`, chargés uniquement par cette section ;
- `templates/page.supplements.json`.

S'y ajoutent 4 icônes dans `snippets/icone.liquid` : phare, poils d'animaux, vapeur, ozone. Aperçus :
`apercus/supplements-*.jpg`.

---

## Correctif d'import (page d'accueil en 404)

Les premières versions importées affichaient une page 404 à la place de l'accueil. À l'import, Shopify refusait
silencieusement les sections contenant un réglage à curseur de **deux positions seulement** (par exemple
« colonnes sur mobile : 1 ou 2 »). Les modèles qui utilisaient ces sections étaient refusés aussi, dont celui de l'accueil
(`index.json`). Les outils de contrôle de Shopify ne signalent pas ce cas. Ces réglages sont désormais des listes
déroulantes (12 sections corrigées), et les scripts de génération bloquent tout curseur de moins de 4 positions.

---

## 1. Ce qui a été préservé

Avant toute modification, l'export du thème (21 octobre 2026, 14 h 27) a été analysé fichier par fichier.

**Vos personnalisations : fichiers jamais modifiés** (contrôlés octet par octet contre l'export) :

- `config/settings_data.json` : couleurs, signature « L'arte del riflesso. », noms, prix (60 €, 60 €, 100 €, Sur devis),
  descriptions, textes des boutons, photos des prestations 1 à 3 (vos images WhatsApp), prestation mise en avant.
- `templates/index.json` : votre photo et votre phrase du héros (« Le detailing haut de gamme, pensé dans les moindres détails. »),
  la photo de la section Approche, l'ordre des sections de l'accueil.
- Tous les autres modèles : `page.services.json`, `page.presentation.json`, `page.contact.json`, `password.json`, `404.json`, etc.

**Compatibilité des réglages :** aucun identifiant de réglage existant n'a été renommé ni supprimé, que ce soit dans
les réglages du thème ou dans les sections. Chaque valeur enregistrée retrouve donc son réglage. Les nouveaux réglages
ont des valeurs par défaut qui **reproduisent le rendu actuel** : tant que vous n'y touchez pas, le site reste identique.

**Vérification :** l'accueil, les Services, la Présentation, le Contact, la confirmation d'envoi, la page 404 et la page
mot de passe ont été rendus avec vos réglages réels, avant et après les modifications, sur ordinateur (1 440 px) et sur
mobile (390 px), puis comparés pixel par pixel. Le résultat est identique, à une différence d'un ou deux pixels près
sur le bord du logo de l'en-tête (lissage du SVG, invisible à l'œil nu).

---

## 2. Sauvegarde et retour en arrière

- `sauvegarde/theme_export__…__21OCT2026-0227pm.zip` est l'export d'origine, jamais modifié.
  Empreinte SHA-256 : `0b0dc41f…cbec5bf`. La procédure complète est décrite dans `sauvegarde/SAUVEGARDE.md`.
- Comme le thème publié n'est pas touché, il suffit de supprimer le thème importé pour tout annuler.
- Pour retrouver l'état d'origine dans un nouveau thème, importez le ZIP de `sauvegarde/` de la même façon (§ 3).
- Dans le dépôt Git, le commit « Import the live theme export as baseline » contient l'original. La commande
  `git diff ddf73c6 -- arte-automobili/14_theme-shopify-premium/theme` montre chaque ligne modifiée.

---

## 3. Importer et vérifier (sans publier)

1. Admin Shopify › **Boutique en ligne › Thèmes**.
2. Dans la bibliothèque de thèmes : **Ajouter un thème › Importer un fichier zip**, puis choisissez `arte-automobili-theme-premium.zip`.
3. Le thème apparaît **non publié** dans la bibliothèque. Votre thème actuel reste en ligne.
4. Sur le thème importé : **⋯ › Aperçu** pour parcourir le site, ou **Personnaliser** pour ouvrir l'éditeur.
5. Vérifiez au minimum l'accueil, les Services, la Présentation, le Contact (envoyez-vous un message de test) et l'aperçu mobile.
6. Ne publiez qu'une fois satisfait : **⋯ › Publier**. L'ancien thème reste alors dans la bibliothèque et peut être republié en un clic.

> Si vous avez modifié le thème en ligne **après** l'export du 21 octobre à 14 h 27, ces derniers changements ne figurent pas
> dans cette copie. Refaites-les dans le thème importé avant de le publier, ou demandez-moi de partir d'un nouvel export.

Vos photos sont stockées dans les Fichiers de la boutique (`shopify://shop_images/…`). Le thème importé les retrouve
automatiquement. Les pages déjà associées aux modèles `services`, `presentation` et `contact` les conservent.

---

## 4. Ce qui a changé dans les fichiers

### Fichiers modifiés de façon ciblée

| Fichier | Modification |
| --- | --- |
| `layout/theme.liquid` | Ajout de `sections.css` et `composants.js`. L'ancien bloc `<style>:root` est remplacé par le snippet `css-variables`, qui produit les mêmes valeurs par défaut. Ajout des classes d'animation sur `<body>`. Le reste est inchangé. |
| `layout/password.liquid` | Mêmes ajouts que `theme.liquid`, pour que la page mot de passe suive les réglages du thème. |
| `assets/base.css` | Les valeurs fixes (couleurs, tailles, rayons, espacements) deviennent des variables CSS dont la valeur par défaut est l'ancienne valeur. Les règles existantes sont conservées. |
| `config/settings_schema.json` | De 51 à 137 réglages. Ajouts uniquement : rien n'est renommé ni retiré. |
| `snippets/liens.liquid`, `reseaux.liquid`, `prestation.liquid` | Prise en charge des sous-menus, des icônes de réseaux (YouTube et WhatsApp en plus), de la durée, des prestations incluses et de l'affichage du prix. Le rendu par défaut est inchangé. |
| `sections/header-group.json` | Ajout d'une barre d'annonce **désactivée** avant l'en-tête. Votre réglage « Prendre rendez-vous » est conservé. |
| `sections/footer-group.json` | Le pied de page reçoit sous forme de blocs les quatre colonnes qu'il affichait déjà : logo, pages, contact, réseaux. |

### Fichiers réécrits en conservant leurs réglages

Ces fichiers ont dû être restructurés, car l'ajout de blocs et de dispositions demande un nouveau balisage. Pour chacun,
le schéma reprend **tous les réglages d'origine à l'identique** (mêmes identifiants), et le rendu par défaut a été
comparé pixel par pixel au rendu d'origine.

`sections/header.liquid`, `footer.liquid`, `hero.liquid`, `approche.liquid`, `cartes-services.liquid`, `bandeau.liquid`,
`main-services.liquid`, `presentation.liquid`, `main-contact.liquid`, `main-password.liquid` et `assets/theme.js`
(mêmes comportements, plus la gestion des sous-menus, de la barre d'annonce et du rechargement des sections dans l'éditeur).

### Fichiers ajoutés

- `assets/sections.css` : styles des nouvelles options et des nouvelles sections.
- `assets/composants.js` : comportements des sections (avant/après, FAQ, compteurs, vidéo, carte, visionneuse, compte à rebours, rotation des annonces).
- `assets/logo-principal-nero.svg`, `logo-vertical-nero.svg` : versions sombres du logo pour les fonds clairs.
- 19 nouvelles sections (voir § 6) et la barre d'annonce.
- 13 snippets : `css-variables`, `palette`, `section-style`, `alignement-vars`, `classes-body`, `bouton`, `icone` (35 icônes),
  `formulaire-email`, `media`, `bloc-contenu`, `tete-section`, `grille-style`, `visionneuse`.
- `templates/page.lancement.json` : page de lancement par URL (§ 7).
- `templates/page.histoire.json` : exemple de page « Notre histoire » composée de sections.

Aucune application, payante ou gratuite, n'est requise. Le thème n'utilise que des fonctions natives de Shopify.

---

## 5. Réglages du thème (Personnaliser › ⚙ Réglages du thème)

| Groupe | Contenu |
| --- | --- |
| **Identité visuelle** | Favicon, signature, image de partage. Logo principal, logo pour fonds clairs, logo mobile, logo secondaire (pied de page). Largeur du logo. Sans logo téléversé, les logos SVG de la marque sont utilisés. |
| **Couleurs** | Les six couleurs de la marque, plus les couleurs des liens, du survol, des bordures et des boutons. |
| **Typographies** | Polices de la marque (Bodoni Moda, Archivo, DM Mono) ou bibliothèque Shopify, au choix pour les titres et les paragraphes. Police des boutons, des menus et des chiffres. Graisse, interlignage, espacement des lettres, majuscules. Taille de chaque titre, de H1 à H6, et des paragraphes. |
| **Mise en page** | Largeur maximale, marges latérales, espacement entre sections, densité, arrondis, épaisseur des filets, espacement des cartes. |
| **Boutons** | Style par défaut : Plein, Contour, Minimaliste, Texte avec flèche ou Premium automobile. Arrondi, hauteur, espacement intérieur, taille, graisse, majuscules, effet au survol. Chaque bouton de section peut choisir son propre style. |
| **Animations** | Activation générale, apparition au défilement (fondu, fondu et montée, fondu et léger zoom), vitesse, léger zoom des images au survol, lame de lumière. Les animations respectent le réglage système « réduire les animations ». |
| **Mobile et tablette** | Marges, espacements, largeur du logo, tailles de H1 à H6 et des paragraphes sur mobile, animations sur mobile. |
| **Coordonnées** | Téléphone, e-mail, adresse, zone d'intervention, horaires. Ces informations sont reprises dans le pied de page, le Contact et les sections Coordonnées. |
| **Réseaux sociaux** | Instagram, Facebook, TikTok, LinkedIn, YouTube, WhatsApp. |
| **Prestations et tarifs** | Vos quatre prestations : nom, prix, description, photo, bouton. Nouveautés : **affichage du prix** (afficher, remplacer par « Sur devis » ou masquer), **durée indicative**, **prestations incluses** (une par ligne), affichage sur la page Services. |
| **Aide : pages et sections** | Mémo intégré à l'éditeur. |

Chaque section dispose aussi de réglages communs : couleurs (Nero, Verdaccio, Verde, Bianco, Travertino ou couleurs
personnalisées), image d'arrière-plan, largeur, espacements haut et bas (et sur mobile), filets, alignement et
**visibilité séparée sur ordinateur et sur mobile**.

---

## 6. En-tête, pied de page et sections

### En-tête
- **Fond :** transparent puis opaque au défilement (comportement actuel), toujours opaque, ou toujours transparent.
  L'en-tête peut rester visible au défilement et se réduire.
- **Disposition :** logo à gauche, au centre ou à droite ; menu à droite, au centre ou juste après le logo ; hauteurs sur
  ordinateur et sur mobile ; version claire ou sombre du logo.
- **Menu :** choisissez un menu de la navigation Shopify (Boutique en ligne › Navigation). Ses sous-éléments deviennent
  des menus déroulants, accessibles au clavier. Vide : les quatre pages du site.
- **Liens :** taille, graisse, majuscules, espacement, effet au survol. Couleurs du fond, du texte et du survol, opacité du fond.
- **Menu mobile :** plein écran, panneau latéral ou volet déroulant. Largeur de bascule, taille des liens, numérotation,
  bouton de rendez-vous, réseaux sociaux.
- **Barre d'annonce** (désactivée par défaut) : cliquez sur l'œil barré dans l'éditeur pour l'activer. Annonces
  fixes, en rotation ou en défilement, avec un lien facultatif pour chacune.

### Pied de page
Blocs à ajouter, masquer ou réordonner : Logo et signature, Menu (plusieurs possibles), Coordonnées, Réseaux sociaux
(noms ou icônes), Texte, Newsletter. La newsletter enregistre réellement les inscrits dans **Clients**, avec l'accord
marketing et le tag `newsletter`. Réglages : nombre de colonnes, alignement, taille du logo, mention de copyright
(`[annee]` et `[boutique]` sont remplacés automatiquement), politiques de la boutique, menu légal, moyens de paiement, couleurs.

### Bibliothèque de sections (Ajouter une section)

Toutes les sections peuvent être ajoutées sur n'importe quelle page et réorganisées par glisser-déposer.

| Catégorie | Sections |
| --- | --- |
| Existantes, enrichies | Héros (image ou vidéo, image mobile, cadrage, hauteur, composition, ombrage, reflet du titre, deux boutons) · Cartes de prestations · Approche · Bandeau final (4 variantes : bandeau, appel à l'action, prise de rendez-vous, promotion) · Services et tarifs · Présentation de l'entreprise (blocs « Valeur ») · Formulaire de contact |
| Contenu | Texte avec image (blocs surtitre, titre, texte, liste, bouton, espace) · Cartes avec icônes / Liste d'avantages · Étapes de prestation · Chiffres clés (compteurs animés) · Questions fréquentes (données structurées pour Google) · Bandeau défilant |
| Services | Grille de services (vos prestations ou des cartes libres, prix, durée, inclus, « Sur devis ») |
| Images et vidéo | Galerie d'images · Galerie de réalisations (avec visionneuse) · Avant / après (curseur, utilisable au clavier) · Vidéo plein écran / Vidéo avec texte (Shopify, YouTube ou Vimeo) |
| Confiance | Témoignages clients / Avis clients · Logos de partenaires |
| Contact | Coordonnées et horaires / Carte de contact · Carte et localisation (Google Maps chargé seulement au clic, pour la vie privée) · Réseaux sociaux |
| Lancement | Page de lancement (Coming Soon, voir § 7) |
| Utilitaires | Séparateur (filet, monogramme, lame de lumière) · Espacement · Code personnalisé (HTML ou Liquid) |

Soit 27 sections ajoutables aux pages, offertes en 36 variantes prêtes à l'emploi, plus la barre d'annonce, l'en-tête et le pied de page.

### Pages Services, Contact et Présentation
- **Services :** les tarifs viennent de Réglages du thème › Prestations et tarifs. Pour chaque prestation : prix affiché,
  remplacé par « Sur devis » ou masqué, durée, liste des prestations incluses. La section propose aussi trois dispositions,
  le format des images et l'affichage des photos et des numéros.
- **Contact :** formulaire natif Shopify, avec un **envoi réel** vers l'adresse e-mail de la boutique. Le téléphone, le
  motif (liste modifiable), la marque et le modèle, la date souhaitée, le message et la case de consentement RGPD s'activent
  chacun séparément. Le téléphone, le motif et le message peuvent être rendus obligatoires. Libellés, bouton, message de
  confirmation, coordonnées, horaires et réseaux affichés à côté sont réglables. Un lien `?service=interieur` depuis la page
  Services présélectionne le motif.
- **Présentation :** image, textes et bouton, plus des blocs « Valeur » à ajouter, supprimer ou réordonner. Toutes les
  sections de la bibliothèque peuvent s'ajouter en dessous. Le modèle `page.histoire` en donne un exemple.

---

## 7. Page de lancement (Coming Soon) : trois façons de l'utiliser

La section **Page de lancement** propose deux mises en scène :

- **Sobre** (par défaut) : la mise en page actuelle de votre page mot de passe. Votre page mot de passe reste donc
  **identique** tant que vous ne changez rien.
- **Cinématographique** : image ou vidéo plein écran, voile, lame de lumière, contenu centré ou en bas à gauche.

Les deux mises en scène acceptent :
- un **compte à rebours** réel, calculé sur le fuseau horaire choisi, avec un message à l'échéance ;
- une **liste d'attente** réelle : les adresses sont enregistrées dans **Clients**, avec l'accord marketing et le tag
  `liste-attente` (modifiable), puis exportables ;
- le logo, une date affichée, les réseaux sociaux, les coordonnées et l'accès par mot de passe.

| Méthode | Ce que voient les visiteurs | Comment faire |
| --- | --- | --- |
| **A. Page par URL** | La boutique reste ouverte ; la page de lancement est visible à son adresse (par ex. `/pages/bientot`), sans en-tête ni pied de page. Idéal pour une campagne ou un lien dans la bio Instagram. | Boutique en ligne › Pages › Ajouter une page, puis modèle **lancement**. Le modèle est préréglé en mise en scène cinématographique avec liste d'attente. |
| **B. Page d'accueil** | L'accueil affiche la section de lancement ; l'en-tête, le pied de page et les autres pages restent accessibles. | Personnaliser › Accueil › Ajouter une section › Page de lancement, en haut ; masquez éventuellement les autres sections (œil barré). |
| **C. Protection par mot de passe** | **Toute** la boutique est fermée ; seuls les visiteurs qui ont le mot de passe entrent. C'est la seule vraie fermeture du site avant l'ouverture. | Boutique en ligne › **Préférences › Protection par mot de passe** : activez-la et saisissez un message. La page affichée est la page mot de passe du thème (Personnaliser › menu des modèles › Mot de passe), réglable comme les autres. |

Un thème ne peut pas activer ni désactiver la protection par mot de passe : c'est un réglage de la boutique, que vous
seul pouvez modifier. Le texte vide de la section reprend le message saisi dans Préférences.

---

## 8. Tests réalisés

Les tests ont été faits **hors de Shopify** : les modèles sont rendus localement avec un moteur Liquid qui simule les
objets et filtres Shopify, puis ouverts dans Chromium.

- **Theme Check** (l'outil officiel de Shopify) : 0 erreur, 0 avertissement.
- **Non-régression** : pages actuelles identiques au pixel près, sur ordinateur et sur mobile (§ 1).
- **Tests fonctionnels**, tous réussis sur 10 pages de test, sur ordinateur et sur mobile :
  - aucune erreur JavaScript et aucun débordement horizontal ;
  - avant/après au clavier et au curseur ; FAQ qui n'ouvre qu'une réponse à la fois, avec ses données structurées ;
  - compteurs animés ; carte chargée seulement au clic ; visionneuse (ouverture, touche Échap, retour du focus) ;
  - rotation des annonces ; sous-menus au clavier et au toucher ; menu mobile et touche Échap ;
  - en-tête placé sous la barre d'annonce, puis réduit et opaque au défilement ;
  - compte à rebours (les secondes défilent, message à l'échéance) ;
  - formulaires client avec le bon tag ; champ mot de passe présent.

**Non testé, faute d'accès à votre boutique** (le connecteur Shopify demandait une nouvelle connexion) :
- le rendu dans l'éditeur Shopify réel, y compris les réglages conditionnels `visible_if` ;
- l'envoi effectif des formulaires et la création des clients ;
- les polices de la bibliothèque Shopify.

Ces points sont à vérifier lors de l'aperçu (§ 3).

---

## 9. Limites et points d'attention

- **Glisser-déposer :** on réordonne les sections et les blocs, pas des éléments libres au pixel près ; c'est le
  fonctionnement de tous les thèmes Shopify.
- **Polices :** les polices de la marque sont incluses dans le thème. Les autres viennent de la bibliothèque Shopify
  (sélecteur de police). Pour importer une police externe, il faudrait ajouter son fichier au thème.
- **Textes alternatifs :** les descriptions d'images de vos prestations et de l'accueil (`p1_alt`, etc.) décrivent encore
  les rendus 3D d'origine, alors que les photos sont désormais vos photos WhatsApp. Je ne les ai pas modifiées, car elles
  font partie de vos réglages. Pensez à les mettre à jour (Réglages du thème › Prestations et tarifs, et sections de l'accueil).
- **Section « Code personnalisé » :** un code incorrect peut casser l'affichage de la page. Elle est réservée aux modifications avancées.
- **Logo :** différence d'un ou deux pixels de lissage sur le bord du logo de l'en-tête, imperceptible.

---

## 10. Sources

Les schémas des sections sont générés par les scripts Python de `../_source/theme_premium/` :
`reglages_globaux.py`, `existantes.py`, `nouvelles.py` et `communs.py`. Ces scripts n'écrasent rien et peuvent être
relancés sans dommage. Le thème fonctionne sans eux : ils servent seulement à garder les schémas cohérents.
