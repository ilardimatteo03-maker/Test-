# Template entreprise — Chrono Guide

Template de site vitrine professionnelle en **HTML / CSS / JavaScript pur**
(aucun framework, aucune étape de build). Direction artistique éditoriale
« Chrono Guide » : palette encre / crème / champagne, titrage Bodoni Moda
(Didone façon Vogue) et texte Inter. Pensée pour une maison horlogère, mais
facile à re-personnaliser pour n'importe quelle entreprise.

## Contenu

```
template-entreprise/
├── index.html        # structure complète (toutes les sections)
├── css/style.css     # styles + thème clair/sombre + responsive
├── js/main.js        # thème, menu mobile, apparition au scroll, validation form
└── fonts/            # Bodoni Moda + Inter (auto-hébergées, licence SIL OFL)
```

## Sections incluses

Header (logo + navigation + bascule de thème), hero avec titre / sous-titre /
CTA, bandeau de marques, « À propos », services en cartes, galerie / collection,
témoignages clients, contact avec formulaire, footer complet (liens, réseaux
sociaux, newsletter, mentions légales).

## Utilisation

Ouvrez simplement `index.html` dans un navigateur, ou servez le dossier :

```bash
cd template-entreprise
python3 -m http.server 8080   # puis http://localhost:8080
```

Aucune dépendance à installer.

## Personnalisation rapide

- **Couleurs** : variables CSS en haut de `css/style.css` (`--accent`, et les
  blocs `:root[data-theme="light"]` / `[data-theme="dark"]`).
- **Polices** : remplacez les fichiers de `fonts/` et les `@font-face`.
- **Nom / textes** : cherchez « Chrono Guide » dans `index.html`.
- **Images** : les zones `.ph` (placeholders rayés) sont à remplacer par vos
  `<img>`. Emplacements marqués par leur `aria-label`.
- **Formulaire** : le `submit` est une démo (aucun backend). Branchez un service
  (Formspree, Netlify Forms, votre API) dans `js/main.js` à l'endroit indiqué.

## Fonctionnalités

- Responsive (mobile, tablette, desktop), menu burger animé.
- Dark mode avec bascule persistée (localStorage) + respect de
  `prefers-color-scheme`, sans flash au chargement.
- Animations subtiles au survol et apparition au scroll
  (IntersectionObserver), désactivées sous `prefers-reduced-motion`.
- SEO de base : balises meta, Open Graph, données structurées Schema.org,
  HTML sémantique, favicon SVG.
- Accessibilité : lien d'évitement, `aria-label`, focus visibles, contrastes.

## Licence des polices

Bodoni Moda et Inter sont sous licence SIL Open Font License (OFL),
redistribuables librement, y compris pour un usage commercial.
