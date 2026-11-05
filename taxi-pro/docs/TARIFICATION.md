# Tarification : règles, priorités et exemples

Le calcul est fait par un seul fichier, `theme/assets/tp-pricing.js`, utilisé à l'identique par le navigateur
(prix instantané) et par le service de réservation (prix revalidé avant confirmation ou paiement).
Aucun montant n'est écrit dans le code : tout vient des réglages du thème et des sections « … (tarifs) » du groupe « Pied de page ».

## Où se règle quoi

| Élément | Emplacement dans l'éditeur de thème |
| --- | --- |
| Prise en charge, prix/km, prix/minute, minimum, arrondi, TVA, devise | Paramètres du thème › **Tarifs** |
| Nuit, week-end, jours fériés, aéroport, passagers, bagages, attente, péages, aller-retour, tarif horaire | Paramètres du thème › **Majorations et suppléments** |
| Rayon d'intervention, hors zone, distance maximale, fuseau horaire | Paramètres du thème › **Zone géographique** |
| Délais, horaires, passagers max., modes de paiement, acompte | Paramètres du thème › **Réservation** |
| Prestations (taxi, aéroport, mise à disposition…) | Groupe **Pied de page** › Prestations (tarifs) |
| Véhicules et leur règle de prix | Pied de page › Véhicules (tarifs) |
| Options (siège bébé, pancarte…) | Pied de page › Options (tarifs) |
| Aéroports, gares, zones tarifaires, zones interdites | Pied de page › Zones (tarifs) |
| Prix fixes entre deux zones | Pied de page › Forfaits (tarifs) |
| Heures de pointe, réveillon, événements | Pied de page › Plages horaires (tarifs) |

Ces six sections font partie du groupe « Pied de page » : elles apparaissent en bas de la liste des sections de
**chaque page** dans l'éditeur, sous « Pied de page » et « Actions rapides mobile ». Elles sont invisibles pour les
visiteurs ; dans l'éditeur, un bandeau jaune résume leur contenu, et le module de réservation affiche un diagnostic
de ce qu'il a lu (nombre de véhicules, prestations, options, zones, forfaits, plages horaires).

Sans aucun véhicule configuré, le calculateur propose un véhicule « Taxi » au tarif général.

Les montants acceptent la virgule ou le point : `2,15`, `2.15`, `1 234,50`.

## Ordre de calcul d'un trajet

