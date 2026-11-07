# Devis, offres de prix, factures et listes de prix

Ce dossier contient les quatre documents commerciaux d'Arte Automobili, dans la direction artistique de la grille tarifaire blanche.

![Aperçu des quatre documents](apercu-documents.jpg)

| Exemple | Fichier |
|---|---|
| Devis (particulier) | [exemples/d-2026-000-sophie-lambert.pdf](exemples/d-2026-000-sophie-lambert.pdf) |
| Offre de prix (professionnel) | [exemples/op-2026-000-societe-exemple-srl.pdf](exemples/op-2026-000-societe-exemple-srl.pdf) |
| Facture (particulier, réglée sur place) | [exemples/f-2026-0000-marc-lefevre.pdf](exemples/f-2026-0000-marc-lefevre.pdf) |
| Liste de prix (1 page) | [exemples/liste-de-prix-2026-10-29.pdf](exemples/liste-de-prix-2026-10-29.pdf) |

Les clients des exemples sont fictifs. Leurs numéros se terminent par 000, donc tes vrais documents commencent à 001.

## Me demander un document

Envoie-moi simplement :

1. **Le type** : devis, offre de prix, facture ou liste de prix.
2. **Le client** :
   - pour un particulier : nom, adresse, e-mail ou téléphone ;
   - pour un professionnel : société, personne de contact, adresse et numéro de TVA.
3. **Le véhicule**, facultatif : modèle, plaque, remarque.
4. **Les prestations choisies**, avec les quantités. Pour une prestation « sur devis », précise son prix.
5. **Pour une facture** : la date de la prestation et si le client a déjà payé sur place.

Exemple :

> Facture pour Julie Martin, rue des Prés 3, 7100 La Louvière, julie@mail.be. Golf 7 noire, 1-XYZ-001. Lavage intérieur + extérieur et traitement à l'ozone, fait et payé hier sur place.

Je te renvoie le PDF. Le numéro suivant est attribué automatiquement.

## Devis ou offre de prix ?

- **Devis** :
  - pour un véhicule précis, après l'avoir vu ;
  - prix TVAC pour un particulier ;
  - zone « Bon pour accord » à signer ;
  - valable 30 jours.
- **Offre de prix** :
  - proposition commerciale, en général pour un professionnel ou une flotte ;
  - prix HTVA, puis TVA 21 % et total TVAC ;
  - objet libre (« entretien de six véhicules ») ;
  - valable 30 jours.

Les deux fonctionnent pour les deux types de clients. Seul le mode d'affichage change :

| Client | Affichage | Total qui fait foi |
|---|---|---|
| Particulier | Prix TVAC | Le total TVAC (prix du site), avec la base HTVA et la TVA indiquées en dessous |
| Professionnel | Prix HTVA | Le total HTVA, puis TVA 21 % et total TVAC |

Une remise en pourcentage est possible, par exemple « remise flotte 10 % ».

## Les données enregistrées

Tout est dans un seul fichier : [`_source/documents/donnees.json`](../_source/documents/donnees.json). Ce fichier alimente aussi la grille tarifaire de `17_tarifs`.

**Prestations**, prix TTC au 3 novembre 2026 (HTVA = TVAC / 1,21), avec la liste de ce qui est compris, reprise du site :

| Prestation | Durée | Particuliers TVAC | Professionnels HTVA |
|---|---|---|---|
| Lavage intérieur | 1 h | 65 € | 53,72 € |
| Lavage extérieur | 45 min | 45 € | 37,19 € |
| Lavage intérieur + extérieur | 1 h 45 | 100 € | 82,64 € |
| Pack ARTE | 3 h | 175 € | 144,63 € |
| Pack PROFESSIONNEL | — | Sur devis | Sur devis |

**Options supplémentaires**, celles du site : entretien de la céramique, des cuirs, des tissus, des plastiques et des capotes de cabriolet (45 € TVAC chacune, 45 min), véhicule fortement encrassé (sur devis). Elles sont toutes comprises dans le Pack ARTE.

**Déplacement** : prestation à domicile, frais à partir de 20 km, 0,35 € TVAC par km (code `deplacement`, quantité = km facturés).

**Entreprise** :
- titulaire : Simon Duray (indépendant), nom commercial Arte Automobili ;
- adresse : Rue Lait Beurré 79, 7100 La Louvière ;
- numéro d'entreprise : BE 1044.577.261 (BCE, en attente d'activation au 7 novembre 2026) ;
- compte : IBAN BE50 7320 9015 8218, BIC CREGBEBB (CBC Banque, déduit du code banque 732) ;
- téléphone : +32 492 53 42 30 ;
- e-mail : arteautomobili@gmail.com ;
- horaires : tous les jours, de 9 h à 18 h, uniquement sur rendez-vous ;
- site : arteautomobili.be.

**Conditions** :
- validité de 30 jours pour les devis et les offres ;
- paiement sur place ;
- frais de déplacement au-delà de 20 km ;
- échéance de 15 jours pour une facture non réglée ;
- TVA 21 %.

## Règles belges intégrées

- **Numérotation continue** par année et par type : D-2026-001, OP-2026-001, F-2026-0001. Le compteur est dans [`compteurs.json`](compteurs.json). Si tu as déjà émis des factures cette année avec un autre outil, donne-moi le dernier numéro pour continuer la suite.
- **Mentions de facture** :
  - date d'émission et date de la prestation ;
  - coordonnées et numéro de TVA des deux parties (celui du client s'il est professionnel) ;
  - quantité et prix unitaire ;
  - base HTVA, taux et montant de TVA, total TVAC ;
  - échéance et virement avec une communication structurée (+++…+++) ou mention « acquittée ».
- **Facture à une entreprise assujettie à la TVA.** Depuis le 1er janvier 2026, elle doit en principe être transmise en facture électronique par le réseau Peppol. Le PDF reste utile comme copie lisible, mais pour ces clients il faut un logiciel de facturation connecté à Peppol. Vérifie avec ton comptable. Les factures aux particuliers ne sont pas concernées.
- **Régime de franchise des petites entreprises.** Si tu en relèves (pas de TVA facturée), passe `regime_franchise` à `true` dans `donnees.json`. Les documents n'affichent alors plus de TVA et ajoutent la mention légale.

## Côté technique

```bash
python3 _source/documents/documents.py demande.json   # un document, numéro suivant
python3 _source/documents/documents.py exemples       # régénère les quatre exemples
python3 _source/tarifs/tarifs.py && node _source/tarifs/pdf.mjs   # grille tarifaire 17_tarifs
```

Une demande est un petit fichier JSON. Le format est décrit en tête de [`documents.py`](../_source/documents/documents.py), et des exemples sont dans [`exemples.json`](../_source/documents/exemples.json). Les documents réels sont rangés dans `devis/`, `offres/`, `factures/` et `listes/`, chacun avec sa demande en JSON pour pouvoir le régénérer.

Ces dossiers contiendront les coordonnées de vrais clients. Si ce dépôt GitHub est public, passe-le en privé.
