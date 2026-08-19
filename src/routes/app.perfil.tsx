import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, CreditCard, Bell, HelpCircle, LogOut, Shield, User as UserIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentCliente, signOut, type ClienteAtual } from "@/lib/brothers/auth";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Brothers" }] }),
  component: PerfilPage,
});

const PLANO_LABEL: Record<string, string> = {
  bronze: "Plano Bronze",
  prata: "Plano Prata",
  ouro: "Plano Ouro",
  diamante: "Plano Diamante",
  empresarial: "Plano Empresarial",
};

function PerfilPage() {
  const [cliente, setCliente] = useState<ClienteAtual | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentCliente()
      .then(setCliente)
      .catch((err) => console.error("Erro ao carregar perfil:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const items = [
    { icon: UserIcon, label: "Dados pessoais" },
    { icon: CreditCard, label: "Pagamentos e plano" },
    { icon: Bell, label: "Notificações" },
    { icon: Shield, label: "Privacidade e segurança" },
    { icon: HelpCircle, label: "Ajuda e suporte" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black tracking-tight">Perfil</h1>

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
            {(cliente?.nome || "?").substring(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-bold">{cliente?.nome || "Usuário"}</div>
            <div className="truncate text-sm text-muted-foreground">{cliente?.email}</div>
            {cliente?.plano && (
              <span className="mt-1 inline-flex rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
                {PLANO_LABEL[cliente.plano] || cliente.plano}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map((it) => (
          <button key={it.label} className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/40">
            <it.icon className="h-5 w-5 text-primary" />
            <span className="flex-1 font-medium">{it.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4 font-semibold text-destructive transition hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" /> Sair
      </button>
    </div>
  );
}
