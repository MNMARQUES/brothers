import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { CalendarClock, Clock, CheckCircle2, PackageSearch, Loader2, UserCheck, UserX, ClipboardCheck, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchAtendimentosTecnico,
  getCurrentTecnico,
  fetchTecnicosAtivos,
  atribuirTecnico,
  type AtendimentoTecnico,
  type TecnicoAtivo,
} from "@/lib/brothers/tecnico-data";
import { getCurrentMembroEquipe, type NivelPrivilegio } from "@/lib/brothers/equipe";
import { fetchEquipamentosPendentes } from "@/lib/brothers/clientes-data";

const STATUS_ICON: Record<string, any> = {
  Agendado: CalendarClock,
  "Em atendimento": Clock,
  Resolvido: CheckCircle2,
  "Aguardando peça": PackageSearch,
};

const STATUS_ICON_TINT: Record<string, string> = {
  Agendado: "",
  "Em atendimento": "bg-primary/10 text-primary",
  Resolvido: "bg-success/10 text-success",
  "Aguardando peça": "bg-warning/10 text-warning",
};

const STATUS_BADGE: Record<string, string> = {
  Agendado: "bg-slate-200 text-slate-600",
  "Em atendimento": "bg-primary/10 text-primary",
  Resolvido: "bg-success/10 text-success",
  "Aguardando peça": "bg-warning/10 text-warning",
};

export const Route = createFileRoute("/tecnico/")({
  head: () => ({ meta: [{ title: "Dashboard Técnico — Brothers" }] }),
  component: DashboardTecnico,
});

