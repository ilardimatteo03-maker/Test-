# Programme partenaires (affiliation pour les professionnels)

Quatre stories Instagram (1080 × 1920 px) à publier dans l'ordre, dans le style de la série tarifs. Titres et textes en Archivo, la police lisible de la marque (celle du « AUTOMOBILI » du logo) ; chiffres en DM Mono.

| Story | Contenu |
|---|---|
| `story-partenaires-1-couverture.png` | « Recommandez. Gagnez. » Le programme d'affiliation réservé aux professionnels. |
| `story-partenaires-2-commission.png` | 10 % sur le chiffre d'affaires hors TVA des clients apportés, réglée chaque trimestre. Exemple : 1 000 € HTVA → 100 €. |
| `story-partenaires-3-fonctionnement.png` | En trois temps : vous recommandez, nous réalisons la prestation, vous touchez 10 % du montant hors TVA, chaque trimestre. |
| `story-partenaires-4-contact.png` | « Devenez partenaire. » Pour plus d'informations : par e-mail ou par téléphone. |

Le contenu évite les zones couvertes par l'interface d'Instagram (250 px en haut, 340 px en bas).

Le taux, la base et le versement trimestriel de la commission sont enregistrés dans `_source/documents/donnees.json` (bloc `affiliation`). Si tu changes le taux, relance :

```bash
python3 _source/reseaux/partenaires.py
```

## À fixer avant de lancer le programme

Les stories ne disent que ce que tu m'as donné : 10 % du chiffre d'affaires hors TVA apporté, réglés chaque trimestre. Avant les premières demandes, décide :

- **Comment un client est rattaché à un partenaire** : nom du partenaire donné à la réservation, code partenaire, lien dédié…
- **La durée** : seulement la première prestation du client, ou toutes ses prestations pendant une période ?
- **Un petit accord écrit** avec chaque partenaire, qui reprend ces règles.
- **Côté comptable** : le partenaire te facture sa commission, et certaines commissions doivent être déclarées (fiche 281.50). Vérifie avec ton comptable.
