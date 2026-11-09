# FUORICLASSE — direction artistique complète

**THE NEW GENERATION OF SUCCESS** · Modern Luxury / Entrepreneurial Streetwear · esthétique **MODERN WEALTH CULTURE**

Une marque de mode pour celles et ceux qui construisent : fondateurs, investisseurs, créatifs. Elle suggère la réussite
par la coupe, la matière et le détail, jamais par l'étalage. Promesse : ***Out of class. Never out of place.***

| | |
|---|---|
| **Présentation de la DA** | [`00_presentation/FUORICLASSE_Direction-artistique_v1.0.pdf`](00_presentation/FUORICLASSE_Direction-artistique_v1.0.pdf) (57 pages 16:9) |
| **Guide de marque** | [`12_guide-de-marque/FUORICLASSE_Guide-de-marque_v1.0.pdf`](12_guide-de-marque/FUORICLASSE_Guide-de-marque_v1.0.pdf) (19 pages 16:9) |
| **Logo** | mot-symbole « Sartoriale » (capitales Playfair larges, deux masters : Display et Ricamo pour la broderie) |
| **Monogramme** | FC « Architrave » : le bras du F couvre le C — la classe — et le dépasse |
| **Symbole** | « La Chiave » : un C ouvert dont sort un F couché, qui devient une clé (FUORI + CLASSE, en un trait) |
| **Signature graphique** | « Il Gessato » : rayure tennis de costume, une rayure sur neuf fait un pas de côté |
| **Couleurs** | Nero Assoluto `#0E0D0C` · Crema `#EFE9DE` · Grafite `#3A3B3D` · Talpa `#8B7F72` · Cioccolato `#3D2A21` · Blu Notte `#141B2A` · **Barolo `#5E1B27`** (signature) |
| **Typographie** | Playfair (titres, logo) · Mona Sans (texte, surtitres) · Geist Mono (codes, prix) — licences OFL |
| **Collection** | SERIES A — 17 pièces, 3 familles : Signature, Business Culture, Statement |

## Les douze livrables du brief

