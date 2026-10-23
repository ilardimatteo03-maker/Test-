# Espace client et programme Arte Club (thème 2.1.0)

L'étape 1 est développée **sans aucune application**, avec un paiement sur place. Elle s'ajoute au thème enrichi
(`14_theme-shopify-premium`) : même ZIP, toujours **non publié**. Le plan d'origine se trouve dans `AUDIT-ET-PLAN.md`.

> **Préalable toujours ouvert :** chez vous, l'accueil du thème importé affiche une page 404. Tant que ce point n'est pas
> réglé, l'espace client ne peut pas être vérifié dans votre boutique (voir `AUDIT-ET-PLAN.md`, § 0).

---

## 1. Ce que voit le client

| Rubrique | Contenu | D'où viennent les données |
| --- | --- | --- |
| **Accès** (visiteur) | Avantages du club, boutons « Se connecter » et « Créer un compte », carte d'exemple | Connexion Shopify réelle (code par e-mail) |
| **Bienvenue** | « Benvenuto, Matteo. », niveau, points, prochain rendez-vous, message personnel | Prénom (Shopify), métachamps de la fiche client |
| **Vue d'ensemble** | Cartes réglables : points, prochain niveau, prochain rendez-vous, prestations, carte, avantages | Idem |
| **Ma carte** | Carte digitale (logo, nom, numéro, points, niveau), progression, bouton « Présenter ma carte » avec QR code | Idem ; le QR code est généré dans la page |
| **Historique des points** | Date, opération, points gagnés ou utilisés, solde | Métachamp `arte.historique_points` |
| **Demander un rendez-vous** | Prestation (prix, durée), dates souhaitées, moment, véhicule, demandes particulières, accord | Formulaire de contact Shopify : la demande arrive dans votre boîte e-mail |
| **Mes rendez-vous** | À venir et passés, avec statut (confirmé, en attente, terminé, annulé) | Métachamp `arte.rendez_vous` |
| **Mes prestations** | Date, prestation, montant, statut du paiement, « Réserver à nouveau » | Commandes Shopify |
| **Récompenses** | Paliers, disponibles ou non, avec ce qu'il manque | Réglages de la section et solde de points |
| **Profil et paramètres** | Informations, préférences e-mail, garage, liens du compte, déconnexion | Shopify, plus le métachamp `arte.vehicules` |

La page publique **Programme de fidélité** (`/pages/fidelite`) présente le club : comment ça marche, les 4 niveaux et
leurs avantages, les récompenses, une FAQ et un appel à rejoindre le club.

Sur mobile, la navigation devient une barre d'onglets en bas de l'écran (Aperçu, Carte, Réserver, Profil). Sur
ordinateur, c'est une colonne latérale. Les deux sont réglables.

**Rien n'est inventé.** Un nouveau client voit 0 point, le niveau 1 et des messages d'attente
(« Aucun rendez-vous à venir »). Des données fictives n'apparaissent **que dans l'éditeur de thème**, signalées par un
bandeau, pour que vous puissiez régler la mise en page.

Aperçus dans `apercus/` :
- tableau de bord, sur ordinateur et sur mobile ;
- carte de fidélité et « Présenter ma carte » ;
- demande de rendez-vous ;
- page visiteur ;
- niveaux.

---

## 2. Mise en route dans Shopify (une seule fois, environ 20 minutes)

1. **Importez le thème** `14_theme-shopify-premium/arte-automobili-theme-premium.zip` comme thème non publié (comme pour la 2.0.0).
2. **Comptes clients :** Paramètres › Comptes clients. Vérifiez que l'option est activée. Les comptes récents se
   connectent par un code envoyé par e-mail, sans mot de passe.
