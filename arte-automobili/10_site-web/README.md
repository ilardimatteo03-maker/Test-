# Site vitrine — Arte Automobili

Site statique de quatre pages, construit avec [Eleventy](https://www.11ty.dev/) selon la charte Arte Automobili.

| Page | Adresse | Contenu |
|---|---|---|
| Accueil | `/` | Héros, trois cartes de prestations, approche, bandeau « Votre véhicule mérite le meilleur. » |
| Services | `/services/` | Les quatre prestations, leurs tarifs et un bouton de demande pour chacune |
| Présentation | `/presentation/` | « La passion du détail. » : texte provisoire, précision, soin, exigence |
| Contact | `/contact/` | Formulaire de demande (envoi réel, voir plus bas) |
| Mentions légales, Confidentialité | `/mentions-legales/`, `/confidentialite/` | Liées depuis le pied de page |

Pas de réservation en ligne, de paiement, de compte client ni de boutique : seulement un formulaire de demande.

---

## 1. Modifier le contenu

Tout se modifie dans des fichiers texte, sans toucher à la mise en page. Les fichiers `.yaml` acceptent des
commentaires (lignes qui commencent par `#`) ; ne modifiez que le texte entre guillemets.

| Je veux changer… | Fichier | Remarque |
|---|---|---|
| **Un tarif**, le nom ou la description d'une prestation | `src/_data/prestations.yaml` | Mis à jour partout : accueil, page Services, liste du formulaire, données Google |
| **Les coordonnées** (téléphone, e-mail, adresse, zone, horaires) | `src/_data/site.yaml`, rubrique `contact` | Un champ vide n'est pas affiché |
| **Les réseaux sociaux** | `src/_data/site.yaml`, rubrique `reseaux` | Adresse complète (`https://…`) ; vide = non affiché |
| **Les mentions légales** | `src/_data/site.yaml`, rubrique `legal` | Tant qu'un champ est vide, la page affiche « [À compléter : …] » en rouge |
| **Les textes d'une page** (titres, phrases, boutons) | En tête du fichier de la page : `src/index.njk`, `src/services.njk`, `src/presentation.njk`, `src/contact.njk` | Entre les deux lignes `---`. `<em>mot</em>` met un mot en italique |
| **Le menu** | `src/_data/navigation.yaml` | |
| **Une photo** | `src/images/` | Voir ci-dessous |

Exemple — passer le lavage extérieur à 65 € : dans `src/_data/prestations.yaml`, remplacer `prix: 60` par `prix: 65`
sous `nom: "Lavage extérieur"`. Un prix sous forme de texte (`prix: "À partir de 70 €"`) s'affiche tel quel.

### Remplacer les photos

Les images actuelles sont des **rendus 3D d'illustration** (pas des photos de l'entreprise). Remplacez-les par vos
photos en gardant **le même nom de fichier** dans `src/images/` : le site produit lui-même les formats optimisés
(AVIF et JPEG, plusieurs tailles).

| Fichier | Où | Format conseillé |
|---|---|---|
| `accueil-hero.jpg` | Grande image de l'accueil | Paysage 16:9, 2400 px de large ou plus ; véhicule sur la moitié droite, la gauche reste sombre pour le titre |
| `service-interieur.jpg`, `service-exterieur.jpg`, `service-complet.jpg` | Cartes de l'accueil (4:5) et page Services (16:10) | 1600 px ou plus, sujet centré |
| `service-professionnels.jpg` | Page Services | Paysage, 1600 px ou plus |
| `accueil-approche.jpg` | Section « Notre approche » | Portrait 4:5, 1200 px ou plus |
| `presentation.jpg` | Page Présentation | Portrait 4:5, 1200 px ou plus |
| `src/assets/partage.jpg` | Aperçu lors d'un partage (WhatsApp, réseaux…) | 1200 × 630 px exactement |

Pensez aussi à :

- mettre à jour le texte de remplacement (`alt`) de chaque image : dans `prestations.yaml` et en tête des pages ;
- retirer, dans `src/mentions-legales.njk`, la ligne de crédits des rendus 3D (`credits:`) quand ils ne sont plus utilisés.