1. **Base du prix** — une seule source, choisie dans cet ordre de priorité :
   1. prestation « Sur devis » : aucun prix affiché, la demande est envoyée sans montant ;
   2. prestation « Prix fixe » : prix de la prestation × coefficient du véhicule ;
   3. prestation « Mise à disposition » : heures (au moins la durée minimale) × tarif horaire
      (celui de la prestation, sinon celui du véhicule, sinon le tarif horaire général × coefficient du véhicule) ;
   4. **forfait** dont les zones correspondent au départ et à l'arrivée (voir « Forfaits ») ;
   5. tarif kilométrique : général, remplacé par le tarif propre du véhicule (s'il en a un),
      puis par la **zone tarifaire** de plus haute priorité qui s'applique.
2. **Course** = prise en charge + distance × prix/km (+ durée × prix/minute si activé).
3. **Coefficients** : véhicule (règle « tarif général × coefficient »), zone tarifaire, prestation.
4. **Minimum de facturation** : le plus élevé entre celui du tarif retenu et celui de la prestation.
   Un complément apparaît dans le détail si la course est inférieure.
5. **Majorations horaires** (nuit, week-end, jours fériés, plages personnalisées) appliquées à la course,
   selon la règle de combinaison choisie (ci-dessous). Elles dépendent de l'**heure de prise en charge**.
6. **Suppléments fixes** : prestation, véhicule, aéroport (un seul par trajet, le plus élevé), gare,
   passagers et bagages au-delà du nombre inclus, péages du forfait ou de la zone tarifaire.
7. **Aller-retour** : le retour est calculé comme un second trajet, **à sa propre heure** (le retour de nuit
   est majoré même si l'aller ne l'est pas), puis la remise aller-retour s'applique aux deux courses.
8. **Options** (une fois par réservation), **attente** au-delà des minutes offertes, **arrondi**, **acompte**.

## Combinaison des majorations horaires

Réglage « Si plusieurs majorations horaires s'appliquent » :

| Mode | Dimanche 23 h, course 25 €, nuit 20 %, dimanche 15 % |
| --- | --- |
| La plus forte (par défaut) | 25 + 5 = **30 €** |
| Les additionner | 25 + 5 + 3,75 = **33,75 €** |
| Priorité (nuit 10, week-end 20, fériés 30) | le week-end l'emporte : **28,75 €** |

Chaque plage personnalisée a sa propre priorité (par défaut 40). Exemple : « Réveillon, 31/12 de 20 h à minuit,
+50 %, priorité 90 ».

## Forfaits

- Un forfait relie deux **codes de zone** (`bxl` → `bru`). `*` signifie « n'importe quelle adresse ».
- « Valable dans les deux sens » couvre aussi le trajet inverse.
- **Plusieurs forfaits possibles** : la priorité la plus haute l'emporte ; à priorité égale, le moins cher.
  Exemple : « Bruxelles ↔ Aéroport » (priorité 50, 45 €) et « Gare du Midi → Aéroport » (priorité 60, 40 €) :
  depuis la gare du Midi, c'est 40 €.
- Prix par véhicule : `van:65, affaires:70`. Sans prix propre, le prix du forfait est multiplié par le
  coefficient du véhicule. Pour un véhicule à tarif propre, indiquez son prix ou réservez le forfait aux autres véhicules.
- Par défaut un forfait **n'est pas majoré** (nuit, week-end, aéroport, gare). Cochez « Appliquer les majorations » pour le faire.
  Les options, l'attente et les passagers ou bagages supplémentaires s'ajoutent toujours.

## Zones

| Type | Effet |
| --- | --- |
| Aéroport | Supplément aéroport (montant de la zone, sinon celui des réglages) ; affiche le champ « numéro de vol ». |
| Gare | Supplément de la zone, selon « S'applique quand » (ex. : départ uniquement). |
| Zone tarifaire | Remplace prise en charge, prix/km, prix/minute, minimum ; coefficient, supplément et péages facultatifs. |
| Zone de référence | Sert uniquement aux forfaits. |
| Zone d'intervention | Étend la zone acceptée au-delà du rayon autour de la base. |
| Zone interdite | Refuse les trajets dont le départ ou l'arrivée s'y trouve. |

Forme : cercle (centre + rayon) ou polygone (une ligne « latitude, longitude » par sommet).

## Validations bloquantes

Adresses ou distance manquantes, date trop proche ou trop lointaine, en dehors des horaires, retour avant l'aller,
capacité du véhicule dépassée (passagers ou bagages), zone interdite, hors zone ou distance maximale
(refus ou « sur devis » selon le réglage), option non proposée pour la prestation, quantité trop élevée.

## Exemples vérifiés par les tests (`tests/pricing.test.mjs`)

Configuration de test : prise en charge 5 €, 2 €/km, minimum 12 €, nuit 20 %, dimanche 15 %, fériés 25 %, aéroport 10 €.

| Trajet | Prix |
| --- | --- |
| 10 km, mardi 14 h, berline | 5 + 20 = **25 €** |
| 2 km | 9 € → minimum **12 €** |
| 10 km, mardi 23 h | 25 + 20 % = **30 €** |
| 10 km, 11 novembre (férié) | 25 + 25 % = 31,25 → arrondi au 0,10 : **31,30 €** |
| Bruxelles → Brussels Airport, berline / van / break (×1,1) | **45 € / 65 € / 49,50 €** (forfait) |
| Leuven → Brussels Airport, 20 km | 45 + 10 (aéroport) = **55 €** |
| Aller 14 h + retour 23 h, 10 km, remise 10 % | (25 + 30) − 5,50 = **49,50 €** |
| Mise à disposition 1 h (minimum 2 h, 45 €/h) | **90 €** |

L'ensemble des règles est couvert par 33 tests automatisés : `node --test taxi-pro/tests/*.test.mjs`.
