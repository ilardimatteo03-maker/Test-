# Carte de visite

Format 85 × 55 mm, recto-verso, en version blanche minimale, comme les devis et la grille tarifaire.

| Face | Contenu |
|---|---|
| Recto | Le logo, seul |
| Verso | Le nom, le téléphone, l'e-mail, le site et l'adresse |

| Fichier | Usage |
|---|---|
| `carte-de-visite-prenom-nom-85x55-fonds-perdus-3mm.pdf` | Le fichier à envoyer à l'imprimeur |
| `apercu-prenom-nom-recto.png`, `apercu-prenom-nom-verso.png` | Aperçus au format fini |
| `carte-prenom-nom-recto.svg`, `carte-prenom-nom-verso.svg` | Sources vectorielles |

L'ancienne carte de l'identité de départ (noire et verte) reste intacte dans `08_papeterie/carte-de-visite/`.

## Pour l'imprimeur

- **Format fini :** 85 × 55 mm.
- **Fichier :** 91 × 61 mm, avec 3 mm de fonds perdus de chaque côté et sans traits de coupe.
- **Pages :** page 1 = recto, page 2 = verso.
- **Zone de sécurité :** tous les textes sont à au moins 6 mm du bord fini.
- **Texte :** entièrement vectorisé. Aucune police n'est à installer et l'impression reste nette à toute taille.
- **Couleurs :** noir Nero (#0D0F0E) et un filet gris clair sur fond blanc, en RVB ; l'imprimeur convertit en CMJN.
- **Papier conseillé :** papier mat non couché de 350 à 400 g/m². Il correspond au style sobre de la marque.

## Ce qui reste à compléter

Le nom, le téléphone, l'e-mail et le numéro de la rue figurent entre crochets. Envoie-les-moi et je régénère la carte.

Je peux faire une carte par personne, par exemple une pour chacun des trois associés, avec une fonction facultative sous le nom. Les données sont dans `_source/documents/donnees.json` (section `equipe`). Si une personne n'a ni téléphone ni e-mail propre, la carte reprend ceux de l'entreprise.

Pour régénérer :

```bash
python3 _source/carte_visite/carte.py
```
