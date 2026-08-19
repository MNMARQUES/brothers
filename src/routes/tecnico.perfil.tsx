import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Bell, HelpCircle, LogOut, Shield, User as UserIcon, UserPlus, UserCog, CalendarCheck2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentTecnico, type TecnicoAtual } from "@/lib/brothers/tecnico-data";
import { getCurrentMembroEquipe, type NivelPrivilegio } from "@/lib/brothers/equipe";

export const Route = createFileRoute("/tecnico/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Brothers" }] }),
  component: PerfilTecnico,
});

function PerfilTecnico() {
  const [tecnico, setTecnico] = useState<TecnicoAtual | null>(null);
  const [nivel, setNivel] = useState<NivelPrivilegio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCurrentTecnico(), getCurrentMembroEquipe()])
      .then(([tec, membro]) => {
        setTecnico(tec);
        setNivel(membro?.nivelPrivilegio ?? null);
      })
      .catch((err) => console.error("Erro ao carregar técnico:", err))
      .finally(() => setLoading(false));
  }, []);

  const items = [
    { icon: UserIcon, label: "Dados pessoais" },
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
            {(tecnico?.nome || "?")[0]}
          </div>
          <div className="min-w-0">
            <div className="font-bold">{tecnico?.nome || "Técnico"}</div>
            <div className="truncate text-sm text-muted-foreground">
              {nivel === "Supervisor" || nivel === "Administrador" ? nivel : "Técnico de campo"}
            </div>
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

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Administração</div>
        <Link to="/lista-tecnicos" className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/40">
          <UserCog className="h-5 w-5 text-primary" />
          <span className="flex-1 font-medium">Técnicos</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link to="/lista-clientes" className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/40">
          <UserPlus className="h-5 w-5 text-primary" />
          <span className="flex-1 font-medium">Clientes</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link to="/atribuicao-tecnicos" className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/40">
          <CalendarCheck2 className="h-5 w-5 text-primary" />
          <span className="flex-1 font-medium">Atribuição de técnicos do dia</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      <Link to="/" className="flex items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4 font-semibold text-destructive transition hover:bg-destructive/10">
        <LogOut className="h-4 w-4" /> Sair
      </Link>
    </div>
  );
}
