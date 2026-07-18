import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Notification « récompense gagnée » par email (Resend).
// Activée uniquement quand RESEND_API_KEY est configurée ET Supabase actif —
// en mode démo la route répond 501 et l'appel côté client est silencieux.
export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Notifications non configurées" },
      { status: 501 }
    );
  }

  const { clientId } = await req.json().catch(() => ({ clientId: null }));
  if (!clientId) {
    return NextResponse.json({ error: "clientId manquant" }, { status: 400 });
  }

  // Session commerçant requise : la RLS garantit qu'il ne lit que SES clients.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const [{ data: client }, { data: merchant }] = await Promise.all([
    supabase.from("clients").select("name,email").eq("id", clientId).single(),
    supabase
      .from("merchants")
      .select("shop_name,reward_label")
      .eq("id", user.id)
      .single(),
  ]);

  if (!client?.email || !merchant) {
    // Pas d'email renseigné : rien à envoyer, ce n'est pas une erreur.
    return NextResponse.json({ sent: false });
  }

  const from =
    process.env.NOTIFY_FROM_EMAIL || "Fidélo <notifications@fidelo.app>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [client.email],
      subject: `Votre récompense chez ${merchant.shop_name} !`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <p style="font-size:22px;font-weight:800;margin:0">fidélo<span style="color:#2F6BFF">.</span></p>
          <h1 style="font-size:20px;margin:24px 0 8px">Bravo ${client.name}</h1>
          <p style="color:#475569;line-height:1.6;margin:0">
            Votre carte de fidélité chez <strong>${merchant.shop_name}</strong> est complète.
            Votre récompense vous attend : <strong>${merchant.reward_label}</strong>.
          </p>
          <p style="color:#475569;line-height:1.6">Présentez votre carte lors de votre prochain passage.</p>
          <p style="color:#94a3b8;font-size:12px;margin-top:32px">Carte de fidélité digitale propulsée par Fidélo by ASM.</p>
        </div>`,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Envoi échoué" }, { status: 502 });
  }
  return NextResponse.json({ sent: true });
}
