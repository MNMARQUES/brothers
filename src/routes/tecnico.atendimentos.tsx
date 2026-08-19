import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, CalendarClock, Clock, CheckCircle2, PackageSearch, SlidersHorizontal, Loader2, UserCheck, UserX } from "lucide-react";
import { inputCls } from "@/components/brothers/AuthCard";
import { fetchAtendimentosTecnico, type AtendimentoTecnico } from "@/lib/brothers/tecnico-data";

export const Route = createFileRoute("/tecnico/atendimentos")({
  head: () => ({ meta: [{ title: "Atendimentos — Brothers" }] }),
  component: AtendimentosTecnico,
});

// Esta busca é para o trabalho do dia a dia: só o que está agendado ou em
// andamento. Resolvidos ficam no Histórico; cancelados não interessam aqui.
const STATUS_VISIVEIS = ["Agendado", "Em atendimento"];

const STATUS_ICON: Record<string, any> = {
  Agendado: CalendarClock,
  "Em atendimento": Clock,
  Resolvido: CheckCircle2,
  "Aguardando peça": PackageSearch,
};

const STATUS_TINT: Record<string, string> = {
  Agendado: "bg-slate-200 text-slate-600",
  "Em atendimento": "bg-primary/10 text-primary",
  Resolvido: "bg-success/10 text-success",
  "Aguardando peça": "bg-warning/10 text-warning",
};

function AtendimentosTecnico() {
  const [nome, setNome] = useState("");
  const [status, setStatus] = useState("Todos");
  const [bairro, setBairro] = useState("Todos");
  const [atendimentos, setAtendimentos] = useState<AtendimentoTecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetchAtendimentosTecnico()
      .then((lista) => setAtendimentos(lista.filter((a) => STATUS_VISIVEIS.includes(a.status))))
      .catch((err) => {
        console.error("Erro ao carregar atendimentos:", err);
        setErro(err.message || "Não foi possível carregar os atendimentos.");
      })
      .finally(() => setLoading(false));
  }, []);

  const bairros = useMemo(
    () => Array.from(new Set(atendimentos.map((a) => a.bairro).filter(Boolean))).sort(),
    [atendimentos]
  );

  const lista = atendimentos.filter((a) => {
    if (nome && !a.cliente.toLowerCase().includes(nome.toLowerCase())) return false;
    if (status !== "Todos" && a.status !== status) return false;
    if (bairro !== "Todos" && a.bairro !== bairro) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Atendimentos</h1>
        <p className="mt-1 text-sm text-muted-foreground">{atendimentos.length} no total</p>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={inputCls + " pl-10"}
            placeholder="Buscar por nome do cliente"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Todos">Todos os status</option>
            {STATUS_VISIVEIS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select className={inputCls} value={bairro} onChange={(e) => setBairro(e.target.value)}>
            <option value="Todos">Todos os bairros</option>
            {bairros.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando atendimentos...</p>
        </div>
      ) : erro ? (
        <p className="text-sm text-destructive">{erro}</p>
      ) : (
        <div className="space-y-3">
          {lista.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Nenhum atendimento encontrado para esse filtro.
            </div>
          )}
          {lista.map((a) => {
            const StatusIcon = STATUS_ICON[a.status] || CalendarClock;
            const semTecnico = !a.tecnicoNome;
            return (
              <Link
                key={a.id}
                to="/tecnico/atendimento/$id"
                params={{ id: a.id }}
                className={`flex flex-col gap-3 rounded-2xl border-2 p-4 transition ${
                  semTecnico ? "border-warning/50 bg-warning/[0.06] hover:border-warning" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${STATUS_TINT[a.status] || "bg-muted text-foreground"}`}>
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold"><span className="text-primary">OS #{a.numeroOs}</span> {a.cliente}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">{a.tipo}</span>
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
                      {a.equipamento.ambiente}
                      {a.equipamento.codigo != null && ` · Código ${String(a.equipamento.codigo).padStart(6, "0")}`}
                    </div>
                    <div className="text-[11px] text-muted-foreground">Aberta em {a.dataAbertura}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_TINT[a.status] || "bg-muted text-foreground"}`}>{a.status}</span>
                </div>
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${semTecnico ? "bg-warning/15" : "bg-success/10"}`}>
                  {semTecnico ? <UserX className="h-4 w-4 shrink-0 text-warning" /> : <UserCheck className="h-4 w-4 shrink-0 text-success" />}
                  <span className={`text-sm font-bold ${semTecnico ? "text-warning" : "text-success"}`}>
                    {semTecnico ? "Sem técnico atribuído" : a.tecnicoNome}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
