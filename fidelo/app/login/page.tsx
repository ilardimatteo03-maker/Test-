"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, PlayCircle } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { Button, Input } from "@/components/ui";
import { login, loginDemo } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const m = login(email);
    if (!m) {
      setError("Aucun compte trouvé avec cet email. Essayez la démo ci-dessous.");
      return;
    }
    router.push(m.onboarded ? "/dashboard" : "/onboarding");
  }

  function onDemo() {
    loginDemo();
    router.push("/dashboard");
  }

  return (
    <AuthShell
      title="Bon retour 👋"
      subtitle="Connectez-vous pour gérer vos clients fidèles."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-semibold text-brand-700 hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="vous@exemple.fr"
          required
        />
        <Input
          name="password"
          type="password"
          label="Mot de passe"
          placeholder="••••••••"
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <Button type="submit" full size="lg">
          Se connecter
          <ArrowRight className="h-5 w-5" />
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        OU
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <Button variant="secondary" full size="lg" onClick={onDemo}>
        <PlayCircle className="h-5 w-5 text-brand-600" />
        Découvrir avec le compte démo
      </Button>
    </AuthShell>
  );
}
