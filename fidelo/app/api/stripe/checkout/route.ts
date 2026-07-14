import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, proPriceId } from "@/lib/stripe";
import { APP_URL } from "@/lib/config";

// Crée une session Stripe Checkout pour l'abonnement Fidélo Pro (mensuel).
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();

  const stripe = getStripe();

  // Réutilise ou crée le client Stripe, lié au merchant.
  let customerId = merchant?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: merchant?.email ?? user.email ?? undefined,
      metadata: { merchant_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("merchants")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: proPriceId(), quantity: 1 }],
    success_url: `${APP_URL}/dashboard/settings?upgrade=success`,
    cancel_url: `${APP_URL}/dashboard/settings?upgrade=cancel`,
    metadata: { merchant_id: user.id },
    subscription_data: { metadata: { merchant_id: user.id } },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
