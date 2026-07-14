import type { Activity, Client, Merchant } from "./types";

// Compte de démonstration — permet de tester le produit immédiatement.
// Email : demo@fidelo.app  /  Mot de passe : demo (n'importe lequel en mode démo)

export const DEMO_MERCHANT: Merchant = {
  id: "m_demo",
  email: "demo@fidelo.app",
  shopName: "Café des Halles",
  ownerName: "Sophie Marchand",
  category: "cafe",
  plan: "free",
  stampsGoal: 10,
  rewardLabel: "Une boisson offerte",
  createdAt: daysAgo(120),
  onboarded: true,
};

const NAMES = [
  "Julien Petit", "Amélie Roche", "Karim Bensaïd", "Léa Fontaine",
  "Marc Dubois", "Nadia Slim", "Théo Girard", "Clara Moreau",
  "Youssef Amrani", "Emma Lefèvre", "Hugo Bernard", "Inès Faure",
  "Paul Mercier", "Sarah Cohen", "Lucas Renaud", "Manon Blanc",
  "Antoine Roy", "Chloé Simon", "Rémi Caron", "Nora Haddad",
  "David Leroy", "Zoé Marchal", "Samuel Klein", "Awa Diallo",
];

export function seedClients(): Client[] {
  return NAMES.map((name, i) => {
    const stamps = Math.floor(Math.random() * 10);
    const lastVisitDays = Math.floor(Math.random() * 45);
    return {
      id: `c_${i + 1}`,
      merchantId: DEMO_MERCHANT.id,
      name,
      phone: `06 ${rand2()} ${rand2()} ${rand2()} ${rand2()}`,
      stamps,
      rewardsEarned: Math.floor(Math.random() * 4),
      createdAt: daysAgo(30 + Math.floor(Math.random() * 90)),
      lastVisit: daysAgo(lastVisitDays),
    };
  });
}

export function seedActivity(clients: Client[]): Activity[] {
  const acts: Activity[] = [];
  const recent = [...clients].slice(0, 8);
  recent.forEach((c, i) => {
    acts.push({
      id: `a_${i + 1}`,
      merchantId: DEMO_MERCHANT.id,
      clientId: c.id,
      clientName: c.name,
      type: i % 5 === 0 ? "reward" : "stamp",
      createdAt: hoursAgo(i * 5 + 1),
    });
  });
  return acts;
}

function rand2() {
  return String(Math.floor(Math.random() * 90) + 10);
}
function daysAgo(d: number) {
  return new Date(Date.now() - d * 86400000).toISOString();
}
function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3600000).toISOString();
}
