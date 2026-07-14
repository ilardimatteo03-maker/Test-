import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { APP_URL } from "@/lib/config";

// Ouvre le portail de facturation Stripe (gérer / annuler l'abonnement).
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
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!merchant?.stripe_customer_id) {
    return NextResponse.json({ error: "Aucun abonnement" }, { status: 400 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: merchant.stripe_customer_id,
    return_url: `${APP_URL}/dashboard/settings`,
  });

  return NextResponse.json({ url: session.url });
}