3. **Créez les métachamps clients :** Paramètres › Données personnalisées › Clients › Ajouter une définition.
   Pour chaque ligne, saisissez l'espace de noms et la clé exactement comme indiqué.

   | Nom affiché (libre) | Espace de noms et clé | Type | Rôle |
   | --- | --- | --- | --- |
   | Points | `arte.points` | Nombre entier | Solde de points actuel |
   | Points cumulés | `arte.points_cumules` | Nombre entier | Total gagné (facultatif, sert si le niveau dépend des points) |
   | Historique des points | `arte.historique_points` | Texte multiligne | Une ligne par opération |
   | Rendez-vous | `arte.rendez_vous` | Texte multiligne | Une ligne par rendez-vous |
   | Véhicules | `arte.vehicules` | Texte multiligne | Une ligne par véhicule |
   | Message au client | `arte.message` | Texte sur une ligne | Notification personnelle (facultative) |
   | Niveau imposé | `arte.niveau` | Texte sur une ligne | Facultatif : impose un niveau (ex. « Nero » pour un client VIP) |

4. **Créez les pages :** Boutique en ligne › Pages › Ajouter une page.
   - « Espace client » : modèle **espace-client**. L'adresse doit se terminer par `espace-client`.
   - « Programme de fidélité » : modèle **fidelite**. L'adresse doit se terminer par `fidelite`.
5. **Rendez l'espace accessible :** Personnaliser › En-tête › « Espace client » › cochez **Afficher l'accès à l'espace
   client**. Une icône « Mon espace » apparaît. Vous pouvez aussi ajouter la page à votre menu (Boutique en ligne › Navigation).
6. **Réglez le programme :** Personnaliser › ⚙ Réglages du thème › **Programme de fidélité**. Vous y trouvez le nom du
   club, le nom des points, le critère de niveau (prestations, montant dépensé ou points cumulés), ainsi que le nom, le
   seuil et la couleur des 4 niveaux. Les valeurs proposées (3, 6 et 10 prestations) sont des exemples.

---

## 3. Au quotidien

### Après une prestation payée sur place (environ 1 minute)
1. Commandes › **Créer une commande** › choisissez le client.
2. Ajoutez la prestation : article personnalisé « Lavage intérieur », 60 €, ou un produit si vous en créez un.
3. **Marquer comme payée** (espèces ou terminal).
4. Mettez à jour les points dans la fiche du client (voir ci-dessous), à la main ou automatiquement avec Shopify Flow (§ 4).

La prestation apparaît aussitôt dans « Mes prestations ». Le niveau, s'il dépend du nombre de prestations ou du
montant dépensé, se met à jour tout seul.

### Format des lignes (fiche client › Métachamps)
Les champs « | » séparent les colonnes. Une ligne par élément ; les lignes dont la date est illisible sont ignorées.

```
arte.historique_points   AAAA-MM-JJ | libellé | points | solde (facultatif)
                         2026-10-23 | Lavage intérieur | +60 | 220
                         2026-11-02 | Récompense : réduction 15 € | -250 | 30

arte.rendez_vous         AAAA-MM-JJ HH:MM | prestation | statut | véhicule (facultatif)
                         2026-11-04 10:00 | Lavage intérieur + extérieur | Confirmé | Porsche 911
                         (statuts reconnus : Confirmé, En attente, Terminé, Annulé)

arte.vehicules           marque et modèle | immatriculation (facultative)
                         Porsche 911 Carrera | 1-ABC-123
```

### Demandes de rendez-vous
- La demande arrive par e-mail, à l'adresse de la boutique. Elle contient la prestation, les dates, le moment, le
  véhicule, le téléphone et le numéro de carte.
- Vous confirmez au client par e-mail ou par téléphone, puis vous ajoutez la ligne dans `arte.rendez_vous` avec le
  statut « Confirmé ». Le client la voit dans son espace.
