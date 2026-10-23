# Espace client et programme de fidélité : audit et plan

> **Décisions prises (23 octobre 2026) :**
> - aucune application ;
> - paiement sur place ;
> - une commande Shopify créée après chaque prestation ;
> - feu vert pour l'étape 1, réalisée : voir `README.md`.
>
> Les présélections d'applications ci-dessous restent valables pour une évolution future (créneaux en temps réel, carte Wallet).

Phases 1 et 2 de la mission. **Aucun fichier du thème n'a été modifié.** Ce document décrit l'existant, les contraintes
réelles de Shopify en 2026, l'architecture proposée, les coûts et les décisions qui vous reviennent avant tout développement.

---

## 0. Préalable bloquant : la page d'accueil du thème importé

Le thème enrichi (version 2.0.0) affiche une page 404 à la place de l'accueil, dans l'éditeur comme dans l'aperçu.
La cause n'est pas encore trouvée. Tous les fichiers passent les règles de validation officielles de Shopify et le
moteur Liquid officiel, en mode strict.

L'espace client sera construit **sur ce thème** : il faut d'abord qu'il fonctionne chez vous. Deux vérifications
suffisent pour avancer :

1. Sur la carte du thème importé (Boutique en ligne › Thèmes), un message d'erreur d'import est-il affiché ?
2. Importez le ZIP de sauvegarde (votre thème d'origine), sans le publier, et ouvrez son aperçu. Voyez-vous l'accueil ?

Si l'origine affiche aussi la 404, le problème ne vient pas du thème. Sinon, je cherche dans mes modifications.
Reconnecter le connecteur Shopify (claude.ai › Paramètres › Connecteurs) me permettrait de le vérifier en lecture seule.

---

## 1. Audit

### 1.1 Le thème

| Élément | Constat |
| --- | --- |
| Version | Copie de développement 2.0.0, avec votre export du 21 octobre comme base. Le thème en ligne n'a pas changé. |
| Système de design | Variables CSS globales (`--c-*` pour les couleurs, `--h1` à `--h6`, rayons, bordures, boutons). 7 palettes de section (Nero, Verdaccio, Verde, Bianco, Travertino, défaut, personnalisée). Polices de la marque : Bodoni Moda, Archivo, DM Mono. 5 styles de boutons. 35 icônes (`snippets/icone.liquid`). |
| Composants réutilisables | `section-style` (couleurs, espacements et visibilité communs), `bouton`, `icone`, `media`, `tete-section`, `formulaire-email`. Éléments JavaScript de `composants.js`. **L'espace client les réutilisera tous** : aucun second système de design. |
| Comptes clients | 7 modèles `templates/customers/*.liquid` très simples (connexion, compte, commandes, adresses…). Ils ne servent qu'avec les **anciens comptes clients** (voir § 1.2). L'en-tête n'a aucun lien vers le compte. |
| Formulaires existants | Contact (natif), newsletter et liste d'attente (création réelle de clients, avec un tag). |
| Prestations et prix | Gérés dans Réglages du thème › Prestations et tarifs : **affichage seulement**. Ce ne sont pas des données de vente : rien ne peut être réservé ni payé à partir de ces prix. |
| Applications | Aucune application détectée dans le thème : ni bloc, ni intégration. Je ne vois pas l'administration de la boutique ; une application installée sans présence dans le thème m'échapperait. |
| À ne jamais modifier | `config/settings_data.json`, `templates/index.json`, `page.services.json`, `page.presentation.json`, `page.contact.json`, `password.json`. Aucune section existante ne sera touchée, à une exception facultative près (§ 3.3). |

### 1.2 Les contraintes réelles de Shopify (octobre 2026)

**Comptes clients.** Shopify a déprécié les anciens comptes clients en février 2026. Ils ne sont plus disponibles pour
les nouvelles boutiques ni pour celles qui ne les utilisaient pas déjà
([source](https://tenten.co/shopify/shopify-legacy-customer-accounts-are-deprecated-what-you-need-to-know/),
[source](https://revize.app/blog/shopify-legacy-customer-accounts-deprecated-upgrade-guide)).
Votre boutique est récente : elle utilise très probablement les **nouveaux comptes clients**. À vérifier dans
Paramètres › Comptes clients. Conséquences :

- **Inscription et connexion** sont gérées par Shopify, par un code à usage unique envoyé par e-mail. **Il n'y a pas de
  mot de passe**, donc pas de « mot de passe oublié » : c'est voulu, et c'est plus sûr. La page « Réinitialiser le mot de
  passe » demandée n'a donc pas d'objet avec ces comptes.
- **Les pages Profil, Adresses, Commandes et Préférences** sont hébergées par Shopify. Elles se personnalisent par
  l'image de marque (logo, couleurs) et par des extensions d'application, **pas par le thème**.
- **Le thème** peut afficher une page « Espace client » sur votre site avec les données du client connecté (objet `customer`).
  Des développeurs signalent que cet objet est parfois vide avec les nouveaux comptes
  ([source](https://community.shopify.dev/t/customer-liquid-object-not-working-on-new-accounts/10114)).
  L'espace client affichera alors l'invitation à se connecter, jamais des données fausses. Shopify garantit qu'un client
  ne voit que ses propres données.
- Depuis juin 2026, les données d'une application rangées dans la fiche client (métachamps) doivent être explicitement
  autorisées pour être lues dans les comptes clients ([source](https://tenten.co/shopify/shopify-legacy-customer-accounts-are-deprecated-what-you-need-to-know/)).

**Ce qu'un thème ne peut pas faire seul :** stocker des points, calculer des disponibilités réelles, empêcher une double
réservation, envoyer des rappels, générer un QR code vérifiable ou une carte Apple ou Google Wallet. Un thème affiche ;
il ne conserve aucune donnée. Ces fonctions demandent une application, ou un développement côté serveur.

**Shopify Flow** (automatisations) est inclus dans le forfait Basic depuis juillet 2023
([source](https://changelog.shopify.com/posts/shopify-flow-now-available-to-basic-plan)). Il sait ajouter un tag ou
modifier un champ client après une commande. Il ne convient pas comme moteur de points : il ne gère ni les échanges de
récompenses, ni les codes de réduction, ni la protection contre les doubles déductions. Il est en revanche parfait
pour les **niveaux** (§ 2.3).

---

## 2. Architecture proposée

```
┌──────────────────────────────── THÈME (interface, entièrement réglable) ────────────────────────────────┐
│  Espace client · Carte de fidélité · Programme · Réservation (habillage) · Historique · Profil (liens)  │
└────────────────────────────────────────▲──────────────────────────────▲─────────────────────────────────┘
                                         │ lit                          │ lit
┌──────────────── SHOPIFY NATIF (gratuit) ────────────────┐   ┌──────────── APPLICATIONS (données métier) ────────────┐
│  Comptes clients · Prestations = produits (vrais prix)  │   │  Réservation : créneaux, statuts, rappels, admin      │
│  Commandes = historique · Caisse (POS) · Flow · E-mails │◄─►│  Fidélité : points, récompenses, historique, codes    │
└─────────────────────────────────────────────────────────┘   │  Carte Wallet + QR vérifiable (option)                │
                                                              └────────────────────────────────────────────────────────┘
```

### 2.1 Le principe clé : chaque prestation devient un produit Shopify

Lavage intérieur (60 €), Lavage extérieur (60 €) et Lavage intérieur + extérieur (100 €) deviennent trois produits.
Les professionnels restent sur devis, via le formulaire de contact. Ainsi :

- **les prix réels** se modifient dans Produits, sans code. Ils sont séparés des textes et des couleurs du thème ;
- chaque réservation crée **une commande**, payée en ligne, par acompte ou sur place avec la caisse Shopify (POS, gratuite) ;
- **l'historique des prestations** est la liste des commandes du client : une donnée native, fiable, sans double saisie ;
- **les points** sont attribués automatiquement par l'application de fidélité sur les commandes payées. Les
  remboursements, la protection contre la fraude et l'unicité des récompenses sont gérés côté serveur par l'application.

Cela suppose de **créer trois produits**. C'est une modification du catalogue : elle demande votre accord (décision 3).

### 2.2 Réservation : présélection

Tarifs relevés en octobre 2026 dans des comparatifs, **à vérifier sur chaque fiche** avant installation
([source](https://opencals.com/blog/best-shopify-appointment-apps), [source](https://cowlendar.com/blog/best-shopify-appointment-booking-apps-for-service-businesses-(2026)),
[source](https://www.shopify.com/blog/appointment-booking-app)).

| Application | Prix | Points notés | À vérifier |
| --- | --- | --- | --- |
| Easy Appointment Booking | Gratuit, puis 15, 29 ou 39 $/mois | Portail client avec modification du rendez-vous | Temps tampon, capacité, fermetures, annulation |
| Opencals | 0,99 $ par réservation honorée, ou dès 15 $/mois | Calendrier intégré aux comptes clients | Capacité, rappels |
| Cowlendar | Gratuit (5 réservations), puis dès 13,99 $/mois | Formule selon le chiffre d'affaires réservé | Portail client |
| Sesami | Dès 19 $/mois | Caisse POS ; modification et annulation par le client à 129 $/mois | Trop cher pour ce besoin |

**Recommandation :** essayer deux applications sur leur formule gratuite, avec ce thème non publié, puis choisir selon
cette liste :
- créneaux réels ;
- durée de chaque prestation et temps de préparation ;
- jours fermés et congés ;
- capacité par jour ;
- délai minimum avant un rendez-vous ;
- modification et annulation par le client selon vos règles ;
- e-mails de confirmation et de rappel ;
- affichage des rendez-vous dans le compte client ;
- caisse POS ;
- création d'une commande Shopify (indispensable pour les points).

### 2.3 Fidélité : présélection

| Application | Formule gratuite | Payant | Remarques |
| --- | --- | --- | --- |
| Rivo | 200 commandes/mois, points | Caisse dès 15 $/mois | [source](https://joy.so/blog/best-free-shopify-loyalty-apps/) |
| BON Loyalty | 150 commandes/mois | Caisse dès 29 $, niveaux à 129 $ | Les sources divergent |
| Joy | 150 commandes/mois | 29 $ ; niveaux, caisse et API à 129 $ ; Wallet inclus selon la formule | [source](https://www.rivo.io/blog/joy-loyalty-pricing) |
| Smile | Caisse citée dans la formule gratuite | — | À vérifier |

**Les niveaux de fidélité** sont souvent réservés aux formules à 129 $/mois. Il existe une alternative gratuite et fiable :
une automatisation Shopify Flow attribue un tag de niveau selon le montant total dépensé (par exemple `niveau-argento` et
`niveau-oro`). Le calcul a lieu côté serveur, et le thème se contente de lire le tag.

**Carte Wallet et QR code vérifiable.** Deux possibilités :
- l'application de fidélité, si sa formule inclut les cartes Wallet ;
- SleekPass, à 4,99 $/mois : une carte Apple ou Google Wallet qui affiche les données du client, sans moteur de points
  ([source](https://www.thepassstudio.com/compare/shopify-wallet-pass-apps)).

**Aucun QR code décoratif ne sera affiché** : le QR code n'apparaît que s'il est fourni et vérifiable par l'application.

### 2.4 Paiement (décision 2)

| Option | Avantage | Contrainte |
| --- | --- | --- |
| En ligne à la réservation (Bancontact, carte…) | Le plus simple ; les points sont automatiques | Le client paie avant la prestation |
| Acompte | Réduit les absences | Selon l'application de réservation |
| Sur place, avec Shopify POS (application gratuite) | Habitudes inchangées | La vente doit être rattachée au client dans la caisse pour attribuer les points |

---

## 3. Ce qui sera créé dans le thème (approche additive)

### 3.1 Pages
- `templates/page.espace-client.json`, à attribuer à une page « Espace client » (`/pages/espace-client`).
- `templates/page.fidelite.json` : page publique du programme (niveaux, paliers, façons de gagner des points, conditions, FAQ).

### 3.2 Sections nouvelles (chacune avec les réglages communs du thème et des blocs réorganisables)

| Section | Contenu | Données |
| --- | --- | --- |
| Accès à l'espace | Pour le visiteur non connecté : avantages, boutons « Se connecter » et « Créer un compte » | Connexion Shopify réelle |
| Bienvenue | « Benvenuto, Matteo. », phrase réglable, niveau, points, bouton de réservation, notification | Prénom (natif), niveau et points (application ou Flow) |
| Navigation | Rubriques sous forme de blocs (libellé, icône, ordre, visibilité) ; colonne latérale sur ordinateur, barre d'onglets en bas sur mobile | — |
| Vue d'ensemble | Cartes sous forme de blocs : fidélité, points, récompenses, prochain rendez-vous, historique, niveau, avantages. Titre, icône, description et couleurs réglables | **Une carte sans donnée réelle est masquée pour le client.** Elle n'est signalée qu'à vous, dans l'éditeur |
| Carte de fidélité | Logo, nom, identifiant, points, niveau, progression, avantages. Couleurs, dégradés, format, arrondis, ombres, police, disposition, couleurs par niveau, éléments masquables | Natif et application ; QR et Wallet par l'application |
| Mes prestations | Prestation, date, montant, statut, bouton « Réserver à nouveau » | Commandes Shopify |
| Prendre rendez-vous / Mes rendez-vous | Habillage (titres, textes, conditions) autour du calendrier et de la liste fournis par l'application | Application de réservation |
| Mes récompenses | Paliers et récompenses présentés, avec un bouton d'échange | Application de fidélité |
| Profil et paramètres | Raccourcis vers les pages Shopify : profil, adresses, commandes, préférences de communication, déconnexion | Natif |

Fichiers associés : `assets/espace-client.css` et `espace-client.js`, chargés **uniquement par ces sections**. Le layout
n'est pas modifié. Un snippet `ec-donnees.liquid` réunit en un seul endroit la lecture des données
(métachamps, tags, application) : changer d'application ne demandera qu'une modification à cet endroit.

### 3.3 Fichiers existants modifiés (strict minimum)
- `config/settings_schema.json` : **ajout** d'un groupe « Espace client et fidélité » (nom du programme, nom et couleurs
  des niveaux, textes affichés). Ce sont des réglages d'affichage, sans effet sur les vrais seuils.
- `sections/header.liquid` (facultatif) : un accès « Mon compte » dans l'en-tête, derrière un réglage **désactivé par
  défaut**. Tant que vous ne l'activez pas, l'en-tête reste identique au pixel près.
- Rien d'autre. Une sauvegarde du thème et un contrôle pixel par pixel des pages existantes accompagneront chaque étape,
  comme pour la version 2.0.0.

---

## 4. Ce qui fonctionnera réellement, et quand

| Fonctionnalité | Étape | Source des données |
| --- | --- | --- |
| Créer un compte, se connecter, se déconnecter | 1 | Shopify (natif) |
| Mot de passe | — | Sans objet avec les nouveaux comptes (connexion par code) |
| Profil, adresses, préférences de communication | 1 | Pages Shopify (liens depuis l'espace) |
| Tableau de bord personnalisé, navigation, page du programme | 1 | Thème et prénom (natif) |
| Historique des prestations, « Réserver à nouveau » | 1, puis complet dès que les prestations passent par des commandes | Commandes Shopify |
| Carte de fidélité (visuel, nom, identifiant) | 1 | Thème et natif |
| Points, historique des points, récompenses, échanges, codes de réduction | 2 | Application de fidélité |
| Niveaux | 2 | Application (formule payante) ou Flow et tags (gratuit) |
| Bonus d'inscription, d'anniversaire, de première visite, promotions temporaires, expiration | 2 | Application de fidélité (selon formule) |
| Créneaux réels, réservation, modification, annulation, statuts | 2 | Application de réservation |
| Confirmations, rappels | 2 | Application de réservation et e-mails Shopify |
| Administration des rendez-vous, points après prestation terminée | 2 | Application et administration Shopify |
| QR code vérifiable, Apple et Google Wallet | 3 | Application de fidélité ou de carte Wallet |
| Véhicule saisi à la réservation | 2 | Champs personnalisés de l'application de réservation |
| « Mon garage » (plusieurs véhicules enregistrés) | 3, facultatif | Stockage par client : extension de compte client ou petite application personnalisée (devis à part) |

### Ce que l'éditeur de thème pourra régler, et ce qu'il ne pourra pas
- **Oui :** tous les textes, couleurs, polices, tailles, espacements, rayons, ombres, icônes, images, boutons,
  animations, l'ordre et la visibilité des modules et des rubriques, l'affichage sur ordinateur et sur mobile, le design
  de la carte et les messages (bienvenue, progression, état vide, succès, erreur).
- **Non, par principe :** les vrais prix (dans Produits), les règles de points, les seuils réels, les récompenses
  (dans l'application de fidélité), les disponibilités et les règles d'annulation (dans l'application de réservation).
  Modifier un texte ne changera donc jamais un prix, un solde ou une règle.
- **Non, par limite de Shopify :** la mise en page des pages de compte hébergées par Shopify. Seuls le logo et les couleurs
  s'y règlent dans Paramètres › Image de marque.

---

## 5. Coûts récurrents estimés (à vérifier sur les fiches)

| Poste | Fourchette |
| --- | --- |
| Shopify | Inchangé. La caisse POS Lite et Flow sont inclus. |
| Réservation | 0 à 39 $/mois (ou 0,99 $ par réservation) |
| Fidélité | 0 $ (formule gratuite, niveaux par Flow) à 129 $/mois (niveaux, caisse, API) |
| Carte Wallet | 0 $ si incluse, sinon environ 5 $/mois |
| **Total** | **Démarrage : 0 à 20 $/mois. Version complète : environ 50 à 170 $/mois.** |

Aucune application ne sera installée sans votre accord. Je ne peux de toute façon pas en installer : c'est vous qui le
faites depuis l'administration Shopify.

---

## 6. Sécurité et RGPD
- Authentification par Shopify ; Shopify sépare les données de chaque client.
- Aucune donnée personnelle dans le JavaScript public ; le thème n'affiche que les données du client connecté.
- Points, récompenses et rendez-vous sont validés côté serveur, par Shopify ou les applications, jamais dans le navigateur.
- Collecte minimale : l'immatriculation reste facultative. La date de naissance n'est demandée que pour le bonus
  d'anniversaire, avec consentement explicite.
- Consentement marketing géré nativement. Contrats de traitement des données à vérifier pour chaque application retenue.

---

## 7. Étapes proposées

| Étape | Contenu | Prérequis |
| --- | --- | --- |
| 0 | Faire fonctionner l'accueil du thème importé | Les deux vérifications du § 0 |
| 1 | Développement dans le thème : espace client, page du programme, carte (visuel), historique, navigation, réglages | Vos décisions 1, 3 et 6 |
| 2 | Raccordement des applications de réservation et de fidélité, niveaux par Flow ou par l'application | Applications choisies et installées par vous |
| 3 | Carte Wallet et QR code, « Mon garage », extensions de compte client | Selon budget |

Chaque étape s'accompagne de tests : connexion, affichage des données du bon client, contrôle pixel par pixel des pages
existantes, mobile, accessibilité. Elle se termine par un thème non publié à vérifier avant publication.

---

## 8. Décisions qui vous reviennent
1. **Type de comptes clients :** dans Paramètres › Comptes clients, s'agit-il des nouveaux comptes (connexion par code) ou des anciens ?
2. **Paiement :** en ligne, par acompte ou sur place (caisse Shopify) ?
3. **Prestations en produits :** acceptez-vous que les trois prestations deviennent des produits Shopify ? Vous les créez,
   ou je vous donne les fiches prêtes.
4. **Budget mensuel** pour les applications, et accord pour essayer leurs formules gratuites.
5. **Niveaux :** gratuits par Flow et tags, ou via l'application de fidélité (formule payante) ?
6. **Feu vert pour l'étape 1**, une fois l'étape 0 réglée.