Si le sujet d'une carte de l'accueil est mal cadré, ajoutez sous la prestation `cadrage: "50% 30%"`
(position horizontale puis verticale du point à garder visible).

---

## 2. Formulaire de contact : le relier à votre adresse e-mail professionnelle

Le formulaire n'affiche « Merci, votre demande est bien partie » **qu'après la confirmation du service d'envoi**.
Si l'envoi échoue (service non activé, connexion coupée), un message d'erreur s'affiche et la demande peut être renvoyée.
Tant qu'aucun service n'est configuré, le bouton est désactivé avec un message explicite : rien n'est simulé.

Le service se choisit dans `src/_data/site.yaml`, rubrique `formulaire`. Trois solutions :

### Solution A — Netlify Forms (recommandée si le site est hébergé sur Netlify) · réglage actuel

Aucune clé à fournir : `service: "netlify"` est déjà en place.

1. Publier le site sur Netlify (section 4).
2. Dans Netlify, ouvrir le site › **Forms** › **Enable form detection** (détection des formulaires).
3. Relancer une publication : **Deploys** › **Trigger deploy** › **Deploy site**. Le formulaire « contact » apparaît dans **Forms**.
4. Recevoir les demandes par e-mail : **Site configuration** › **Notifications** › **Emails and webhooks** ›
   **Form submission notifications** › **Add notification** › **Email notification** : saisir votre adresse
   professionnelle (ex. `contact@votre-domaine.fr`) et choisir le formulaire « contact ».
5. Faire un essai depuis le site en ligne. Les demandes sont aussi consultables dans **Forms** ;
   vérifiez de temps en temps le dossier **Spam submissions**.

### Solution B — Web3Forms (fonctionne chez n'importe quel hébergeur)

