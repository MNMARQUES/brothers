import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, ClipboardList, History, User, ShieldCheck, CloudUpload, Loader2, Users } from "lucide-react";
import { getCurrentMembroEquipe, type NivelPrivilegio } from "@/lib/brothers/equipe";
import { listPendingConfirmacoes, flushPendingConfirmacoes } from "@/lib/brothers/offline-sync";

const TABS: { to: string; label: string; icon: any }[] = [
  { to: "/tecnico", label: "Agenda", icon: CalendarDays },
  { to: "/tecnico/atendimentos", label: "Atendimentos", icon: ClipboardList },
  { to: "/tecnico/historico", label: "Histórico", icon: History },
  { to: "/lista-clientes", label: "Clientes", icon: Users },
  { to: "/tecnico/perfil", label: "Perfil", icon: User },
];

export function TecnicoShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideNav = pathname.startsWith("/tecnico/atendimento/");

  const [nivel, setNivel] = useState<NivelPrivilegio | null>(null);
  const [pendentes, setPendentes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  useEffect(() => {
    getCurrentMembroEquipe()
      .then((membro) => setNivel(membro?.nivelPrivilegio ?? null))
      .catch((err) => console.error("Erro ao verificar nível de privilégio:", err));
  }, []);

  useEffect(() => {
    setPendentes(listPendingConfirmacoes().length);

    async function tentarSincronizar() {
      if (listPendingConfirmacoes().length === 0) return;
      setSincronizando(true);
      await flushPendingConfirmacoes();
      setPendentes(listPendingConfirmacoes().length);
      setSincronizando(false);
    }

    tentarSincronizar();
    window.addEventListener("online", tentarSincronizar);
    return () => window.removeEventListener("online", tentarSincronizar);
  }, [pathname]);

  const handleSincronizarAgora = async () => {
    setSincronizando(true);
    await flushPendingConfirmacoes();
    setPendentes(listPendingConfirmacoes().length);
    setSincronizando(false);
  };

  // Supervisor/Administrador enxergam um tema visual diferente (violeta) do
  // técnico de campo (âmbar), pra ficar claro em qual modo estão.
  const isGestao = nivel === "Supervisor" || nivel === "Administrador";
  const bgClass = isGestao ? "bg-violet-50" : "bg-amber-50";
  const activeTextClass = isGestao ? "text-violet-600" : "text-primary";

  const activeTab = [...TABS].sort((a, b) => b.to.length - a.to.length).find((t) => pathname.startsWith(t.to));

  return (
    <div className={`min-h-screen ${bgClass} ${hideNav ? "" : "pb-24"}`}>
      {isGestao && (
        <div className="mx-auto flex w-full max-w-xl items-center gap-2 px-5 pt-5 sm:max-w-2xl sm:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" /> Modo {nivel}
          </span>
        </div>
      )}

      {pendentes > 0 && (
        <div className="mx-auto mt-5 flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 sm:max-w-2xl sm:px-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-warning">
            <CloudUpload className="h-4 w-4 shrink-0" />
            {pendentes} confirmação{pendentes > 1 ? "ões" : ""} com assinatura pendente{pendentes > 1 ? "s" : ""} de sincronizar
          </div>
          <button
            onClick={handleSincronizarAgora}
            disabled={sincronizando}
            className="shrink-0 rounded-lg bg-warning px-3 py-1.5 text-xs font-bold text-warning-foreground transition hover:bg-warning/90 disabled:opacity-60"
          >
            {sincronizando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Sincronizar agora"}
          </button>
        </div>
      )}

      <div className="mx-auto w-full max-w-xl px-5 pt-6 sm:max-w-2xl sm:px-8">{children}</div>

      {!hideNav && (
        <nav className={`fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur ${isGestao ? "border-violet-200" : "border-border"}`}>
          <div className="mx-auto flex max-w-xl items-stretch justify-between px-2 py-2 sm:max-w-2xl">
            {TABS.map((t) => {
              const active = activeTab?.to === t.to;
              return (
                <Link
                  key={t.to}
                  to={t.to as any}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition ${
                    active ? activeTextClass : "text-muted-foreground"
                  }`}
                >
                  <t.icon className={`h-5 w-5 ${active ? "stroke-[2.4]" : ""}`} />
                  {t.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
