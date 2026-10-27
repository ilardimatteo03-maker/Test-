# Grille tarifaire A4 (PDF)

| Fichier | Usage |
| --- | --- |
| `tarifs-arte-automobili.pdf` | Version écran, fond Nero (envoi par e-mail, WhatsApp, réseaux) |
| `tarifs-arte-automobili-impression.pdf` | Version claire, économe en encre, pour l'impression |
| `apercu-tarifs*.jpg` | Aperçus |

## Prix
Prix particuliers TVAC relevés sur votre site (page Catalogue). Prix professionnels hors TVA = TVAC ÷ 1,21
(TVA belge de 21 %), arrondis au centime.

| Prestation | Durée | Particuliers TVAC | Professionnels HTVA |
| --- | --- | --- | --- |
| Lavage intérieur | 1 h | 45 € | 37,19 € |
| Lavage extérieur | 45 min | 40 € | 33,06 € |
| Lavage intérieur + extérieur (formule complète) | 1 h 45 | 75 € | 61,98 € |
| Pack ARTE (formule premium) | 3 h | 135 € | 111,57 € |
| Services pour les professionnels et flottes | — | Sur devis | Sur devis |

## Modifier
Prix, durées et textes se trouvent en tête de `_source/tarifs/tarifs.py`. Relancez ensuite :
`python3 _source/tarifs/tarifs.py` puis `node _source/tarifs/pdf.mjs`.
