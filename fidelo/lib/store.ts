"use client";

// Store de démonstration : source de vérité côté navigateur (localStorage).
// Isole toute la logique de données pour qu'un backend réel (Supabase) puisse
// remplacer ce fichier sans toucher aux composants.

import type {
  Activity,
  Client,
  DashboardStats,
  Merchant,
  PlanId,
} from "./types";
import { DEMO_MERCHANT, seedActivity, seedClients } from "./seed";

interface DB {
  merchants: Merchant[];
  clients: Client[];
  activity: Activity[];
  session: string | null; // merchantId connecté
}

const KEY = "fidelo:db:v1";
const listeners = new Set<() => void>();
let version = 0;

export function getVersion() {
  return version;
}

function emptyDB(): DB {
  return { merchants: [], clients: [], activity: [], session: null };
}

function load(): DB {
  if (typeof window === "undefined") return emptyDB();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    /* ignore */
  }
  // Premier lancement : on sème le compte de démonstration.
  const clients = seedClients();
  const db: DB = {
    merchants: [DEMO_MERCHANT],
    clients,
    activity: seedActivity(clients),
    session: null,
  };
  persist(db);
  return db;
}

function persist(db: DB) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(db));
  version += 1;
  listeners.forEach((l) => l());
}

function get(): DB {
  return load();
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

/* ---------- Auth (démo) ---------- */

export function signup(input: {
  email: string;
  shopName: string;
  ownerName: string;
}): Merchant {
  const db = get();
  const existing = db.merchants.find((m) => m.email === input.email);
  if (existing) {
    db.session = existing.id;
    persist(db);
    return existing;
  }
  const merchant: Merchant = {
    id: uid("m"),
    email: input.email,
    shopName: input.shopName || "Mon commerce",
    ownerName: input.ownerName || "",
    category: "autre",
    plan: "free",
    stampsGoal: 10,
    rewardLabel: "Une récompense offerte",
    createdAt: new Date().toISOString(),
    onboarded: false,
  };
  db.merchants.push(merchant);
  db.session = merchant.id;
  persist(db);
  return merchant;
}

export function login(email: string): Merchant | null {
  const db = get();
  const m = db.merchants.find((x) => x.email === email);
  if (!m) return null;
  db.session = m.id;
  persist(db);
  return m;
}

export function loginDemo(): Merchant {
  const db = get();
  db.session = DEMO_MERCHANT.id;
  persist(db);
  return db.merchants.find((m) => m.id === DEMO_MERCHANT.id)!;
}

export function logout() {
  const db = get();
  db.session = null;
  persist(db);
}

export function currentMerchant(): Merchant | null {
  const db = get();
  if (!db.session) return null;
  return db.merchants.find((m) => m.id === db.session) ?? null;
}

export function updateMerchant(patch: Partial<Merchant>): Merchant | null {
  const db = get();
  const m = db.merchants.find((x) => x.id === db.session);
  if (!m) return null;
  Object.assign(m, patch);
  persist(db);
  return m;
}

export function setPlan(plan: PlanId) {
  return updateMerchant({ plan });
}

/* ---------- Clients ---------- */

export function listClients(merchantId: string): Client[] {
  return get()
    .clients.filter((c) => c.merchantId === merchantId)
    .sort((a, b) => (b.lastVisit ?? "").localeCompare(a.lastVisit ?? ""));
}

export function getClient(id: string): Client | null {
  return get().clients.find((c) => c.id === id) ?? null;
}

export function addClient(merchantId: string, name: string, phone: string): Client {
  const db = get();
  const client: Client = {
    id: uid("c"),
    merchantId,
    name,
    phone,
    stamps: 0,
    rewardsEarned: 0,
    createdAt: new Date().toISOString(),
    lastVisit: null,
  };
  db.clients.push(client);
  persist(db);
  return client;
}

export function deleteClient(id: string) {
  const db = get();
  db.clients = db.clients.filter((c) => c.id !== id);
  persist(db);
}

// Cœur du produit : ajouter un tampon. Renvoie true si une récompense est gagnée.
export function addStamp(clientId: string): { client: Client; rewarded: boolean } | null {
  const db = get();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) return null;
  const merchant = db.merchants.find((m) => m.id === client.merchantId);
  const goal = merchant?.stampsGoal ?? 10;

  client.stamps += 1;
  client.lastVisit = new Date().toISOString();
  let rewarded = false;

  db.activity.unshift({
    id: uid("a"),
    merchantId: client.merchantId,
    clientId: client.id,
    clientName: client.name,
    type: "stamp",
    createdAt: new Date().toISOString(),
  });

  if (client.stamps >= goal) {
    client.stamps = 0;
    client.rewardsEarned += 1;
    rewarded = true;
    db.activity.unshift({
      id: uid("a"),
      merchantId: client.merchantId,
      clientId: client.id,
      clientName: client.name,
      type: "reward",
      createdAt: new Date().toISOString(),
    });
  }
  db.activity = db.activity.slice(0, 100);
  persist(db);
  return { client, rewarded };
}

/* ---------- Dashboard ---------- */

export function listActivity(merchantId: string): Activity[] {
  return get()
    .activity.filter((a) => a.merchantId === merchantId)
    .slice(0, 20);
}

export function stats(merchantId: string): DashboardStats {
  const clients = get().clients.filter((c) => c.merchantId === merchantId);
  const activity = get().activity.filter((a) => a.merchantId === merchantId);
  const monthAgo = Date.now() - 30 * 86400000;
  return {
    totalClients: clients.length,
    stampsThisMonth: activity.filter(
      (a) => a.type === "stamp" && new Date(a.createdAt).getTime() > monthAgo
    ).length,
    rewardsRedeemed: clients.reduce((s, c) => s + c.rewardsEarned, 0),
    activeClients: clients.filter(
      (c) => c.lastVisit && new Date(c.lastVisit).getTime() > monthAgo
    ).length,
  };
}

// Réinitialise la démo (utile pour les tests / présentations).
export function resetDemo() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  load();
}
