# Cartes dans le Wallet du téléphone (Apple / Google)

Permet au client d'ajouter sa carte de fidélité **directement dans Apple Wallet
(iPhone) ou Google Wallet (Android)**. Le QR reste le même : le commerçant scanne
comme aujourd'hui. Les boutons apparaissent sur la page carte quand
`NEXT_PUBLIC_WALLET_ENABLED=true`.

> Prérequis : **Supabase configuré** (les routes serveur lisent la carte via
> `get_public_card`). En mode démo pur, le Wallet est masqué.

---

## Apple Wallet (iPhone)

1. **Compte Apple Developer** (99 $/an) → [developer.apple.com](https://developer.apple.com).
2. **Certificates, IDs & Profiles → Identifiers → Pass Type IDs** : créez un
   identifiant, ex. `pass.com.asm.fidelo` → `APPLE_PASS_TYPE_ID`.
3. Générez le **certificat Pass Type ID** et exportez la paire cert + clé au
   format PEM :
   - certificat → `APPLE_PASS_CERT`
   - clé privée → `APPLE_PASS_KEY` (+ `APPLE_PASS_KEY_PASSPHRASE` si protégée)
4. Téléchargez le **Apple WWDR G4** (PEM) → `APPLE_WWDR_CERT`.
5. `APPLE_TEAM_ID` = votre Team ID (Membership).
6. Déposez les visuels de la carte dans **`public/wallet/`** :
   `icon.png` (obligatoire, 29×29), `icon@2x.png`, `logo.png`, `logo@2x.png`.

> Astuce : encodez les PEM en base64 pour les mettre en variable d'env
> (`base64 -w0 cert.pem`). Le code accepte base64 **ou** PEM brut.

La route `GET /api/wallet/apple/[id]` renvoie un `.pkpass` signé (type MIME
`application/vnd.apple.pkpass`) ; iOS propose « Ajouter à Apple Wallet ».

### Mise à jour automatique des tampons (optionnel)
Apple peut rafraîchir la carte via un web service (champ `webServiceURL` +
APNs). Non inclus dans ce MVP — à ajouter si vous voulez que le compteur se mette
à jour tout seul dans le Wallet après un scan.

---

## Google Wallet (Android)

1. **Google Cloud** : activez l'**API Google Wallet** et créez un **compte de
   service** ([console.cloud.google.com](https://console.cloud.google.com)).
2. Demandez l'accès à la **Google Wallet API Console**
   ([pay.google.com/business/console](https://pay.google.com/business/console)) →
   récupérez votre **Issuer ID** → `GOOGLE_WALLET_ISSUER_ID`.
3. Autorisez le compte de service dans la console Wallet. Renseignez :
   - email du compte de service → `GOOGLE_WALLET_SA_EMAIL`
   - clé privée du compte de service (PEM, base64 conseillé) → `GOOGLE_WALLET_SA_KEY`
4. Créez **une fois** une **Loyalty Class** (via l'API ou la console), ex.
   `ISSUER_ID.fidelo_loyalty` → `GOOGLE_WALLET_CLASS_ID`.

La route `GET /api/wallet/google/[id]` renvoie `{ url }` : un lien signé
`https://pay.google.com/gp/v/save/<jwt>` → « Ajouter à Google Wallet ».

---

## Activation

```env
NEXT_PUBLIC_WALLET_ENABLED=true
```

Puis renseignez les variables Apple et/ou Google dans `.env.local`. Chaque
plateforme s'active indépendamment (si seule Apple est configurée, seul son
bouton fonctionne ; l'autre renvoie une erreur claire).

---

## Remarques design
Apple et Google fournissent des **badges officiels** « Add to Apple/Google
Wallet ». Pour la production, remplacez les boutons texte de
`components/WalletButtons.tsx` par ces badges (règles de marque des deux
plateformes).
