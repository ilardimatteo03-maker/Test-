import Stripe from "stripe";

// Instance Stripe côté serveur, initialisée à la demande (évite de planter
// le build quand la clé n'est pas encore configurée).
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY manquant");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export function proPriceId(): string {
  const id = process.env.STRIPE_PRICE_PRO_MONTHLY;
  if (!id) throw new Error("STRIPE_PRICE_PRO_MONTHLY manquant");
  return id;
}
