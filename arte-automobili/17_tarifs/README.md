# Grille tarifaire A4 (PDF)

Version unique, blanche et minimale : `tarifs-arte-automobili.pdf` (aperçu : `apercu-tarifs.jpg`).
Contenu : le logo, le titre, les 4 prestations avec deux prix, et une ligne pour les flottes et professionnels (sur devis).

| Prestation | Particuliers (TVAC) | Professionnels (HTVA) |
| --- | --- | --- |
| Lavage intérieur | 45 € | 37,19 € |
| Lavage extérieur | 40 € | 33,06 € |
| Lavage intérieur + extérieur | 75 € | 61,98 € |
| Pack ARTE | 135 € | 111,57 € |

Prix particuliers relevés sur le site. Prix professionnels = prix TVAC ÷ 1,21 (TVA belge de 21 %), arrondis au centime.

## Modifier
Les prix sont en tête de `_source/tarifs/tarifs.py`. Relancez ensuite `python3 _source/tarifs/tarifs.py`,
puis `node _source/tarifs/pdf.mjs`.
