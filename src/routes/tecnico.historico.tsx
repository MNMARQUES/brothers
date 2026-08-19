import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Clock, CheckCircle2, PackageSearch, XCircle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchAtendimentosTecnico, type AtendimentoTecnico } from "@/lib/brothers/tecnico-data";
import { inputCls } from "@/components/brothers/AuthCard";

export const Route = createFileRoute("/tecnico/historico")({
  head: () => ({ meta: [{ title: "Histórico — Brothers" }] }),
  component: HistoricoTecnico,
});

const STATUS_OPCOES = ["Em atendimento", "Agendado", "Resolvido", "Aguardando peça", "Cancelado"];

const STATUS_ICON: Record<string, any> = {
  Agendado: CalendarClock,
  "Em atendimento": Clock,
  Resolvido: CheckCircle2,
  "Aguardando peça": PackageSearch,
  Cancelado: XCircle,
};

const STATUS_TINT: Record<string, string> = {
  Agendado: "bg-slate-200 text-slate-600",
  "Em atendimento": "bg-primary/10 text-primary",
  Resolvido: "bg-success/10 text-success",
  "Aguardando peça": "bg-warning/10 text-warning",
  Cancelado: "bg-destructive/10 text-destructive",
};

function HistoricoTecnico() {
  const [atendimentos, setAtendimentos] = useState<AtendimentoTecnico[]>([]);
  const [status, setStatus] = useState("Em atendimento");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetchAtendimentosTecnico()
      .then(setAtendimentos)
      .catch((err) => {
        console.error("Erro ao carregar histórico:", err);
        setErro(err.message || "Não foi possível carregar o histórico.");
      })
      .finally(() => setLoading(false));
  }, []);

  const historico = useMemo(
    () => (status === "Todos" ? atendimentos : atendimentos.filter((a) => a.status === status)),
    [atendimentos, status]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Histórico</h1>
        <p className="mt-1 text-sm text-muted-foreground">{historico.length} atendimento{historico.length !== 1 ? "s" : ""}</p>
      </div>

      <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="Todos">Todos os status</option>
        {STATUS_OPCOES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando histórico...</p>
        </div>
      ) : erro ? (
        <p className="text-sm text-destructive">{erro}</p>
      ) : (
        <div className="space-y-3">
          {historico.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Nenhum atendimento encontrado para esse filtro.
            </div>
          )}
          {historico.map((h) => {
            const StatusIcon = STATUS_ICON[h.status] || Clock;
            return (
              <div key={h.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${STATUS_TINT[h.status] || "bg-muted text-foreground"}`}>
                  <StatusIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-bold">OS #{h.numeroOs}</div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_TINT[h.status] || "bg-muted text-foreground"}`}>{h.status}</span>
                  </div>
                  <div className="truncate text-sm text-muted-foreground">{h.cliente} - {h.equipamento.ambiente}</div>
                  <div className="text-[11px] text-muted-foreground">Aberta em {h.dataAbertura}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
