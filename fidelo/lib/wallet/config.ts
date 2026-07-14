// Configuration des cartes Wallet (Apple / Google).
// Comme Supabase/Stripe : activé uniquement quand les identifiants sont fournis.

export const isAppleWalletConfigured = Boolean(
  process.env.APPLE_PASS_TYPE_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_PASS_CERT &&
    process.env.APPLE_PASS_KEY &&
    process.env.APPLE_WWDR_CERT
);

export const isGoogleWalletConfigured = Boolean(
  process.env.GOOGLE_WALLET_ISSUER_ID &&
    process.env.GOOGLE_WALLET_SA_EMAIL &&
    process.env.GOOGLE_WALLET_SA_KEY &&
    process.env.GOOGLE_WALLET_CLASS_ID
);

// Décode une valeur d'env en PEM (accepte le base64 ou le PEM brut).
export function decodePem(value: string | undefined): string {
  if (!value) return "";
  const v = value.trim();
  if (v.includes("-----BEGIN")) return v.replace(/\\n/g, "\n");
  try {
    return Buffer.from(v, "base64").toString("utf8");
  } catch {
    return v;
  }
}
