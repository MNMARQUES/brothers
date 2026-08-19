import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Star } from "lucide-react";
import { PLANS } from "@/lib/brothers/mock-data";
import { Logo } from "@/components/brothers/Logo";

export const Route = createFileRoute("/planos")({
  head: () => ({ meta: [{ title: "Planos — Brothers" }] }),
  component: PlanosPage,
});

function PlanosPage() {
  const [annual, setAnnual] = useState(false);
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 pb-16 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Logo size="sm" />
        </header>
        <div className="mt-10 text-center">
          <h1 className="text-balance text-4xl font-black tracking-tight sm:text-5xl">Nossos Planos</h1>
          <p className="mt-3 text-muted-foreground">Escolha o plano ideal para você</p>
          <div className="mx-auto mt-6 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
            <button onClick={() => setAnnual(false)} className={`rounded-full px-4 py-2 text-sm font-semibold ${!annual ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Mensal</button>
            <button onClick={() => setAnnual(true)} className={`rounded-full px-4 py-2 text-sm font-semibold ${annual ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Anual (10% OFF)</button>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.filter(p => p.id !== "empresarial").map((p) => {
            const isOuro = p.id === "ouro";
            const price = annual ? p.price * 0.9 : p.price;
            return (
              <div
                key={p.id}
                className={`relative rounded-3xl p-6 transition ${
                  isOuro
                    ? "bg-primary text-primary-foreground shadow-[0_30px_60px_-20px_rgba(37,99,235,0.55)]"
                    : "border border-border bg-card text-foreground"
                }`}
              >
                {isOuro && <span className="absolute -top-3 left-6 rounded-full bg-warning px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-warning-foreground">Mais escolhido</span>}
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${isOuro ? "bg-white/15" : "bg-primary/10"}`}>
                  <Star className={`h-5 w-5 ${isOuro ? "text-white" : "text-primary"}`} fill="currentColor" />
                </div>
                <div className="mt-4 text-2xl font-black">{p.name}</div>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-black">R$ {price.toFixed(2).replace(".", ",")}</span>
                  <span className={`pb-1 text-sm ${isOuro ? "text-white/70" : "text-muted-foreground"}`}>/mês</span>
                </div>
                <ul className={`mt-6 space-y-3 text-sm ${isOuro ? "text-white/90" : "text-foreground"}`}>
                  <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" /> Até {p.equip} equipamentos</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" /> Atendimento em {p.sla}</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" /> {p.preventivas} preventiva{p.preventivas > 1 ? "s" : ""} anual</li>
                </ul>
                <Link
                  to="/pagamento"
                  className={`mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl font-semibold transition ${
                    isOuro ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  Assinar
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}