function DashboardTecnico() {
  const [atendimentos, setAtendimentos] = useState<AtendimentoTecnico[]>([]);
  const [tecnicosAtivos, setTecnicosAtivos] = useState<TecnicoAtivo[]>([]);
  const [nivel, setNivel] = useState<NivelPrivilegio | null>(null);
  const [nomeTecnico, setNomeTecnico] = useState("Técnico");
  const [equipamentosPendentes, setEquipamentosPendentes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [lista, tecnico, membro, tecnicosList, pendentes] = await Promise.all([
          fetchAtendimentosTecnico(),
          getCurrentTecnico(),
          getCurrentMembroEquipe(),
          fetchTecnicosAtivos(),
          fetchEquipamentosPendentes(),
        ]);
        setAtendimentos(lista);
        if (tecnico) setNomeTecnico(tecnico.nome.split(" ")[0]);
        setNivel(membro?.nivelPrivilegio ?? null);
        setTecnicosAtivos(tecnicosList);
        setEquipamentosPendentes(pendentes.length);
      } catch (err: any) {
        console.error("Erro ao carregar atendimentos do técnico:", err);
        setErro(err.message || "Não foi possível carregar os atendimentos.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const isGestao = nivel === "Supervisor" || nivel === "Administrador";

  const handleAtribuir = async (osId: string, tecnicoId: string) => {
    const novoTecnicoId = tecnicoId || null;
    const tecnico = tecnicosAtivos.find((t) => t.id === novoTecnicoId);
    try {
      await atribuirTecnico(osId, novoTecnicoId);
      setAtendimentos((prev) =>
        prev.map((a) => (a.id === osId ? { ...a, tecnicoId: novoTecnicoId, tecnicoNome: tecnico?.nome || null } : a))
      );
    } catch (err) {
      console.error("Erro ao atribuir técnico:", err);
    }
  };

  const manha = atendimentos.filter((a) => a.periodo === "Manhã" && a.status !== "Resolvido" && a.status !== "Cancelado");
  const tarde = atendimentos.filter((a) => a.periodo === "Tarde" && a.status !== "Resolvido" && a.status !== "Cancelado");
  const porStatus = (s: string) => atendimentos.filter((a) => a.status === s).length;

  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando atendimentos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Bom dia, {nomeTecnico}! 👋</h1>
        <p className="mt-1 text-sm capitalize text-muted-foreground">{hoje}</p>
      </div>

      <div className={`relative flex items-center justify-between overflow-hidden rounded-3xl p-5 text-white shadow-[0_20px_50px_-20px_rgba(37,99,235,0.5)] ${isGestao ? "bg-violet-700" : "bg-[#020D24]"}`}>
        <div className="relative z-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/70">{manha.length + tarde.length} atendimento{manha.length + tarde.length !== 1 ? "s" : ""} hoje</div>
          <div className="mt-1 text-xl font-black">
            {isGestao ? "Acompanhe a equipe" : "Bora pro trabalho!"}
          </div>
        </div>
        <img src="/ar_condicionado.png" alt="" className="relative z-10 h-16 w-16 shrink-0 object-contain drop-shadow-lg" />
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Link
        to="/lista-clientes/pendentes"
        className={`flex items-center gap-4 rounded-2xl border-2 p-4 transition ${
          equipamentosPendentes > 0 ? "border-warning/50 bg-warning/[0.06] hover:border-warning" : "border-border bg-card hover:border-primary/40"
        }`}
      >
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${equipamentosPendentes > 0 ? "bg-warning/15 text-warning" : "bg-success/10 text-success"}`}>
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold">Cadastro de Equipamento</div>
          <div className="text-xs text-muted-foreground">
            {equipamentosPendentes > 0
              ? "Aguardando confirmação presencial da equipe"
              : "Tudo confirmado"}
          </div>
        </div>
        <span className={`shrink-0 text-2xl font-black ${equipamentosPendentes > 0 ? "text-warning" : "text-success"}`}>{equipamentosPendentes}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status dos atendimentos</div>
        <div className="grid grid-cols-2 gap-3">
          <StatusStatCard status="Agendado" value={porStatus("Agendado")} />
          <StatusStatCard status="Em atendimento" value={porStatus("Em atendimento")} />
          <StatusStatCard status="Resolvido" value={porStatus("Resolvido")} />
          <StatusStatCard status="Aguardando peça" value={porStatus("Aguardando peça")} />
        </div>
      </div>

      <div className="space-y-5">
        <PeriodoSection titulo="Manhã" itens={manha} tint="amber" isGestao={isGestao} tecnicos={tecnicosAtivos} onAtribuir={handleAtribuir} />
        <PeriodoSection titulo="Tarde" itens={tarde} tint="indigo" isGestao={isGestao} tecnicos={tecnicosAtivos} onAtribuir={handleAtribuir} />
        {atendimentos.length === 0 && !erro && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Nenhum atendimento cadastrado ainda.
          </div>
        )}
      </div>
    </div>
  );
}

const PERIODO_TINTS = {
  amber: { dot: "bg-amber-500", title: "text-amber-600", icon: "bg-amber-100 text-amber-600", badge: "bg-amber-100 text-amber-700" },
  indigo: { dot: "bg-indigo-500", title: "text-indigo-600", icon: "bg-indigo-100 text-indigo-600", badge: "bg-indigo-100 text-indigo-700" },
} as const;

function PeriodoSection({
  titulo,
  itens,
  tint,
  isGestao,
  tecnicos,
  onAtribuir,
}: {
  titulo: string;
  itens: AtendimentoTecnico[];
  tint: keyof typeof PERIODO_TINTS;
  isGestao: boolean;
  tecnicos: TecnicoAtivo[];
  onAtribuir: (osId: string, tecnicoId: string) => void;
}) {
  const navigate = useNavigate();
  if (itens.length === 0) return null;
  const c = PERIODO_TINTS[tint];
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${c.title}`}>
          <span className={`h-2 w-2 rounded-full ${c.dot}`} /> {titulo}
        </h2>
        <span className="text-xs text-muted-foreground">{itens.length} atendimento{itens.length > 1 ? "s" : ""}</span>
      </div>
      <div className="space-y-3">
        {itens.map((a) => {
          const StatusIcon = STATUS_ICON[a.status] || CalendarClock;
          const semTecnico = !a.tecnicoNome;
          return (
          <div
            key={a.id}
            role="link"
            tabIndex={0}
            onClick={() => navigate({ to: "/tecnico/atendimento/$id", params: { id: a.id } })}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate({ to: "/tecnico/atendimento/$id", params: { id: a.id } });
            }}
            className={`flex cursor-pointer flex-col gap-3 rounded-2xl border-2 p-4 transition ${
              semTecnico ? "border-warning/50 bg-warning/[0.06] hover:border-warning" : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${STATUS_ICON_TINT[a.status] || c.icon}`}>
                <StatusIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-primary">OS #{a.numeroOs}</span>
                  <span className="font-bold">{a.cliente}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">{a.tipo}</span>
                </div>
                <div className="truncate text-sm text-muted-foreground">{a.endereco}</div>
                <div className="text-[11px] text-muted-foreground">Aberta em {a.dataAbertura}</div>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_BADGE[a.status] || "bg-muted text-foreground"}`}>{a.status}</span>
            </div>

            {isGestao ? (
              <div
                className={`flex items-center gap-2 rounded-xl px-3 py-2 ${semTecnico ? "bg-warning/15" : "bg-success/10"}`}
                onClick={(e) => e.stopPropagation()}
              >
                {semTecnico ? <UserX className="h-4 w-4 shrink-0 text-warning" /> : <UserCheck className="h-4 w-4 shrink-0 text-success" />}
                <select
                  value={a.tecnicoId || ""}
                  onChange={(e) => onAtribuir(a.id, e.target.value)}
                  className={`h-8 flex-1 rounded-lg border-0 bg-transparent px-1 text-sm font-bold outline-none ${
                    semTecnico ? "text-warning" : "text-success"
                  }`}
                >
                  <option value="">Sem técnico atribuído</option>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${semTecnico ? "bg-warning/15" : "bg-success/10"}`}>
                {semTecnico ? <UserX className="h-4 w-4 shrink-0 text-warning" /> : <UserCheck className="h-4 w-4 shrink-0 text-success" />}
                <span className={`text-sm font-bold ${semTecnico ? "text-warning" : "text-success"}`}>
                  {semTecnico ? "Sem técnico atribuído" : a.tecnicoNome}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-2.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
                <img src={a.equipamento.fotoUrl || "/ar_condicionado.png"} alt="Equipamento" className="h-8 w-8 object-contain" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{a.equipamento.marca} {a.equipamento.modelo}</div>
                <div className="text-xs text-muted-foreground">
                  {a.equipamento.btus ? `${a.equipamento.btus.toLocaleString()} BTUs - ` : ""}{a.equipamento.ambiente}
                </div>
                {a.equipamento.codigo != null && (
                  <div className="text-[11px] text-muted-foreground">Código {String(a.equipamento.codigo).padStart(6, "0")}</div>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusStatCard({ status, value }: { status: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_BADGE[status]}`}>{status}</span>
      <span className="text-2xl font-black">{value}</span>
    </div>
  );
}