1. Sur [web3forms.com](https://web3forms.com), saisir votre adresse e-mail professionnelle : une **clé d'accès** vous est envoyée.
2. Dans `site.yaml` : `service: "web3forms"` et `cle_web3forms: "la-clé-reçue"`.
3. Publier, puis faire un essai. Les demandes arrivent à l'adresse liée à la clé.

### Solution C — Formspree (fonctionne chez n'importe quel hébergeur)

1. Créer un compte sur [formspree.io](https://formspree.io) avec votre adresse professionnelle, puis **New form**.
2. Recopier l'identifiant du formulaire : dans `https://formspree.io/f/abcdwxyz`, c'est `abcdwxyz`.
3. Dans `site.yaml` : `service: "formspree"` et `id_formspree: "abcdwxyz"`. Publier, puis faire un essai.

Dans les trois cas, le champ e-mail du formulaire s'appelle `email`, ce qui permet en général de répondre au client
directement depuis votre messagerie. Les offres gratuites de ces services ont un quota mensuel de demandes :
vérifiez-le sur leur page de tarifs. La politique de confidentialité nomme automatiquement le service choisi.

> Vous n'avez pas encore d'adresse professionnelle ? Elle se crée avec votre nom de domaine, chez votre registraire
> (OVHcloud, Gandi, IONOS…) ou via Google Workspace ou Microsoft 365.

---

## 3. Voir le site sur votre ordinateur (facultatif)

Prérequis : [Node.js](https://nodejs.org) 20 ou plus récent.

```bash
cd arte-automobili/10_site-web
npm install        # la première fois seulement
npm start          # aperçu sur http://localhost:8080, rechargé à chaque modification
npm run build      # produit le site final dans le dossier _site/
```

En local, le formulaire affiche un message d'erreur : c'est normal, aucun service d'envoi n'y répond.
À chaque construction, la liste des informations encore manquantes dans `site.yaml` s'affiche.

---

## 4. Mettre le site en ligne (Netlify, gratuit pour un site de cette taille)

1. Créer un compte sur [netlify.com](https://www.netlify.com) (connexion avec GitHub possible).
2. **Add new site** › **Import an existing project** › **GitHub** › choisir ce dépôt.
3. Réglages de construction :
   - **Base directory** : `arte-automobili/10_site-web`
   - **Build command** : `npm run build` · **Publish directory** : `_site` (déjà indiqués dans `netlify.toml`).
4. **Deploy**. Le site est en ligne en une à deux minutes sur une adresse `…netlify.app`.
5. Activer le formulaire (section 2, solution A).

Ensuite, chaque modification enregistrée sur GitHub (y compris depuis le site de GitHub : ouvrir le fichier,
icône crayon, **Commit changes**) republie le site automatiquement.

Autres hébergeurs possibles (Cloudflare Pages, GitHub Pages, o2switch…) : construire avec `npm run build`
et publier le dossier `_site/`. Choisir alors Web3Forms ou Formspree pour le formulaire.

### Connecter votre nom de domaine

1. Netlify › votre site › **Domain management** › **Add a domain** › saisir `votre-domaine.fr`.
2. Deux possibilités, au choix :
   - **Confier le DNS à Netlify** (le plus simple) : Netlify affiche quatre serveurs de noms (`dns1.p0X.nsone.net`…) ;
     les recopier chez votre registraire, rubrique « Serveurs DNS ». Attention : si vos e-mails professionnels
     utilisent ce domaine, recréez leurs enregistrements MX dans Netlify avant de basculer.
   - **Garder le DNS chez votre registraire** : créer un enregistrement `CNAME` pour `www` vers `votre-site.netlify.app`,
     et un enregistrement `A` pour le domaine nu vers l'adresse IP indiquée par Netlify (`75.2.60.5` à ce jour ;
     l'adresse affichée par Netlify fait foi). Vos e-mails ne sont pas affectés.
3. La propagation prend de quelques minutes à 48 heures. Le certificat HTTPS est ensuite créé automatiquement
   (**Domain management** › **HTTPS**).
4. Dans `site.yaml`, renseigner `url: "https://www.votre-domaine.fr"` (Netlify la fournit déjà automatiquement,
   mais l'écrire évite toute ambiguïté).

---

## 5. Avant d'annoncer le site

- [ ] `site.yaml` : coordonnées, mentions légales complètes (plus aucun « [À compléter] » sur `/mentions-legales/`), durée de conservation.
- [ ] Mentions légales et politique de confidentialité relues par votre expert-comptable ou un juriste : ce sont des modèles.
- [ ] Vraies photos à la place des rendus 3D, textes `alt` mis à jour, crédits retirés.
- [ ] Texte de la page Présentation relu et personnalisé.
- [ ] Formulaire : demande d'essai reçue sur l'adresse professionnelle.
- [ ] Domaine connecté et HTTPS actif.
- [ ] Facultatif : déclarer le site dans [Google Search Console](https://search.google.com/search-console) et créer une fiche Google Business Profile.

---

## Organisation des fichiers

```
10_site-web/
├── src/
│   ├── _data/
│   │   ├── site.yaml            Coordonnées, réseaux, formulaire, mentions légales
│   │   ├── prestations.yaml     Prestations et tarifs
│   │   └── navigation.yaml      Menu
│   ├── _includes/
│   │   ├── base.njk             Gabarit commun (balises SEO, en-tête, pied de page)
│   │   ├── composants.njk       Boutons, cartes de service, prestations, champs « à compléter »
│   │   └── partials/            En-tête et menu mobile, pied de page, données structurées
│   ├── index.njk · services.njk · presentation.njk · contact.njk
│   ├── mentions-legales.njk · confidentialite.njk · contact-merci.njk · 404.njk
│   ├── images/                  Photos (sources haute définition)
│   └── assets/                  Feuille de style, script, polices, logos, image de partage
├── eleventy.config.js           Optimisation des images, typographie française, rappel des champs manquants
├── netlify.toml                 Réglages Netlify (construction, en-têtes de sécurité, cache)
└── apercus/                     Captures ordinateur et mobile de chaque page
```

Détails techniques : polices auto-hébergées (aucun appel à Google, conforme RGPD), aucun cookie ni outil de mesure,
images AVIF + JPEG responsives, espaces fines insécables ajoutées automatiquement avant « : ; ! ? »,
données structurées schema.org, plan du site (`sitemap.xml`) produit dès que l'adresse publique est connue,
animations désactivées si le visiteur a demandé à réduire les mouvements.
Contrôles automatiques (liens, console, formulaire, menu, accessibilité axe-core) : `node ../_source/verifier_site.mjs`
(nécessite Playwright ; chemin de `axe.min.js` en argument, facultatif).
