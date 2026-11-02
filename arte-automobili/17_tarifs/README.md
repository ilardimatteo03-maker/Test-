# Grille tarifaire A4 (PDF)

Version unique, blanche et minimale : `tarifs-arte-automobili.pdf` (aperçu : `apercu-tarifs.jpg`).
Contenu : le logo, le titre, les 4 prestations avec deux prix, et une ligne pour les flottes et professionnels (sur devis).

| Prestation | Particuliers (TVAC) | Professionnels (HTVA) |
| --- | --- | --- |
| Lavage intérieur | 45 € | 37,19 € |
| Lavage extérieur | 40 € | 33,06 € |
| Lavage intérieur + extérieur | 75 € | 61,98 € |
| Pack ARTE | 150 € | 123,97 € |

Prix particuliers relevés sur le site. Prix professionnels = prix TVAC ÷ 1,21 (TVA belge de 21 %), arrondis au centime.

## Story Instagram

`story-instagram-tarifs.png` (1080 × 1920 px) : le logo, « Tarifs. », les 5 formules avec leur prix TTC et l'adresse du site, sur fond noir comme le site.
Le contenu évite les zones couvertes par l'interface d'Instagram (250 px en haut, 340 px en bas).

## Modifier
Les prix sont dans [`_source/documents/donnees.json`](../_source/documents/donnees.json), la source unique de tous les documents. Relancez ensuite :

```bash
python3 _source/tarifs/tarifs.py && node _source/tarifs/pdf.mjs   # grille A4
python3 _source/tarifs/story.py                                   # story Instagram
```
