import "server-only";
import { createClient } from "./server";
import type {
  Activity,
  Client,
  DashboardStats,
  Merchant,
  ShopCategory,
} from "@/lib/types";

// Couche de données Supabase — même API que lib/store.ts (démo), en async.
// Les composants serveur / route handlers l'utilisent en production.

/* ---------- Mapping DB (snake_case) -> App ---------- */

function mapMerchant(r: any): Merchant {
  return {
    id: r.id,
    email: r.email,
    shopName: r.shop_name,
    ownerName: r.owner_name,
    category: r.category as ShopCategory,
    plan: r.plan,
    programType: r.program_type ?? "stamps",
    stampsGoal: r.stamps_goal,
    rewardLabel: r.reward_label,
    onboarded: r.onboarded,
    createdAt: r.created_at,
  };
}

function mapClient(r: any): Client {
  return {
    id: r.id,
    merchantId: r.merchant_id,
    name: r.name,
    phone: r.phone,
    email: r.email ?? "",
    stamps: r.stamps,
    rewardsEarned: r.rewards_earned,
    createdAt: r.created_at,
    lastVisit: r.last_visit,
  };
}

function mapActivity(r: any): Activity {
  return {
    id: r.id,
    merchantId: r.merchant_id,
    clientId: r.client_id,
    clientName: r.client_name,
    type: r.type,
    createdAt: r.created_at,
  };
}

/* ---------- Merchant courant ---------- */

export async function getCurrentMerchant(): Promise<Merchant | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", user.id)
    .single();
  return data ? mapMerchant(data) : null;
}

export async function updateMerchant(
  patch: Partial<Merchant>
): Promise<Merchant | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const row: Record<string, unknown> = {};
  if (patch.shopName !== undefined) row.shop_name = patch.shopName;
  if (patch.ownerName !== undefined) row.owner_name = patch.ownerName;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.programType !== undefined) row.program_type = patch.programType;
  if (patch.stampsGoal !== undefined) row.stamps_goal = patch.stampsGoal;
  if (patch.rewardLabel !== undefined) row.reward_label = patch.rewardLabel;
  if (patch.onboarded !== undefined) row.onboarded = patch.onboarded;
  const { data } = await supabase
    .from("merchants")
    .update(row)
    .eq("id", user.id)
    .select("*")
    .single();
  return data ? mapMerchant(data) : null;
}

/* ---------- Clients ---------- */

export async function listClients(): Promise<Client[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .order("last_visit", { ascending: false, nullsFirst: false });
  return (data ?? []).map(mapClient);
}

export async function addClient(
  name: string,
  phone: string,
  email = ""
): Promise<Client | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("clients")
    .insert({ merchant_id: user.id, name, phone, email })
    .select("*")
    .single();
  return data ? mapClient(data) : null;
}

export async function deleteClient(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("clients").delete().eq("id", id);
}

// Ajoute un tampon via la fonction SQL atomique add_stamp().
export async function addStamp(
  clientId: string
): Promise<{ stamps: number; rewarded: boolean } | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("add_stamp", {
    p_client_id: clientId,
  });
  if (error || !data || !data[0]) return null;
  return { stamps: data[0].stamps, rewarded: data[0].rewarded };
}

/* ---------- Dashboard ---------- */

export async function listActivity(): Promise<Activity[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []).map(mapActivity);
}

export async function getStats(): Promise<DashboardStats> {
  const supabase = createClient();
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const [{ data: clients }, { count: stampsMonth }] = await Promise.all([
    supabase.from("clients").select("rewards_earned,last_visit"),
    supabase
      .from("activity")
      .select("*", { count: "exact", head: true })
      .eq("type", "stamp")
      .gte("created_at", monthAgo),
  ]);
  const list = clients ?? [];
  return {
    totalClients: list.length,
    stampsThisMonth: stampsMonth ?? 0,
    rewardsRedeemed: list.reduce((s: number, c: any) => s + c.rewards_earned, 0),
    activeClients: list.filter(
      (c: any) => c.last_visit && c.last_visit > monthAgo
    ).length,
  };
}

/* ---------- Carte publique ---------- */

export async function getPublicCard(clientId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .rpc("get_public_card", { p_client_id: clientId })
    .single();
  if (!data) return null;
  const d = data as any;
  return {
    clientName: d.client_name as string,
    stamps: d.stamps as number,
    goal: d.goal as number,
    shopName: d.shop_name as string,
    rewardLabel: d.reward_label as string,
  };
}
