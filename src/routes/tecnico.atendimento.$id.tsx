import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Phone, X, Loader2, AlertCircle, UserCheck, UserX } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAtendimentoTecnico, assumirAtendimento, atualizarAtendimentoTecnico, type AtendimentoTecnico } from "@/lib/brothers/tecnico-data";

export const Route = createFileRoute("/tecnico/atendimento/$id")({
  head: () => ({ meta: [{ title: "Atendimento Técnico — Brothers" }] }),
  component: AtendimentoTecnico,
});

function AtendimentoTecnico() {
  const { id } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [a, setA] = useState<AtendimentoTecnico | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [assumindo, setAssumindo] = useState(false);

  useEffect(() => {
    fetchAtendimentoTecnico(id)
      .then(setA)
      .catch((err) => {
        console.error("Erro ao carregar atendimento:", err);
        setErro(err.message || "Não foi possível carregar o atendimento.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAssumir = async () => {
    setAssumindo(true);
    try {
      await assumirAtendimento(id);
      const atualizado = await fetchAtendimentoTecnico(id);
      setA(atualizado);
    } catch (err) {
      console.error("Erro ao assumir atendimento:", err);
      setErro("Não foi possível assumir este atendimento. Tente novamente.");
    } finally {
      setAssumindo(false);
    }
  };

  if (pathname !== `/tecnico/atendimento/${id}`) return <Outlet />;

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando atendimento...</p>
      </div>
    );
  }

  if (!a) {
    return (
      <div className="space-y-5">
        <header>
          <Link to="/tecnico" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </header>
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">{erro || "Atendimento não encontrado"}</p>
        </div>
      </div>
    );
  }

  const handleCancelar = () => {
    if (window.confirm("Cancelar este atendimento e voltar para a lista?")) {
      navigate({ to: "/tecnico" });
    }
  };

  const handleIniciar = async () => {
    try {
      await atualizarAtendimentoTecnico(id, { statusLabel: "Em atendimento" });
    } catch (err) {
      console.error("Erro ao marcar atendimento como iniciado:", err);
    }
    navigate({ to: "/tecnico/atendimento/$id/checklist", params: { id } });
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <Link to="/tecnico" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="text-right">
          <h1 className="text-xl font-black tracking-tight">
            <span className="text-primary">OS #{a.numeroOs}</span> {a.cliente}
          </h1>
          <p className="text-sm text-muted-foreground">{a.tipo}</p>
        </div>
      </header>

      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{a.endereco}</span>
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      {a.tecnicoNome ? (
        <div className="flex items-center gap-2 rounded-2xl border border-success/20 bg-success/5 px-4 py-3 text-sm font-semibold text-success">
          <UserCheck className="h-4 w-4 shrink-0" /> Técnico responsável: {a.tecnicoNome}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm font-semibold text-warning">
          <span className="flex items-center gap-2">
            <UserX className="h-4 w-4 shrink-0" /> Sem técnico atribuído
          </span>
          <button
            onClick={handleAssumir}
            disabled={assumindo}
            className="shrink-0 rounded-lg bg-warning px-3 py-1.5 text-xs font-bold text-warning-foreground transition hover:bg-warning/90 disabled:opacity-60"
          >
            {assumindo ? "Assumindo..." : "Assumir atendimento"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(a.endereco)}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold transition hover:border-primary/40"
        >
          <MapPin className="h-4 w-4 text-primary" /> Ver no mapa
        </a>
        <a
          href={`tel:${a.telefone}`}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold transition hover:border-primary/40"
        >
          <Phone className="h-4 w-4 text-success" /> Ligar para cliente
        </a>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Problema relatado</div>
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">{a.problema}</p>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Equipamento</div>
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
            <img src={a.equipamento.fotoUrl || "/ar_condicionado.png"} alt="Equipamento" className="h-12 w-12 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold">{a.equipamento.marca} {a.equipamento.modelo}</div>
            <div className="text-sm text-muted-foreground">
              {a.equipamento.btus ? `${a.equipamento.btus.toLocaleString()} BTUs - ` : ""}{a.equipamento.ambiente}
            </div>
            {a.equipamento.codigo != null && (
              <div className="text-xs text-muted-foreground">Código {String(a.equipamento.codigo).padStart(6, "0")}</div>
            )}
          </div>
        </div>
      </div>

      {/* Se o atendimento já foi iniciado antes (parou em "Em atendimento" ou
          "Aguardando peça"), volta direto pro registro em vez de reiniciar
          o checklist do zero. */}
      {a.status === "Em atendimento" || a.status === "Aguardando peça" ? (
        <Link
          to="/tecnico/atendimento/$id/registro"
          params={{ id: a.id }}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Continuar atendimento
        </Link>
      ) : (
        <button
          onClick={handleIniciar}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Iniciar atendimento
        </button>
      )}

      <button
        onClick={handleCancelar}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
      >
        <X className="h-4 w-4" /> Cancelar e voltar
      </button>
    </div>
  );
}
