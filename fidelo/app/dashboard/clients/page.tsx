"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ExternalLink,
  Gift,
  Plus,
  Search,
  Stamp,
  Trash2,
  Zap,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  Modal,
  PageHeading,
} from "@/components/ui";
import { StampCard } from "@/components/StampCard";
import { Reveal } from "@/components/Reveal";
import { useToast } from "@/components/Toast";
import {
  addClient,
  addStamp,
  currentMerchant,
  deleteClient,
  listClientActivity,
  listClients,
} from "@/lib/store";
import { useStoreVersion } from "@/lib/useStore";
import { avatarColor, timeAgo, unitWord } from "@/lib/format";
import { notifyReward } from "@/lib/notify-client";
import { PLANS, planLimitReached } from "@/lib/plan";
import type { Client } from "@/lib/types";

export default function ClientsPage() {
  useStoreVersion();
  const toast = useToast();
  const merchant = currentMerchant();
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [detail, setDetail] = useState<Client | null>(null);

  const clients = merchant ? listClients(merchant.id) : [];
  const filtered = useMemo(
    () =>
      clients.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
      ),
    [clients, query]
  );

  if (!merchant) return null;
  const limit = PLANS[merchant.plan].clientLimit;
  const unit = unitWord(merchant.programType);
  const Unit = unit.charAt(0).toUpperCase() + unit.slice(1);

  function openAdd() {
    if (planLimitReached(merchant!.plan, clients.length)) {
      setUpgradeOpen(true);
    } else {
      setAddOpen(true);
    }
  }

  function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const email = String(form.get("email") || "").trim();
    if (!name) return;
    addClient(merchant!.id, name, phone, email);
    setAddOpen(false);
    toast(`${name} a été ajouté`);
  }

  function handleStamp(c: Client) {
    const res = addStamp(c.id);
    if (res?.rewarded) {
      toast(`${c.name} a gagné : ${merchant!.rewardLabel} !`, "reward");
      notifyReward(c.id);
    } else {
      toast(`${Unit} ajouté pour ${c.name}`);
    }
    if (detail && detail.id === c.id && res) setDetail(res.client);
  }

  function onDelete(c: Client) {
    if (confirm(`Supprimer ${c.name} ? Sa carte sera effacée.`)) {
      deleteClient(c.id);
      setDetail(null);
      toast(`${c.name} a été supprimé`);
    }
  }

  return (
    <div>
      <PageHeading
        title="Clients"
        subtitle={`${clients.length}${
          limit === Infinity ? "" : ` / ${limit}`
        } clients fidèles`}
        action={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        }
      />

      {/* Recherche */}
      <Reveal className="relative mb-4">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un client..."
          className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-[15px] transition-all focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
      </Reveal>

      {/* Liste */}
      <Reveal delay={80}>
      <Card bezel className="divide-y divide-slate-100 overflow-hidden">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 p-4 transition-colors hover:bg-slate-50"
          >
            <button
              onClick={() => setDetail(c)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <Avatar name={c.name} colorClass={avatarColor(c.id)} />
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{c.name}</p>
                <p className="truncate text-xs text-slate-400">
                  {c.phone || "—"} · {timeAgo(c.lastVisit)}
                </p>
              </div>
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <Badge color={c.stamps >= merchant.stampsGoal - 1 ? "amber" : "slate"}>
                {c.stamps}/{merchant.stampsGoal}
              </Badge>
              {c.rewardsEarned > 0 && (
                <Badge color="brand">{c.rewardsEarned} 🎁</Badge>
              )}
            </div>
            <Button size="sm" onClick={() => handleStamp(c)}>
              <Stamp className="h-4 w-4" />
              <span className="hidden sm:inline">{Unit}</span>
            </Button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-slate-400">
              {query ? "Aucun client trouvé." : "Ajoutez votre premier client pour commencer."}
            </p>
          </div>
        )}
      </Card>
      </Reveal>

      {/* Modal ajout client */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nouveau client">
        <form onSubmit={onAdd} className="space-y-4">
          <Input name="name" label="Prénom et nom" placeholder="Ex : Julien Petit" required autoFocus />
          <Input name="phone" label="Téléphone (optionnel)" placeholder="06 12 34 56 78" />
          <Input
            name="email"
            type="email"
            label="Email (optionnel)"
            placeholder="julien@exemple.fr"
            hint="Pour prévenir le client quand il gagne sa récompense."
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" full onClick={() => setAddOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" full>
              Ajouter
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal upgrade (limite atteinte) */}
      <Modal open={upgradeOpen} onClose={() => setUpgradeOpen(false)}>
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-glow">
            <Zap className="h-7 w-7" />
          </span>
          <h3 className="mt-4 text-xl font-bold text-ink">Limite du plan gratuit atteinte</h3>
          <p className="mt-2 text-slate-600">
            Le plan gratuit est limité à {limit} clients. Passez au Pro pour des
            clients illimités.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button href="/dashboard/settings" full size="lg">
              Passer au Pro — 19€/mois
            </Button>
            <Button variant="ghost" full onClick={() => setUpgradeOpen(false)}>
              Plus tard
            </Button>
          </div>
        </div>
      </Modal>

      {/* Détail client (carte) */}
      <Modal open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <div>
            <StampCard
              shopName={merchant.shopName}
              rewardLabel={merchant.rewardLabel}
              stamps={detail.stamps}
              goal={merchant.stampsGoal}
              clientName={detail.name}
              unit={unitWord(merchant.programType, 2)}
              compact
            />
            {(detail.email || detail.phone) && (
              <p className="mt-3 truncate text-center text-xs text-slate-400">
                {[detail.phone, detail.email].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-lg font-bold text-ink">{detail.stamps}</p>
                <p className="text-xs text-slate-500">{unitWord(merchant.programType, 2)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-lg font-bold text-ink">{detail.rewardsEarned}</p>
                <p className="text-xs text-slate-500">récompenses</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-bold text-ink">{timeAgo(detail.lastVisit)}</p>
                <p className="text-xs text-slate-500">dernière visite</p>
              </div>
            </div>

            {/* Historique du client */}
            {listClientActivity(detail.id).length > 0 && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Historique
                </p>
                <ul className="mt-2 space-y-2">
                  {listClientActivity(detail.id, 5).map((a) => (
                    <li key={a.id} className="flex items-center gap-2 text-sm">
                      {a.type === "reward" ? (
                        <Gift className="h-4 w-4 shrink-0 text-brand-500" />
                      ) : (
                        <Stamp className="h-4 w-4 shrink-0 text-emerald-500" />
                      )}
                      <span className="flex-1 text-slate-600">
                        {a.type === "reward"
                          ? "Récompense gagnée"
                          : `${Unit} reçu`}
                      </span>
                      <span className="text-xs text-slate-400">{timeAgo(a.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <Button full size="lg" onClick={() => handleStamp(detail)}>
                <Stamp className="h-5 w-5" />
                Ajouter un {unit}
              </Button>
              <Button
                href={`/carte/${detail.id}`}
                variant="secondary"
                size="lg"
              >
                <ExternalLink className="h-5 w-5" />
              </Button>
            </div>
            <button
              onClick={() => onDelete(detail)}
              className="mt-4 flex w-full items-center justify-center gap-2 text-sm text-slate-400 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer ce client
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