- Pour une modification ou une annulation, mettez à jour la ligne (par exemple « Annulé »). L'espace client invite le
  client à vous contacter (téléphone, WhatsApp, e-mail, d'après Réglages du thème › Coordonnées).

### Récompenses
Le client présente sa carte et vous appliquez l'avantage. Diminuez ensuite `arte.points` et ajoutez une ligne
« Récompense … | -250 » dans l'historique. Le statut « Disponible » de chaque récompense est calculé à partir du solde.

### QR code « Présenter ma carte »
Scannez-le avec l'appareil photo d'un téléphone connecté à Shopify (application Shopify ou navigateur) : la **fiche
du client** s'ouvre dans votre administration. Pour toute autre personne, le code ne mène qu'à une page de connexion
Shopify. Il ne contient qu'un identifiant, aucune donnée personnelle.

---

## 4. Points automatiques avec Shopify Flow (facultatif, gratuit)

Shopify Flow est l'outil d'automatisation de Shopify. Il est inclus dans votre forfait, mais **il s'installe** depuis
l'App Store Shopify. Si vous préférez n'installer aucune application, même celles de Shopify, gérez les points à la main.

Recette proposée, à 1 point par euro :
- **Déclencheur :** « Commande payée » (*Order paid*).
- **Action :** « Mettre à jour le métachamp client » (*Update customer metafield*), espace de noms `arte`, clé
  `points`, type Nombre entier, avec cette valeur :
  ```liquid
  {%- assign actuel = 0 -%}{%- for mf in order.customer.metafields -%}{%- if mf.namespace == "arte" and mf.key == "points" -%}{%- assign actuel = mf.value | plus: 0 -%}{%- endif -%}{%- endfor -%}{{ order.currentSubtotalPriceSet.shopMoney.amount | plus: actuel | round }}
  ```
- **Action facultative :** ajouter la ligne à l'historique, sur le même principe.

**À tester sur une commande d'essai avant usage réel.** Je n'ai pas pu tester cette recette : je n'ai pas accès à votre
boutique, et les noms de variables de Flow peuvent varier. Un remboursement ne retire pas les points automatiquement :
corrigez le solde à la main.

---

## 5. Réglages disponibles dans l'éditeur

Chaque section reprend les réglages communs du thème : couleurs (palettes de la marque ou personnalisées), largeur,
espacements, et affichage séparé sur ordinateur et sur mobile.

| Section | Réglages principaux |
| --- | --- |
| Mon espace : accès | Textes, boutons et style, mention, carte d'exemple, avantages (blocs : icône, titre, texte) |
| Mon espace : bienvenue | Salutation fixe ou selon l'heure (Buongiorno, Benvenuto, Buonasera), phrase, informations affichées, message personnel, notification pour tous, 2 boutons (texte, cible, style), image de fond |
| Mon espace : navigation | Colonne latérale ou onglets sur ordinateur, barre en bas ou onglets sur mobile, icônes, largeur. Rubriques (blocs) : libellé, libellé court mobile, icône, cible, présence dans la barre mobile |
| Mon espace : synthèse | Colonnes. Cartes (blocs) : information affichée, titre, icône, description, texte d'attente, lien, apparence |
| Mon espace : carte | Format horizontal ou vertical, fond (couleur du niveau, dégradé, image), couleur du texte, motif (Linea, monogramme), reflet, arrondi, relief, police du solde, logo (type, taille, position), informations visibles, messages de progression, QR code (bouton, sur la carte, aucun) et textes |
| Mon espace : points | Nombre d'opérations visibles, solde, textes |
| Mon espace : réservation | Textes, conditions, disposition, prix et durées, prestation professionnelle, chaque champ activable, moments et types de véhicule, case d'accord, bouton, messages de confirmation |
| Mon espace : rendez-vous | Textes, rendez-vous passés (nombre), aide, coordonnées affichées |
| Mon espace : prestations | Nombre par page, montant, statut, lien de détail, bouton « Réserver à nouveau » |
| Récompenses de fidélité | Colonnes, état pour le client, libellés. Récompenses (blocs) : points, titre, description, condition, icône |
| Mon espace : profil | Colonnes. Blocs : informations, communications, garage, compte Shopify, lien personnalisé, déconnexion |
| Programme : niveaux | Textes, libellés des seuils, niveau du client signalé. Avantages par niveau (blocs) |

**Séparation présentation et données :**
- les prix affichés viennent de Réglages du thème › Prestations et tarifs ;
- les soldes, rendez-vous et véhicules viennent des fiches clients ;
- les niveaux sont calculés par Shopify à l'affichage, jamais dans le navigateur ;
- changer un texte ou une couleur ne modifie aucune donnée.

---

## 6. Fichiers

**Ajoutés (tous préfixés `ec-` ou `fid-`) :**
- 12 sections : `ec-acces`, `ec-bienvenue`, `ec-navigation`, `ec-apercu`, `ec-carte`, `ec-historique-points`,
  `ec-reservation`, `ec-rendez-vous`, `ec-prestations`, `ec-recompenses`, `ec-profil`, `fid-niveaux`.
- 7 snippets :
  - `ec-donnees`, le seul fichier qui lit les métachamps ; changer de source plus tard ne touche que lui ;
  - `ec-carte-visuel`, `ec-date`, `ec-entete`, `ec-statut`, `ec-rdv-item`, `ec-ligne-points`.
- `assets/espace-client.css` et `espace-client.js`, chargés uniquement par ces sections.
- `assets/ec-qrcode.js` : bibliothèque qrcode-generator 1.4.4, licence MIT.
- `templates/page.espace-client.json`, `templates/page.fidelite.json`.

**Modifiés, par ajout uniquement :**
- `config/settings_schema.json` : nouveau groupe « Programme de fidélité » (18 réglages) ; version 2.1.0.
- `sections/header.liquid` : accès « Mon espace », **désactivé par défaut**.
- `snippets/icone.liquid` : 10 icônes ajoutées (profil, cadeau, carte, historique, réglages…).
- `assets/sections.css` : style de l'accès dans l'en-tête.

**Jamais touchés :**
- `settings_data.json`, `index.json` et tous vos modèles existants ;
- les 7 modèles `templates/customers/*.liquid`, qui ne servent qu'avec les anciens comptes.

---

## 7. Tests réalisés

Tests réalisés hors de Shopify, sur un rendu local qui simule les objets de Shopify, avec un client fidèle, un nouveau
client, un visiteur et l'éditeur de thème.

- **Contrôles du code :** Theme Check, schémas officiels Shopify et moteur Liquid officiel (Ruby, mode strict) : 0 erreur.
- **Tests dans le navigateur (Chromium), tous réussis :**
  - aucune erreur JavaScript ni débordement sur 7 pages, sur ordinateur et sur mobile ;
  - le visiteur ne voit aucune donnée client ;
  - le solde, le niveau (5 prestations : Argento) et la progression sont corrects ;
  - rendez-vous à venir triés, l'annulé et la ligne illisible écartés ; 5 prestations ; récompense disponible ;
  - **le QR code se décode** en lien vers la fiche client de l'administration ;
  - la fenêtre « Présenter ma carte » se ferme avec Échap et rend le focus au bouton ;
  - navigation et rubrique active, colonne latérale sur ordinateur, barre d'onglets sur mobile ;
  - formulaire : champs obligatoires signalés, e-mail du client joint, « Réserver à nouveau » présélectionne la
    prestation, confirmation après envoi ;
  - données fictives signalées dans l'éditeur.
- **Non-régression :** les 7 pages existantes sont identiques au pixel près, sur ordinateur et sur mobile. Les tests
  fonctionnels de la 2.0.0 passent toujours.

**Non testé, faute d'accès à votre boutique :**
- le comportement réel dans Shopify, connexion et métachamps compris ;
- l'envoi réel des demandes ;
- la recette Flow.

---

## 8. Limites, en toute transparence

- **Pas de créneaux en temps réel :** le client envoie une demande, que vous confirmez. De vrais créneaux et
  l'annulation en libre-service demanderaient une application de réservation (voir le plan).
- **Points saisis par vous**, ou par Flow. Sans application de fidélité, il n'y a pas de bonus automatiques
  (anniversaire, inscription) : vous les ajoutez à la main, avec le message personnel pour prévenir le client.
- **Pas de carte Apple Wallet ni Google Wallet** : cela demande un service dédié (environ 5 $/mois, voir le plan).
- **Objet client et nouveaux comptes :** des développeurs signalent qu'avec les nouveaux comptes, les données du
  client connecté sont parfois indisponibles dans le thème. Dans ce cas, l'espace affiche l'écran de connexion, jamais
  de fausses données. À vérifier dans votre boutique.
- **Mon garage** est tenu par l'atelier : le client indique un nouveau véhicule dans sa demande et vous l'ajoutez. Le
  client ne peut pas le modifier lui-même sans un développement côté serveur.
- **Pages de compte Shopify** (profil, adresses) : leur mise en page est gérée par Shopify ; seuls le logo et les
  couleurs se règlent, dans Paramètres › Image de marque.
