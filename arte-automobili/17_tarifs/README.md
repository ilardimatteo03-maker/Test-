# Grille tarifaire A4 (PDF)

Version unique, blanche et minimale : `tarifs-arte-automobili.pdf` (aperçu : `apercu-tarifs.jpg`).
Contenu : le logo, le titre, les 4 prestations avec deux prix, et une ligne pour les flottes et professionnels (sur devis).

| Prestation | Particuliers (TVAC) | Professionnels (HTVA) |
| --- | --- | --- |
| Lavage intérieur | 65 € | 53,72 € |
| Lavage extérieur | 45 € | 37,19 € |
| Lavage intérieur + extérieur | 100 € | 82,64 € |
| Pack ARTE | 175 € | 144,63 € |

Prix particuliers relevés sur le site. Prix professionnels = prix TVAC ÷ 1,21 (TVA belge de 21 %), arrondis au centime.

## Stories Instagram

Quatre stories de 1080 × 1920 px, sur fond noir comme le site, qui se suivent en série :

- `story-instagram-tarifs.png` : le logo, « Tarifs. », les 5 formules avec leur prix TTC et l'adresse du site ;
- `story-instagram-options.png` : la même mise en page, avec « Options. » et les 6 options supplémentaires ;
- `story-instagram-horaires.png` : « Horaires. », les 7 jours de 09h00 à 18h00, uniquement sur rendez-vous.
- `story-instagram-logo.png` : le logo vertical seul, centré, sans aucun texte en plus.

Le contenu évite les zones couvertes par l'interface d'Instagram (250 px en haut, 340 px en bas).

## Modifier
Les prix sont dans [`_source/documents/donnees.json`](../_source/documents/donnees.json), la source unique de tous les documents. Relancez ensuite :

```bash
python3 _source/tarifs/tarifs.py && node _source/tarifs/pdf.mjs   # grille A4
python3 _source/tarifs/story.py                                   # les quatre stories Instagram
```
