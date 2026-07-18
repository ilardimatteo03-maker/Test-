// Mockup navigateur présentant le vrai produit (mini-dashboard) — crédibilité
// façon ASM. Purement visuel, construit en HTML/CSS avec les tokens de marque.
import { Gift, LayoutDashboard, ScanLine, Stamp, TrendingUp, Users } from "lucide-react";
import { Logo } from "@/components/Logo";

export function HeroMockup() {
  const nav = [
    { icon: LayoutDashboard, label: "Tableau de bord", active: true },
    { icon: ScanLine, label: "Scanner" },
    { icon: Users, label: "Clients" },
    { icon: Gift, label: "Carte & récompense" },
  ];
  const stats = [
    { icon: Users, v: "24", l: "Clients", c: "text-brand-600 bg-brand-50" },
    { icon: Stamp, v: "312", l: "Tampons", c: "text-emerald-600 bg-emerald-50" },
    { icon: Gift, v: "29", l: "Récompenses", c: "text-amber-600 bg-amber-50" },
    { icon: TrendingUp, v: "+38%", l: "Fidélité", c: "text-brand-600 bg-brand-50" },
  ];
  const rows = [
    { n: "Julien Petit", s: "9 / 10", i: "JP", c: "bg-brand-100 text-brand-700" },
    { n: "Amélie Roche", s: "6 / 10", i: "AR", c: "bg-emerald-100 text-emerald-700" },
    { n: "Karim Bensaïd", s: "8 / 10", i: "KB", c: "bg-amber-100 text-amber-700" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-float">
      {/* Chrome navigateur */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-slate-300" />
        <span className="h-3 w-3 rounded-full bg-slate-300" />
        <span className="h-3 w-3 rounded-full bg-slate-300" />
        <span className="mx-auto flex items-center gap-1.5 rounded-md bg-white px-3 py-1 text-[11px] text-slate-400 ring-1 ring-slate-200">
          app.fidelo.fr/dashboard
        </span>
      </div>

      <div className="flex text-left">
        {/* Sidebar */}
        <aside className="hidden w-48 shrink-0 border-r border-slate-100 p-3 sm:block">
          <div className="px-2 py-1">
            <Logo href={null} size="sm" />
          </div>
          <nav className="mt-4 space-y-1">
            {nav.map((n) => (
              <div
                key={n.label}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium ${
                  n.active ? "bg-brand-50 text-brand-700" : "text-slate-500"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </div>
            ))}
          </nav>
        </aside>

        {/* Contenu */}
        <div className="min-w-0 flex-1 bg-white p-4 sm:p-5">
          <p className="font-display text-lg font-extrabold text-ink">
            Bonjour, Sophie 👋
          </p>
          <p className="text-xs text-slate-400">Activité de votre programme</p>

          <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.l} className="rounded-xl border border-slate-100 p-3">
                <span className={`grid h-7 w-7 place-items-center rounded-lg ${s.c}`}>
                  <s.icon className="h-3.5 w-3.5" />
                </span>
                <p className="mt-2 font-display text-xl font-extrabold text-ink">{s.v}</p>
                <p className="text-[11px] text-slate-400">{s.l}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 p-3">
            <p className="text-xs font-bold text-ink">Ajouter un tampon</p>
            <div className="mt-2 divide-y divide-slate-50">
              {rows.map((r) => (
                <div key={r.n} className="flex items-center gap-2.5 py-2">
                  <span className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${r.c}`}>
                    {r.i}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-ink">{r.n}</p>
                    <p className="text-[10.5px] text-slate-400">{r.s} tampons</p>
                  </div>
                  <span className="rounded-full bg-brand-500 px-2.5 py-1 text-[10.5px] font-semibold text-white">
                    + Tampon
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
