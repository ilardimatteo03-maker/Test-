# ADSPY — spy de publicités Meta

Outil local pour suivre les publicités Facebook et Instagram d'autres marques :
récupérer les créas, comparer les concurrents, repérer celles qui tournent depuis
longtemps, et sortir des listes d'annonceurs à démarcher.

Gratuit, sans compte, sans abonnement. Tout tourne sur ta machine.

---

## Démarrer

Il faut **Node.js 18 ou plus** ([nodejs.org](https://nodejs.org) — installe la version LTS).
Aucune autre installation, aucun `npm install` : l'outil n'utilise que ce que Node
fournit déjà.

**Le plus simple — double-clic :**

| Système | Fichier |
|---|---|
| Windows | `DEMARRER-WINDOWS.bat` |
| macOS | `DEMARRER-MAC-LINUX.command` |

Le navigateur s'ouvre tout seul. Garde la fenêtre noire ouverte tant que tu
utilises l'outil : c'est elle qui fait tourner le serveur.

Sur macOS, au premier lancement, le système peut bloquer le fichier
(« développeur non identifié ») : clic droit → **Ouvrir** → **Ouvrir**.

**En ligne de commande, depuis la racine du projet :**

```bash
node adspy/server.js
```

Puis ouvre **http://localhost:4177**.

Pour changer de port : `ADSPY_PORT=4188 node adspy/server.js`

Le serveur n'écoute que sur `127.0.0.1` : rien n'est exposé sur ton réseau, et
aucune donnée ne part ailleurs que chez Meta au moment d'une collecte.

---

## Récupérer des pubs

### 1. Collecte automatique

Tape le nom d'une marque en haut, choisis le pays, clique **Espionner**. L'outil
interroge l'Ad Library de Meta et range les annonces dans ta bibliothèque.

Le pays compte : une marque diffuse des créas différentes selon le marché. Pour
une boutique belge, cherche en Belgique ; pour voir ce que fait Gymshark aux
États-Unis, choisis États-Unis.

### 2. Mode navigateur — quand la collecte automatique échoue

Meta durcit régulièrement ses défenses contre les appels automatisés. Ce mode
contourne le problème sans rien forcer : **c'est ton navigateur qui charge la page
Ad Library**, normalement, et un petit script recopie vers ADSPY les données que la
page a déjà reçues.

1. Ouvre ADSPY, clique **Mode navigateur**.
2. Fais glisser le bouton violet dans ta barre de favoris.
3. Va sur [facebook.com/ads/library](https://www.facebook.com/ads/library/), cherche ta marque.
4. Clique le favori. Un badge violet apparaît en bas à droite.
5. Fais défiler la page — chaque lot de pubs part vers ADSPY, le compteur monte.

Ce chemin fonctionne même quand tout le reste est bloqué : la page se charge comme
pour n'importe quel visiteur.

Pour que ce soit automatique à chaque visite, installe
[Tampermonkey](https://www.tampermonkey.net/) et colle-y le contenu de
`adspy/public/capture.user.js`.

### 3. Import d'un fichier HAR

Dernier recours, toujours efficace. Dans le navigateur : `F12` → onglet **Réseau**
→ charge l'Ad Library → clic droit → **Enregistrer tout sous HAR**. Puis
**Importer** dans ADSPY et dépose le fichier.

---

## Ce que tu peux faire ensuite

**Copier.** Chaque pub a un bouton *Copier le texte* (accroche, corps, bouton, URL
de destination) et *Copier le brief* — un bloc prêt à coller dans un brief créatif
ou dans un prompt, avec le format, l'ancienneté et l'angle utilisé.

**Télécharger les créas.** Depuis le détail d'une pub, *Télécharger la créa*
enregistre l'image ou la vidéo dans `adspy/data/creatives/`.

**Comparer.** Onglet *Comparateur* : sélectionne 2 à 5 marques et confronte leur
volume de pubs actives, l'ancienneté de leurs créas, la répartition des formats,
leur rythme de lancement sur 12 semaines et leurs meilleures pubs.

**Prospecter.** Onglet *Prospection* : la liste des annonceurs croisés pendant tes
recherches, avec leur volume de pubs et leur site. Une entreprise qui paie déjà de
la publicité est un prospect qualifié. Export CSV pour ton CRM.

**Suivre dans le temps.** ADSPY garde une copie de chaque annonce vue, avec la date
de première observation et l'historique des changements. Une pub retirée de l'Ad
Library reste dans ta bibliothèque — c'est ce que le site de Meta ne permet pas.

---

## Le score winner

Une note sur 100 affichée sur chaque pub, calculée à partir des signaux
réellement publiés par Meta :

| Signal | Points | Pourquoi |
|---|---|---|
| Longévité | 45 | Le signal le plus fiable : personne ne paie deux mois pour une créa qui ne convertit pas |
| Duplications | 25 | Nombre de copies de la même pub diffusées en parallèle — on duplique ce qu'on scale |
| Toujours active | 15 | Elle tourne encore aujourd'hui |
| Portée déclarée | 15 | Bonus quand l'UE l'impose (transparence DSA) |

**Repère pratique :** au-delà de 30 jours de diffusion, une créa est presque
toujours rentable. C'est le filtre le plus utile de la barre latérale.

### Ce qu'aucun outil ne peut te donner

Meta ne publie **ni le budget, ni le coût par achat, ni le ROAS** d'une publicité
commerciale. Quand un outil payant affiche un « chiffre d'affaires estimé », c'est
une extrapolation à partir du trafic supposé, pas une donnée. ADSPY affiche
uniquement ce qui est vérifiable.

---

## Organisation du code

```
adspy/
├── server.js              serveur HTTP + API (zéro dépendance)
├── lib/
│   ├── metaAdLibrary.js   collecte : jetons, doc_id, deux chemins d'appel
│   ├── normalize.js       annonce brute → modèle unifié + score winner
│   ├── store.js           persistance JSON + historique des changements
│   ├── har.js             import d'un export réseau
│   └── csv.js             exports Excel/Sheets
├── public/                interface (HTML/CSS/JS, sans framework)
│   └── capture.user.js    script du mode navigateur
└── data/                  ta base locale (ignorée par git)
```

**Point fragile assumé :** Meta régénère à chaque déploiement l'identifiant de
requête (`doc_id`) utilisé par son site. ADSPY va le relire dans les scripts de la
page à chaque fois plutôt que de le figer dans le code, et le met en cache 12
heures. Si Meta change quand même sa structure, la collecte automatique s'arrête —
le mode navigateur et l'import HAR, eux, continuent de fonctionner.

---

## Bon usage

L'Ad Library est un registre public : le consulter est prévu, c'est même sa raison
d'être. ADSPY se limite volontairement à une requête par seconde.

Les créas récupérées appartiennent à leurs annonceurs. Elles servent à analyser
des angles, des accroches et des formats — pas à être republiées telles quelles.
Le brief généré le rappelle à chaque copie.
