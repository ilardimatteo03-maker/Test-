import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PKPass } from "passkit-generator";
import { getPublicCard } from "@/lib/supabase/data";
import { isAppleWalletConfigured, decodePem } from "@/lib/wallet/config";
import { APP_URL } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Génère une carte de fidélité Apple Wallet (.pkpass) pour un client.
// iOS reconnaît le type MIME et propose « Ajouter à Apple Wallet ».
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!isAppleWalletConfigured) {
    return NextResponse.json(
      { error: "Apple Wallet non configuré. Voir WALLET_SETUP.md." },
      { status: 501 }
    );
  }

  const card = await getPublicCard(params.id);
  if (!card) {
    return NextResponse.json({ error: "Carte introuvable" }, { status: 404 });
  }

  // Visuels de la carte (à placer dans public/wallet/).
  const dir = path.join(process.cwd(), "public", "wallet");
  async function img(name: string): Promise<Buffer | null> {
    try {
      return await readFile(path.join(dir, name));
    } catch {
      return null;
    }
  }
  const icon = await img("icon.png");
  if (!icon) {
    return NextResponse.json(
      { error: "Ajoutez public/wallet/icon.png (voir WALLET_SETUP.md)." },
      { status: 501 }
    );
  }
  const buffers: Record<string, Buffer> = { "icon.png": icon };
  for (const name of [
    "icon@2x.png",
    "icon@3x.png",
    "logo.png",
    "logo@2x.png",
    "logo@3x.png",
  ]) {
    const b = await img(name);
    if (b) buffers[name] = b;
  }

  const pass = new PKPass(
    buffers,
    {
      wwdr: decodePem(process.env.APPLE_WWDR_CERT),
      signerCert: decodePem(process.env.APPLE_PASS_CERT),
      signerKey: decodePem(process.env.APPLE_PASS_KEY),
      signerKeyPassphrase: process.env.APPLE_PASS_KEY_PASSPHRASE,
    },
    {
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID!,
      teamIdentifier: process.env.APPLE_TEAM_ID!,
      organizationName: card.shopName,
      description: `Carte de fidélité — ${card.shopName}`,
      serialNumber: params.id,
      foregroundColor: "rgb(255,255,255)",
      backgroundColor: "rgb(47,107,255)",
      labelColor: "rgb(219,230,255)",
    }
  );

  pass.type = "storeCard";
  pass.headerFields.push({ key: "shop", label: "COMMERCE", value: card.shopName });
  pass.primaryFields.push({
    key: "stamps",
    label: "TAMPONS",
    value: `${card.stamps} / ${card.goal}`,
  });
  pass.secondaryFields.push({
    key: "reward",
    label: "RÉCOMPENSE",
    value: card.rewardLabel,
  });
  pass.secondaryFields.push({
    key: "client",
    label: "CLIENT",
    value: card.clientName,
  });
  pass.backFields.push({
    key: "info",
    label: "Comment ça marche",
    value: `Présentez ce code au commerçant à chaque passage. Après ${card.goal} tampons : ${card.rewardLabel}.`,
  });

  // QR code : identique au flux existant (/scan/<id>).
  pass.setBarcodes({
    message: `${APP_URL}/scan/${params.id}`,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
  });

  const buffer = pass.getAsBuffer();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="fidelo-${params.id}.pkpass"`,
    },
  });
}
