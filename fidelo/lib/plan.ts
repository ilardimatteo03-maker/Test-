import type { PlanId } from "./types";

// Limites par plan — la monétisation est câblée dès le départ.
export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number; // €/mois
  clientLimit: number; // Infinity pour illimité
  features: string[];
  highlight?: boolean;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Gratuit",
    price: 0,
    clientLimit: 30,
    features: [
      "Jusqu'à 30 clients",
      "1 carte de fidélité",
      "Page carte pour vos clients",
      "Statistiques de base",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 19,
    clientLimit: Infinity,
    highlight: true,
    features: [
      "Clients illimités",
      "Récompenses personnalisées",
      "Statistiques avancées",
      "Export des données",
      "Support prioritaire",
    ],
  },
};

export function planLimitReached(plan: PlanId, clientCount: number): boolean {
  return clientCount >= PLANS[plan].clientLimit;
}
