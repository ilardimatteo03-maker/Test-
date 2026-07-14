"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { Button, Input } from "@/components/ui";
import { signup } from "@/lib/store";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    signup({
      email: String(form.get("email") || ""),
      ownerName: String(form.get("ownerName") || ""),
      shopName: String(form.get("shopName") || ""),
    });
    // Redirige vers l'onboarding (guide en 3 étapes)
    setTimeout(() => router.push("/onboarding"), 300);
  }

  return (
    <AuthShell
      title="Créez votre compte"
      subtitle="Gratuit jusqu'à 30 clients. Aucune carte bancaire."
      footer={
        <>
          Déjà un compte ?{" "}
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          name="shopName"
          label="Nom de votre commerce"
          placeholder="Ex : Café des Halles"
          required
        />
        <Input
          name="ownerName"
          label="Votre nom"
          placeholder="Ex : Sophie Marchand"
          required
        />
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="vous@exemple.fr"
          required
        />
        <Button type="submit" full size="lg" disabled={loading}>
          {loading ? "Création..." : "Créer mon compte"}
          {!loading && <ArrowRight className="h-5 w-5" />}
        </Button>
        <p className="text-center text-xs text-slate-400">
          En continuant, vous acceptez nos conditions d'utilisation.
        </p>
      </form>
    </AuthShell>
  );
}
