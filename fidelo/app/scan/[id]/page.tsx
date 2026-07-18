"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Gift, LogIn, ScanLine, Stamp } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Avatar, Button } from "@/components/ui";
import { addStamp, currentMerchant, getClient } from "@/lib/store";
import { avatarColor, unitWord } from "@/lib/format";
import { notifyReward } from "@/lib/notify-client";
import type { Client, Merchant } from "@/lib/types";

type Status = "loading" | "guest" | "forbidden" | "ready" | "done";

// Cible du QR client : le commerçant l'ouvre (caméra du téléphone) et valide
// le passage en 1 tap. Sécurisé : seul le commerçant propriétaire peut tamponner.
export default function ScanPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [client, setClient] = useState<Client | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [rewarded, setRewarded] = useState(false);

  useEffect(() => {
    const m = currentMerchant();
    const c = getClient(params.id);
    if (!m) {
      setClient(c);
      setStatus("guest");
      return;
    }
    if (!c || c.merchantId !== m.id) {
      setStatus("forbidden");
      return;
    }
    setMerchant(m);
    setClient(c);
    setStatus("ready");
  }, [params.id]);

  function validate() {
    if (!client) return;
    const res = addStamp(client.id);
    if (res) {
      setClient(res.client);
      setRewarded(res.rewarded);
      if (res.rewarded) notifyReward(client.id);
      setStatus("done");
    }
  }

  const unit = unitWord(merchant?.programType);
  const Unit = unit.charAt(0).toUpperCase() + unit.slice(1);

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-gradient-to-b from-slate-50 to-slate-100 px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo href={null} />
        </div>

        <div className="mt-8 rounded-[1.6rem] border border-slate-200/70 bg-white p-6 shadow-card">
          {status === "loading" && (
            <div className="grid place-items-center py-10">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
            </div>
          )}

          {/* Commerçant non connecté */}
          {status === "guest" && (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <LogIn className="h-7 w-7" />
              </span>
              <h1 className="mt-4 text-xl font-bold text-ink">Connexion commerçant</h1>
              <p className="mt-2 text-slate-600">
                Connectez-vous à votre compte Fidélo pour ajouter le passage
                {client ? ` de ${client.name}` : ""}.
              </p>
              <Button
                href={`/login?next=/scan/${params.id}`}
                full
                size="lg"
                className="mt-6"
                arrow
              >
                Se connecter
              </Button>
            </div>
          )}

          {/* Client inconnu ou pas le bon commerce */}
          {status === "forbidden" && (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500">
                <ScanLine className="h-7 w-7" />
              </span>
              <h1 className="mt-4 text-xl font-bold text-ink">Carte non reconnue</h1>
              <p className="mt-2 text-slate-600">
                Cette carte n'appartient pas à votre commerce.
              </p>
              <Button href="/dashboard" variant="secondary" full className="mt-6">
                Retour au tableau de bord
              </Button>
            </div>
          )}

          {/* Prêt à valider (anti double-tampon : confirmation explicite) */}
          {status === "ready" && client && merchant && (
            <div className="text-center">
              <span className="eyebrow">
                <ScanLine className="mr-1.5 h-3.5 w-3.5" />
                Passage en caisse
              </span>
              <div className="mt-5 flex flex-col items-center gap-3">
                <Avatar name={client.name} colorClass={avatarColor(client.id)} size={64} />
                <div>
                  <p className="text-lg font-bold text-ink">{client.name}</p>
                  <p className="text-sm text-slate-500">
                    {client.stamps} / {merchant.stampsGoal} {unitWord(merchant.programType, 2)}
                  </p>
                </div>
              </div>
              <Button full size="lg" className="mt-6" onClick={validate} arrow>
                Valider le passage (+1 {unit})
              </Button>
              <Button href="/dashboard" variant="ghost" full className="mt-2">
                Annuler
              </Button>
            </div>
          )}

          {/* Confirmation */}
          {status === "done" && client && merchant && (
            <div className="text-center">
              <span
                className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${
                  rewarded
                    ? "bg-brand-500 text-white shadow-glow"
                    : "bg-emerald-500 text-white"
                } animate-pop`}
              >
                {rewarded ? <Gift className="h-8 w-8" /> : <Check className="h-8 w-8" strokeWidth={3} />}
              </span>
              <h1 className="mt-4 text-xl font-bold text-ink">
                {rewarded ? "Récompense gagnée" : `${Unit} ajouté !`}
              </h1>
              <p className="mt-2 text-slate-600">
                {rewarded
                  ? `${client.name} a rempli sa carte : ${merchant.rewardLabel.toLowerCase()}.`
                  : `${client.name} a maintenant ${client.stamps} / ${merchant.stampsGoal} ${unitWord(merchant.programType, 2)}.`}
              </p>
              <Button
                href="/dashboard/scan"
                full
                size="lg"
                className="mt-6"
                arrow
              >
                Scanner le client suivant
              </Button>
              <Button
                href="/dashboard"
                variant="secondary"
                full
                className="mt-2"
              >
                Tableau de bord
              </Button>
            </div>
          )}
        </div>

        {status === "ready" && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
            <Stamp className="h-3.5 w-3.5" />
            Un seul {unit} par passage
          </p>
        )}
      </div>
    </div>
  );
}
