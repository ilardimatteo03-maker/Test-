# Arte Automobili — repères pour Claude

- Le projet est dans `arte-automobili/`. Le site en ligne est arteautomobili.be (Shopify).
- Règle absolue : ne jamais modifier le site publié ni écraser le thème de l'utilisateur. On travaille sur des copies, et on demande avant de toucher à un élément existant.

## Devis, offres de prix, factures, listes de prix

Quand l'utilisateur donne un client et des prestations, procède ainsi :

1. Lis `arte-automobili/18_documents/README.md`, qui explique la procédure et les règles belges.
2. Les données (prestations, prix TVAC, suppléments, entreprise, conditions) sont dans `arte-automobili/_source/documents/donnees.json`. Ce fichier est la source unique ; mets-le à jour si l'utilisateur change un prix.
3. Écris la demande en JSON, au format décrit en tête de `arte-automobili/_source/documents/documents.py`, puis lance `python3 arte-automobili/_source/documents/documents.py <demande.json>`.
4. Le numéro est attribué depuis `arte-automobili/18_documents/compteurs.json`. Commite et pousse ce compteur avec le document, pour garder une numérotation continue.
5. N'invente jamais les coordonnées légales de l'entreprise : les valeurs entre crochets restent à fournir par l'utilisateur.

## Cartes de visite

- La carte officielle est le design de l'utilisateur (`19_carte-de-visite/design-original/`), recomposé en 85 × 55 mm par `arte-automobili/_source/carte_visite/carte_arte.py`.
- La proposition blanche est générée par `arte-automobili/_source/carte_visite/carte.py`, une carte par personne de `equipe` dans `donnees.json`, dans `19_carte-de-visite/proposition-blanche/`.
