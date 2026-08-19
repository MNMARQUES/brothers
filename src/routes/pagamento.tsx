import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CreditCard, ChevronRight, FileText, ShieldCheck, Zap } from "lucide-react";
import { Logo } from "@/components/brothers/Logo";
import { primaryBtn } from "@/components/brothers/AuthCard";

export const Route = createFileRoute("/pagamento")({
  head: () => ({ meta: [{ title: "Pagamento — Brothers" }] }),
  component: PagamentoPage,
});

const PixIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <img src="/pix.jpg" alt="Pix" className={`${className} rounded-md object-cover`} />
);

function PagamentoPage() {
  const [method, setMethod] = useState<"pix" | "card" | "boleto">("pix");
  const navigate = useNavigate();

  const methods = [
    { id: "pix" as const, label: "PIX", desc: "Aprovação imediata", icon: PixIcon, activeBg: "bg-[#32BCAD] text-white", normalBg: "bg-emerald-50 text-[#32BCAD]" },
    { id: "card" as const, label: "Cartão de crédito", desc: "Em até 12x", icon: CreditCard, activeBg: "bg-primary text-primary-foreground", normalBg: "bg-muted text-foreground" },
    { id: "boleto" as const, label: "Boleto bancário", desc: "Aprovação em até 1 dia útil", icon: FileText, activeBg: "bg-primary text-primary-foreground", normalBg: "bg-muted text-foreground" },
  ];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md px-5 pb-10 pt-6 sm:max-w-lg sm:px-8">
        <header className="flex items-center justify-between">
          <Link to="/cadastro" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Logo size="sm" />
        </header>

        <h1 className="mt-8 text-3xl font-black tracking-tight">Finalizar assinatura</h1>
        <p className="mt-2 text-sm text-muted-foreground">Escolha a forma de pagamento</p>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Plano Ouro</div>
              <div className="mt-1 text-sm">Cobrança mensal</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black">R$ 89,90</div>
              <div className="text-xs text-muted-foreground">/mês</div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {methods.map((m) => {
            const active = method === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                  active 
                    ? m.id === "pix" 
                      ? "border-[#32BCAD] bg-[#32BCAD]/[0.03]" 
                      : "border-primary bg-primary/[0.04]" 
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className={`grid h-12 w-12 place-items-center rounded-xl ${active ? m.activeBg : m.normalBg}`}>
                  <m.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.desc}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        <button className={primaryBtn + " mt-8"} onClick={() => navigate({ to: "/app" })}>
          Confirmar pagamento
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Ambiente 100% seguro
        </div>
      </div>
    </main>
  );
}