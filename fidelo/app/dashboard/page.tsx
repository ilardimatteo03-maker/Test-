"use client";

import Link from "next/link";
import {
  ArrowRight,
  Gift,
  Plus,
  Stamp,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Avatar, Button, Card, PageHeading } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { useToast } from "@/components/Toast";
import {
  addStamp,
  currentMerchant,
  listActivity,
  listClients,
  stats,
} from "@/lib/store";
import { useStoreVersion } from "@/lib/useStore";
import { avatarColor, timeAgo } from "@/lib/format";
import { PLANS } from "@/lib/plan";

export default function DashboardPage() {
  useStoreVersion();
  const toast = useToast();
  const merchant = currentMerchant();
  if (!merchant) return null;

  const s = stats(merchant.id);
  const clients = listClients(merchant.id);
  const activity = listActivity(merchant.id);
  const topClients = [...clients]
    .sort((a, b) => b.stamps - a.stamps)
    .slice(0, 5);

  function handleStamp(clientId: string, name: string) {
    const res = addStamp(clientId);
    if (res?.rewarded) {
      toast(`🎉 ${name} a gagné : ${merchant!.rewardLabel} !`, "reward");
    } else {
      toast(`Tampon ajouté pour ${name}`);
    }
  }

  const statCards = [
    { label: "Clients", value: s.totalClients, icon: Users, color: "text-brand-600 bg-brand-50" },
    { label: "Tampons ce mois", value: s.stampsThisMonth, icon: Stamp, color: "text-emerald-600 bg-emerald-50" },
    { label: "Récompenses offertes", value: s.rewardsRedeemed, icon: Gift, color: "text-amber-600 bg-amber-50" },
    { label: "Clients actifs (30j)", value: s.activeClients, icon: TrendingUp, color: "text-sky-600 bg-sky-50" },
  ];

  const limit = PLANS[merchant.plan].clientLimit;
  const nearLimit = merchant.plan === "free" && s.totalClients >= limit * 0.7;

  return (
    <div>
      <PageHeading
        title={`Bonjour, ${merchant.ownerName?.split(" ")[0] || "à vous"} 👋`}
        subtitle="Voici l'activité de votre programme de fidélité."
        action={
          <Button href="/dashboard/clients">
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        }
      />

      {/* Stats — cartes double-bezel (soft-skill) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((c, i) => (
          <Reveal
            key={c.label}
            delay={i * 70}
            className="group rounded-[1.4rem] border border-slate-200/60 bg-white/50 p-1.5 shadow-soft transition-all duration-500 ease-spring hover:-translate-y-1 hover:shadow-float"
          >
            <div className="rounded-[1.05rem] bg-white p-5 shadow-inset">
              <span
                className={`grid h-10 w-10 place-items-center rounded-xl ${c.color} transition-transform duration-500 ease-spring group-hover:scale-110`}
              >
                <c.icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <p className="mt-4 font-display text-3xl font-extrabold text-ink">
                {c.value}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">{c.label}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Bandeau upgrade (monétisation) */}
      {nearLimit && (
        <Card className="mt-6 border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
                <Zap className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-ink">
                  Vous approchez de la limite gratuite ({s.totalClients}/{limit} clients)
                </p>
                <p className="text-sm text-slate-600">
                  Passez au plan Pro pour des clients illimités et bien plus.
                </p>
              </div>
            </div>
            <Button href="/dashboard/settings">Passer au Pro</Button>
          </div>
        </Card>
      )}

      <Reveal className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Action rapide : ajouter un tampon */}
        <Card className="p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink">Ajouter un tampon</h2>
            <Link
              href="/dashboard/clients"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
            >
              Tous les clients <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Un client passe ? Appuyez sur « + », c'est tout.
          </p>
          <div className="mt-4 divide-y divide-slate-100">
            {topClients.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-3">
                <Avatar name={c.name} colorClass={avatarColor(c.id)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{c.name}</p>
                  <p className="text-xs text-slate-400">
                    {c.stamps}/{merchant.stampsGoal} tampons · {timeAgo(c.lastVisit)}
                  </p>
                </div>
                <Button size="sm" onClick={() => handleStamp(c.id, c.name)}>
                  <Plus className="h-4 w-4" />
                  Tampon
                </Button>
              </div>
            ))}
            {topClients.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">
                Aucun client pour le moment.
              </p>
            )}
          </div>
        </Card>

        {/* Activité récente */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-bold text-ink">Activité récente</h2>
          <div className="mt-4 space-y-4">
            {activity.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                    a.type === "reward"
                      ? "bg-brand-100 text-brand-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {a.type === "reward" ? (
                    <Gift className="h-4 w-4" />
                  ) : (
                    <Stamp className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">
                    <span className="font-medium">{a.clientName}</span>{" "}
                    {a.type === "reward" ? "a gagné une récompense" : "a reçu un tampon"}
                  </p>
                  <p className="text-xs text-slate-400">{timeAgo(a.createdAt)}</p>
                </div>
              </div>
            ))}
            {activity.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">
                L'activité de vos clients apparaîtra ici.
              </p>
            )}
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