| # | Livrable | Où |
|---|---|---|
| 1 | Présentation complète de la direction artistique | `00_presentation/` |
| 2 | Planche d'inspiration | `01_inspiration/` (planche générale, planche matières, objets SVG) |
| 3 | Trois propositions de logos | `02_logo/propositions/` (01 Sartoriale, recommandée · 02 Architettonico · 03 Doppia Firma) |
| 4 | Monogramme | `02_logo/svg/fc-monogramme-*.svg`, construction dans `02_logo/planches/` |
| 5 | Palette de couleurs | `04_couleurs/` (planche, accords, `palette.json`, `.css`, `.ase`, `.gpl`) |
| 6 | Système typographique | `03_typographie/` (planche, hiérarchie, `typographie.css`, polices + licences) |
| 7 | Première collection avec maquettes | `05_collection/` (51 visuels produits, 8 détails, 16 détourages, planches par famille, fiches produits PDF) |
| 8 | Étiquettes et packagings | `07_packaging/` (rendus 3D, planche à plat, gros plan des étiquettes tissées, 21 fichiers d'impression en mm) |
| 9 | Campagne publicitaire complète | `08_campagne/` (5 concepts, lancement « Out of Class » : 3 affiches, 4 × 3, double page, 6 bannières, 2 publicités sociales, manifeste, storyboard du film 30 s) + `06_photographie/` (direction photo, liste de 9 plans, invites pour générateur d'images) |
| 10 | Grille Instagram | `09_reseaux-sociaux/` (12 publications, profil sur téléphone, 6 stories, 5 couvertures à la une, bannières LinkedIn / X / YouTube, direction TikTok) |
| 11 | Maquette du site e-commerce | `11_site-ecommerce/site/` (HTML autonome : accueil, collection filtrable, 17 fiches produit, La Maison, panier) + `apercus/` |
| 12 | Guide de marque complet | `12_guide-de-marque/` |

La **brand story**, le manifeste « No Ordinary Class », le ton de voix, les campagnes, les textes réseaux et les
descriptions des 17 pièces sont dans `10_brand-story/` (Markdown prêt à copier).

## Organisation

```
fuoriclasse/
├── 00_presentation/       Présentation de la DA (PDF 16:9) + aperçus
├── 01_inspiration/        Planches d'inspiration et objets de l'univers (SVG)
├── 02_logo/
│   ├── propositions/      Les trois pistes de mot-symbole
│   ├── svg/  pdf/  png/   8 versions × 5 couleurs (SVG) ; PDF et PNG transparents en Nero, Crema, Barolo
│   ├── icones/            Avatars réseaux 1080, favicon (svg, ico, png), icônes d'application
│   ├── planches/          Construction du monogramme et de la Chiave, système de logos
│   └── broderie/          Logos brodés (rendus) et tailles minimales
├── 03_typographie/        Polices OFL, planche, hiérarchie, typographie.css
├── 04_couleurs/           Palette : planche, accords, fichiers d'échange
├── 05_collection/         Series A : produits/, détails/, détourages/, planches, fiches produits PDF
├── 06_photographie/       Direction photo, liste de plans, prompts-ia.md, rendus-3d/ (lieux)
├── 07_packaging/          Rendus 3D, planche à plat, fichiers-impression/ (SVG en mm)
├── 08_campagne/           Concepts, lancement/ (affiches, 4 × 3, presse, bannières, social), film
├── 09_reseaux-sociaux/    Publications, stories, à la une, bannières de profils, TikTok, grille, profil
├── 10_brand-story/        Textes de marque (Markdown)
├── 11_site-ecommerce/     site/ (HTML/CSS/JS autonome) et apercus/
├── 12_guide-de-marque/    Guide de marque (PDF 16:9) + aperçus
└── _source/               Générateurs Python + studio 3D three.js (tout se régénère)
```

Nommage des logos : `fc-[version]-[couleur]` — versions `logo-principal`, `logo-ricamo`, `monogramme`, `chiave`,
`chiave-ricamo`, `logo-vertical`, `logo-horizontal`, `signature` ; couleurs `nero`, `crema`, `barolo`, `noir-100`, `blanc-100`.

## Quel fichier pour quel prestataire

| Prestataire | À transmettre |
|---|---|
| Atelier, brodeur | `05_collection/SERIES-A_fiches-produits.pdf`, `02_logo/svg/` (versions Ricamo sous 40 mm), guide pages 08–09 |
| Imprimeur, cartonnier | `07_packaging/fichiers-impression/`, `02_logo/pdf/`, `04_couleurs/palette.json` |
| Photographe | `06_photographie/` (direction, liste de plans, invites), `01_inspiration/` |
| Développeur web | `11_site-ecommerce/site/`, `03_typographie/typographie.css`, `04_couleurs/palette.css`, `02_logo/icones/` |
| Réseaux sociaux | `09_reseaux-sociaux/`, `10_brand-story/reseaux-sociaux.md` |

## Ce qui est final, ce qui reste à faire

**Final** : logos vectoriels et leurs déclinaisons, palette, système typographique, motif Gessato, fichiers d'impression
du packaging, gabarits réseaux, maquette HTML du site, textes de marque.

**À savoir sur les images.** Aucune photographie n'a été utilisée ni générée par une IA d'images :

- les **visuels produits** sont des illustrations vectorielles réalistes (vue « mannequin invisible »), avec broderies,
  sérigraphies et textures simulées. Ils servent à valider design, couleurs et placements avant les prototypes ;
- les **lieux** (penthouse, bureau, salle du conseil, rooftop, voiture) et le **packaging** sont des rendus 3D temps réel
  (three.js), marqués « visuel d'intention » sur les mises en page. La voiture est le modèle « Car Concept » de Khronos
  (CC BY 4.0, dérivé d'un modèle CC0 de *Unity Fan*), téléchargé au moment du rendu, non inclus dans le dépôt ;
- la campagne finale se photographie d'après `06_photographie/liste-de-plans-*.jpg`. Les invites de `prompts-ia.md`
  permettent de produire des esquisses avec un générateur d'images, à ne pas publier comme photos réelles.

**À valider ou compléter avant usage commercial :**

- **Recherche d'antériorité** sur « FUORICLASSE » (EUIPO, OMPI, UIBM) — le mot est courant en italien, et le sigle FC est
  très utilisé (clubs de football) : faire vérifier le monogramme et la Chiave avant dépôt (classes 25, 18, 35).
- Disponibilité du **nom de domaine** et des comptes sociaux (`fuoriclasse.com` est utilisé comme exemple).
- **Prix publics**, **grammages**, **pays de fabrication** et la **numérotation sur 1000 exemplaires** sont des propositions,
  à confirmer avec les ateliers et le plan financier.
- **Mentions légales** et étiquette de composition : les valeurs entre crochets (`[PAYS]`, `[raison sociale]`) restent à fournir.
- CMJN et teintes textiles : à caler sur épreuve et sur nuancier physique (TCX) à partir des HEX.
- Le site est une **maquette** : aucun paiement n'est traité. Il peut être porté sur Shopify (thème sur mesure) à partir
  de ces gabarits.

## Régénérer

```bash
cd fuoriclasse/_source
pip install fonttools brotli pillow      # Python 3.12+
npm install                              # three.js (rendus 3D) ; Playwright + Chromium requis
python3 build_all.py                     # tout (≈ 10 min) ; --sans-3d pour garder les rendus existants
```

Chaque étape a son script (`build_logos.py`, `build_collection.py`, `build_3d.py`, `build_site.py`…). Les données
de marque sont centralisées : `brand.py` (palette, marques, motif), `collection.py` (les 17 pièces), `textes.py` (tous les textes).
