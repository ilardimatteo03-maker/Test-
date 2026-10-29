# Arte Automobili — identité visuelle

*L'arte del riflesso.*

Identité complète d'un atelier de detailing automobile haut de gamme, conçue autour d'une idée :
**une automobile se juge à son reflet**. Le monogramme montre un A et son reflet de part et d'autre
de la Linea, la surface du vernis : A + reflet = AA, Arte Automobili.

| | |
|---|---|
| **Guide de marque** | [`00_guide/Arte-Automobili_Guide-de-marque_v1.0.pdf`](00_guide/Arte-Automobili_Guide-de-marque_v1.0.pdf) (72 pages 16:9) · version web `00_guide/guide-de-marque.html` |
| **Couleurs** | Nero Vite `#0D0F0E` · Bianco Sangiovanni `#EEEDE7` · **Verde Verona `#1F3D35`** · Verdaccio `#262B29` · Argento `#8E9592` · Travertino `#D6D3CA` |
| **Typographie** | Bodoni Moda (titres) · Archivo / Archivo Expanded (texte, surtitres) · DM Mono (données), toutes en licence OFL |
| **Logo** | lettrage ARTE dessiné sur mesure + AUTOMOBILI en Archivo Expanded ; tracés vectoriels purs, aucune police requise |

## Organisation des fichiers

```
arte-automobili/
├── 00_guide/                  Guide de marque : PDF 16:9 + HTML (+ assets/ : images du guide)
├── 01_strategie/pistes/       Planches des trois pistes explorées (SVG + PNG)
├── 02_logo/
│   ├── svg/                   8 versions × 5 couleurs = 40 SVG vectoriels
│   ├── pdf/                   Logos vectoriels pour l'imprimeur
│   ├── png/                   PNG transparents (1200 et 3600 px ; monogrammes 512 et 2048 px)
│   └── icones/                Avatar réseaux 1080 px, favicon (ico, svg, png), icônes d'application
├── 03_typographie/polices/    Polices variables + licences OFL
├── 04_couleurs/               palette.json · palette.css · palette.ase (Adobe) · palette.gpl (GIMP, Inkscape, Affinity)
├── 05_univers-graphique/      18 icônes SVG (Nero et Bianco), motifs (lames de lumière, trame, fiche technique), planche
├── 06_photographie/rendus-3d/ Images d'intention (rendus 3D, pas des photos) + CREDITS.md
├── 07_reseaux-sociaux/        Gabarits SVG à texte modifiable + aperçus PNG (fil 4:5, story, Reel, à la une, Facebook, partage)
├── 08_papeterie/              Carte de visite, en-tête A4, carte de remerciement, autocollants, vitrophanie (SVG mm + PDF)
│   └── documents/             Devis et facture (HTML modifiables + PDF), en-tête Word, signature e-mail,
│                              présentation commerciale 16:9, carte des prestations A4
├── 09_vehicule-textile-atelier/ Maquettes de principe : fourgon, tenues, enseigne, signalétique, affiche A2, étiquettes
├── 10_site-web/               Site vitrine 4 pages (Eleventy), formulaire de contact réel, aperçus — voir son README
├── 11_ton-de-voix/            Tous les textes de marque en Markdown, prêts à copier
├── 12_boutique-shopify/       Thème boutique (produits d'entretien), catalogue CSV, visuels produits
├── 13_site-shopify/           Le site vitrine en thème Shopify (4 pages, formulaire natif) — voir son README
├── 14_theme-shopify-premium/  Thème Shopify enrichi (sections, réglages globaux, page de lancement)
├── 15_espace-client/          Espace client et programme de fidélité : audit, plan, mode d'emploi
├── 16_supplements/            Section « Suppléments de prestation » ajoutée à ton propre thème
├── 17_tarifs/                 Grille tarifaire A4 (particuliers TVAC, professionnels HTVA)
├── 18_documents/              Devis, offres de prix, factures, listes de prix — voir son README
└── _source/                   Scripts qui régénèrent l'ensemble
```

### Nommage des logos

`aa-[version]-[couleur].[format]` — versions : `logo-principal`, `logo-vertical`, `logo-horizontal`,
`logo-secondaire`, `monogramme`, `monogramme-simplifie`, `monogramme-micro`, `signature` ;
couleurs : `nero` (fonds clairs), `bianco` (fonds sombres), `verde`, `noir-100`, `blanc-100`.

## Quel fichier pour quel prestataire

