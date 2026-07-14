"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Gift, MapPin, ScanLine, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { StampCard } from "@/components/StampCard";
import { WalletButtons } from "@/components/WalletButtons";
import { currentMerchant, getClient } from "@/lib/store";
import { useStoreVersion } from "@/lib/useStore";
import { DEMO_MERCHANT } from "@/lib/seed";
import type { Client, Merchant } from "@/lib/types";

// Page publique : ce que le client voit sur son téléphone.
// (Démo : lit les données locales du navigateur.)
export default function PublicCardPage() {
  useStoreVersion();
  const params = useParams<{ id: string }>();
  const [state, setState] = useState<{ client: Client | null; merchant: Merchant | null }>(
    { client: null, merchant: null }
  );
  const [loaded, setLoaded] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    const client = getClient(params.id);
    // On retrouve le commerce : session courante ou compte démo.
    const merchant = currentMerchant() ?? DEMO_MERCHANT;
    setState({ client, merchant });
    setOrigin(window.location.origin);
    setLoaded(true);
  }, [params.id]);

  if (!loaded) return null;

  const { client, merchant } = state;

  if (!client || !merchant) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center">
        <div>
          <Logo href={null} />
          <p className="mt-6 text-slate-500">Cette carte de fidélité est introuvable.</p>
        </div>
      </div>
    );
  }

  const remaining = Math.max(0, merchant.stampsGoal - client.stamps);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto flex max-w-md flex-col px-5 py-10">
        <div className="flex items-center justify-center">
          <Logo href={null} />
        </div>

        <div className="mt-8">
          <StampCard
            shopName={merchant.shopName}
            rewardLabel={merchant.rewardLabel}
            stamps={client.stamps}
            goal={merchant.stampsGoal}
            clientName={client.name}
            qrValue={origin ? `${origin}/scan/${client.id}` : undefined}
          />
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-slate-500">
          <ScanLine className="h-4 w-4 text-brand-500" />
          Montrez cette carte au commerçant, il scanne le QR.
        </div>

        {/* Message d'encouragement */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-soft">
          {remaining === 0 ? (
            <>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <Gift className="h-6 w-6" />
              </span>
              <p className="mt-3 font-bold text-ink">Votre récompense vous attend 🎉</p>
              <p className="mt-1 text-sm text-slate-500">
                Présentez cette carte : {merchant.rewardLabel.toLowerCase()}.
              </p>
            </>
          ) : (
            <>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-700">
                <Sparkles className="h-6 w-6" />
              </span>
              <p className="mt-3 font-bold text-ink">
                Plus que {remaining} {remaining > 1 ? "tampons" : "tampon"} !
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Encore un peu et vous gagnez : {merchant.rewardLabel.toLowerCase()}.
              </p>
            </>
          )}
        </div>

        {/* Ajout au Wallet du téléphone (Apple / Google) */}
        <WalletButtons clientId={client.id} />

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
          <MapPin className="h-4 w-4" />
          {merchant.shopName}
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          Carte de fidélité digitale propulsée par{" "}
          <span className="font-semibold text-brand-600">Fidélo by ASM.</span>
        </p>
      </div>
    </div>
  );
}
