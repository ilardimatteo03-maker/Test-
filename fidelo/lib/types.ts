// Modèle de données Fidélo.
// Ces types décrivent aussi bien le mode démo (localStorage) que le futur
// schéma Supabase — les noms de champs sont pensés pour être repris tels quels.

export type PlanId = "free" | "pro";

export interface Merchant {
  id: string;
  email: string;
  shopName: string;
  ownerName: string;
  category: ShopCategory;
  plan: PlanId;
  // Règle de la carte : X tampons = 1 récompense
  stampsGoal: number;
  rewardLabel: string;
  createdAt: string;
  onboarded: boolean;
}

export type ShopCategory =
  | "restaurant"
  | "coiffeur"
  | "snack"
  | "boutique"
  | "cafe"
  | "autre";

export interface Client {
  id: string;
  merchantId: string;
  name: string;
  phone: string;
  stamps: number; // tampons sur la carte en cours
  rewardsEarned: number; // récompenses déjà gagnées au total
  createdAt: string;
  lastVisit: string | null;
}

export interface Activity {
  id: string;
  merchantId: string;
  clientId: string;
  clientName: string;
  type: "stamp" | "reward";
  createdAt: string;
}

export interface DashboardStats {
  totalClients: number;
  stampsThisMonth: number;
  rewardsRedeemed: number;
  activeClients: number; // visite dans les 30 derniers jours
}
