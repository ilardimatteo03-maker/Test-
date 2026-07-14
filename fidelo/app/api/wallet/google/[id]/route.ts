import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getPublicCard } from "@/lib/supabase/data";
import { isGoogleWalletConfigured, decodePem } from "@/lib/wallet/config";
import { APP_URL } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Renvoie un lien signé « Ajouter à Google Wallet » pour un client.
// La Loyalty Class référencée (GOOGLE_WALLET_CLASS_ID) doit exister au
// préalable (créée une fois via l'API Google Wallet — voir WALLET_SETUP.md).
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!isGoogleWalletConfigured) {
    return NextResponse.json(
      { error: "Google Wallet non configuré. Voir WALLET_SETUP.md." },
      { status: 501 }
    );
  }

  const card = await getPublicCard(params.id);
  if (!card) {
    return NextResponse.json({ error: "Carte introuvable" }, { status: 404 });
  }

  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID!;
  const classId = process.env.GOOGLE_WALLET_CLASS_ID!;
  const safeId = params.id.replace(/[^\w.-]/g, "");
  const objectId = `${issuerId}.fidelo_${safeId}`;

  const loyaltyObject = {
    id: objectId,
    classId,
    state: "ACTIVE",
    accountName: card.clientName,
    accountId: params.id,
    loyaltyPoints: {
      label: "Tampons",
      balance: { string: `${card.stamps} / ${card.goal}` },
    },
    barcode: {
      type: "QR_CODE",
      value: `${APP_URL}/scan/${params.id}`,
      alternateText: card.shopName,
    },
    textModulesData: [
      { id: "reward", header: "Récompense", body: card.rewardLabel },
    ],
  };

  const claims = {
    iss: process.env.GOOGLE_WALLET_SA_EMAIL!,
    aud: "google",
    typ: "savetowallet",
    origins: [APP_URL],
    payload: { loyaltyObjects: [loyaltyObject] },
  };

  const token = jwt.sign(claims, decodePem(process.env.GOOGLE_WALLET_SA_KEY), {
    algorithm: "RS256",
  });

  const saveUrl = `https://pay.google.com/gp/v/save/${token}`;
  return NextResponse.json({ url: saveUrl });
}
