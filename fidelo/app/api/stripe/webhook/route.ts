import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Webhook Stripe : synchronise l'abonnement -> merchants.plan.
// Utilise le client "service role" (contourne la RLS) car il n'y a pas
// d'utilisateur authentifié dans une requête serveur-à-serveur.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Signature invalide: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  async function setPlanByCustomer(
    customerId: string,
    merchantId: string | undefined,
    fields: Record<string, unknown>
  ) {
    const query = admin.from("merchants").update(fields);
    if (merchantId) await query.eq("id", merchantId);
    else await query.eq("stripe_customer_id", customerId);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      await setPlanByCustomer(String(s.customer), s.metadata?.merchant_id, {
        plan: "pro",
        plan_status: "active",
        stripe_subscription_id: String(s.subscription ?? ""),
        stripe_customer_id: String(s.customer ?? ""),
      });
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const active = ["active", "trialing", "past_due"].includes(sub.status);
      await setPlanByCustomer(String(sub.customer), sub.metadata?.merchant_id, {
        plan: active ? "pro" : "free",
        plan_status: sub.status,
        stripe_subscription_id: sub.id,
      });
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await setPlanByCustomer(String(sub.customer), sub.metadata?.merchant_id, {
        plan: "free",
        plan_status: "canceled",
        stripe_subscription_id: null,
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