| Prestataire | À transmettre |
|---|---|
| Imprimeur | `02_logo/pdf/`, `08_papeterie/**/*.pdf` (fonds perdus 3 mm), `04_couleurs/palette.json`, le guide |
| Brodeur | `aa-monogramme-simplifie-*.svg` (sous 60 mm), `aa-monogramme-*.svg` (dos de veste), page « Tenues » du guide |
| Poseur (véhicule, enseigne) | `aa-logo-principal-bianco.svg`, `aa-logo-horizontal-bianco.svg`, pages 55 et 57 du guide |
| Développeur web | `10_site-web/` (site complet et son README), `04_couleurs/palette.css`, `05_univers-graphique/icones/`, `02_logo/icones/` |
| Réseaux sociaux | `07_reseaux-sociaux/gabarits-svg/` (installer les polices de `03_typographie/`), `02_logo/icones/avatar-reseaux-1080.png`, `11_ton-de-voix/` |

## Ce qui est final, ce qui reste à faire

**Final** : logos vectoriels, palette et codes, choix typographiques, icônes, motifs, gabarits,
fichiers d'impression de la papeterie, modèles de documents, site vitrine de quatre pages, textes.

**À compléter par l'entreprise avant usage commercial :**

- Remplacer les rendus 3D par des **photographies réelles** de l'atelier (voir chapitre 08 du guide).
- Renseigner les **coordonnées** (adresse, téléphone, e-mail, ville) et les **mentions légales** (SIRET, TVA…),
  à faire valider par l'expert-comptable. Les valeurs actuelles sont des emplacements `[—]`.
- Aligner les **tarifs** des autres supports (carte des prestations, présentation commerciale, gabarits) sur ceux du site
  (intérieur 60 €, extérieur 60 €, intérieur + extérieur 100 €, professionnels sur devis) : ils montrent encore des prestations indicatives.
- Vérifier la disponibilité du **nom de domaine** `arteautomobili.fr` (utilisé comme exemple).
- Faire une **recherche d'antériorité** sur la marque « Arte Automobili » (INPI, EUIPO) avant dépôt et investissements.
- Pour l'enseigne et le véhicule, produire les fichiers de fabrication à partir des **plans réels** (façade, modèle de fourgon) :
  les maquettes fournies sont des dessins de principe.
- Valider les couleurs sur **épreuve physique** : CMJN et références Pantone sont indicatifs.

## Notes techniques

- Les logos sont des **tracés purs** (aucune police à installer). Les gabarits SVG et documents HTML utilisent les
  polices de `03_typographie/polices/` : les installer sur le poste pour les modifier.
- Les PDF incorporent les polices ; les polices variables y apparaissent en Type 3 (vectoriel). Si un imprimeur exige
  du texte vectorisé, ouvrir le PDF dans Illustrator et vectoriser, ou demander une sortie depuis les SVG.
- Le site (`10_site-web/`) se modifie dans deux fichiers YAML et se publie sur Netlify ; son formulaire envoie réellement
  les demandes (Netlify Forms, Web3Forms ou Formspree). Mode d'emploi complet : `10_site-web/README.md`.

## Régénérer les fichiers

```bash
pip install fonttools brotli shapely cairosvg pillow python-docx
python3 arte-automobili/_source/build_all.py     # ≈ 1 min 30 ; nécessite Node + Playwright (Chromium) et pdftoppm
```

Toutes les dimensions du logo dérivent de quelques paramètres dans `_source/logo.py` (hauteur du A, rapport plein/délié,
compression du reflet, position des lames). Les textes ont une source unique : `_source/textes.py`.

### Rendus 3D

La scène `_source/studio-3d/studio.html` (three.js) produit les images de `06_photographie/rendus-3d/`. Elle attend, dans
le même dossier, `CarConcept.glb` ([Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept), CC BY 4.0)
et le paquet `three@0.169.0` décompressé dans `package/`, servis en HTTP local. Paramètres : `studio.html?shot=hero&w=2400&h=1200` (option `&paint=bianco` pour changer de teinte : nero, grafite, argento, verde, bianco ;
`&cam=x,y,z&tgt=x,y,z&fov=n` pour ajuster un cadrage). Plans du site : `site` (héros), `complet`, `interieur` (habitacle, vitre baissée), `flotte` (trois coupés).

## Licences et crédits

- Bodoni Moda (Owen Earl), Archivo (Omnibus-Type), DM Mono (Colophon) : SIL Open Font License 1.1, utilisation commerciale libre.
- Modèle 3D « Car Concept » : Khronos Group, CC BY 4.0, d'après un modèle CC0 de Unity Fan. three.js : licence MIT.
- Logo, lettrage, monogramme, icônes, motifs, gabarits et textes : créés pour Arte Automobili.
