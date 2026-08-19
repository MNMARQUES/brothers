import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Phone, MessageCircle, MapPin, Check, Loader2, Edit3, Trash2, X, Save, AlertCircle, ShieldCheck, PenLine } from "lucide-react";
import { useState, useEffect } from "react";
import { TIMELINE as MOCK_TIMELINE } from "@/lib/brothers/mock-data";
import { supabase } from "@/lib/supabase";
import { inputCls, primaryBtn } from "@/components/brothers/AuthCard";

export const Route = createFileRoute("/app/chamados/$id")({
  head: () => ({ meta: [{ title: "Acompanhamento — Brothers" }] }),
  component: AcompanhamentoPage,
});

interface ChamadoDetalhe {
  id: string;
  numero_os?: number;
  status: string;
  descricao_problema: string;
  created_at: string;
  equipamentoNome: string;
  equipamentoCodigo: number | null;
  tecnico?: {
    nome: string;
    telefone: string;
  } | null;
  confirmadoCliente: boolean;
  confirmadoEm: string | null;
  confirmadoPor: "cliente" | "assinatura_tecnico" | null;
}

function AcompanhamentoPage() {
  const { id } = Route.useParams();
  const [chamado, setChamado] = useState<ChamadoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [updating, setUpdating] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    // Se for o ID de teste mockado, não tenta buscar como UUID
    if (id === "1254" || id.length < 10) {
      setLoading(false);
      return;
    }

    async function loadChamadoDetalhe() {
      try {
        const { data, error } = await supabase
          .from("ordens_servico")
          .select(`
            id,
            numero_os,
            status,
            descricao_problema,
            created_at,
            confirmado_cliente,
            confirmado_em,
            confirmado_por,
            tecnicos (
              nome,
              telefone
            ),
            equipamentos (
              nome,
              marca,
              codigo
            )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          const equipName = data.equipamentos
            ? `${(data.equipamentos as any).nome} ${(data.equipamentos as any).marca ? `(${(data.equipamentos as any).marca})` : ""}`
            : "Equipamento";

          setChamado({
            id: data.id,
            numero_os: data.numero_os,
            status: data.status,
            descricao_problema: data.descricao_problema,
            created_at: data.created_at,
            equipamentoNome: equipName,
            equipamentoCodigo: (data.equipamentos as any)?.codigo ?? null,
            tecnico: data.tecnicos as any,
            confirmadoCliente: data.confirmado_cliente,
            confirmadoEm: data.confirmado_em,
            confirmadoPor: data.confirmado_por,
          });
          setEditDescription(data.descricao_problema);
        }
      } catch (err) {
        console.error("Erro ao carregar detalhes do chamado:", err);
      } finally {
        setLoading(false);
      }
    }

    loadChamadoDetalhe();
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm("Deseja realmente cancelar esta ordem de serviço?")) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("ordens_servico")
        .update({ status: "Cancelado" })
        .eq("id", id);

      if (error) throw error;

      setChamado((prev) => (prev ? { ...prev, status: "Cancelado" } : null));
    } catch (err) {
      console.error("Erro ao cancelar chamado:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmar = async () => {
    setConfirmando(true);
    try {
      const agora = new Date().toISOString();
      const { error } = await supabase
        .from("ordens_servico")
        .update({ confirmado_cliente: true, confirmado_em: agora, confirmado_por: "cliente" })
        .eq("id", id);

      if (error) throw error;

      setChamado((prev) => (prev ? { ...prev, confirmadoCliente: true, confirmadoEm: agora, confirmadoPor: "cliente" } : null));
    } catch (err) {
      console.error("Erro ao confirmar atendimento:", err);
    } finally {
      setConfirmando(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editDescription.trim()) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("ordens_servico")
        .update({ descricao_problema: editDescription })
        .eq("id", id);

      if (error) throw error;

      setChamado((prev) => (prev ? { ...prev, descricao_problema: editDescription } : null));
      setIsEditing(false);
    } catch (err) {
      console.error("Erro ao editar chamado:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando detalhes do chamado...</p>
      </div>
    );
  }

  // Gera a linha do tempo dinâmica caso seja um chamado do banco
  let timeline = MOCK_TIMELINE;
  let statusDisplay = "Em atendimento";
  let tecnicoNome: string | null = null;
  let tecnicoTelefone: string | null = null;

  if (chamado) {
    statusDisplay = chamado.status;
    const isEmAndamento = chamado.status === "Em Andamento" || chamado.status === "Em atendimento";
    const isConcluido = chamado.status === "Concluído" || chamado.status === "Finalizado";
    const isCancelado = chamado.status === "Cancelado";

    const formattedDate = new Date(chamado.created_at).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isCancelado) {
      timeline = [
        { label: "Solicitação aberta", date: formattedDate, done: true },
        { label: "Cancelado", date: formattedDate, done: true, active: true },
      ];
    } else {
      timeline = [
        { label: "Solicitação aberta", date: formattedDate, done: true },
        { label: "Técnico designado", date: chamado.tecnico ? formattedDate : "—", done: !!chamado.tecnico },
        { label: "Em deslocamento", date: "—", done: false },
        { label: "Em atendimento", date: "—", done: isEmAndamento || isConcluido, active: isEmAndamento },
        { label: "Aguardando peça", date: "—", done: false },
        { label: "Finalizado", date: "—", done: isConcluido },
      ];
    }

    if (chamado.tecnico) {
      tecnicoNome = chamado.tecnico.nome;
      tecnicoTelefone = chamado.tecnico.telefone || null;
    }
  }

  const shortId = chamado?.numero_os ? String(chamado.numero_os) : id.substring(0, 8);
  const isAberto = chamado ? chamado.status === "Aberto" : true;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <Link to="/app/chamados" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="text-right">
          <div className="text-sm font-semibold">OS #{shortId}</div>
          <div className="text-xs text-muted-foreground">{statusDisplay}</div>
        </div>
      </header>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Acompanhe o status</h1>
          <p className="mt-1 text-sm text-muted-foreground">Você receberá notificações em cada etapa</p>
        </div>
        {isAberto && chamado && !isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-primary transition"
              title="Editar OS"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={updating}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-destructive transition"
              title="Cancelar OS"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <ol className="relative space-y-5 pl-8">
        <span className="absolute left-3 top-2 h-[calc(100%-1rem)] w-px bg-border" />
        {timeline.map((t, i) => (
          <li key={i} className="relative">
            <span
              className={`absolute -left-8 top-0.5 grid h-6 w-6 place-items-center rounded-full ring-4 ring-background ${
                t.done ? ((t as any).active ? "bg-primary text-primary-foreground" : "bg-success text-success-foreground") : "bg-muted text-muted-foreground"
              }`}
            >
              {t.done && <Check className="h-3.5 w-3.5" />}
            </span>
            <div className={`text-sm font-semibold ${t.done ? "text-foreground" : "text-muted-foreground"}`}>{t.label}</div>
            <div className="text-xs text-muted-foreground">{t.date}</div>
          </li>
        ))}
      </ol>

      {chamado && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Detalhes da solicitação</div>
            {isEditing && (
              <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-[10px] font-semibold text-warning">Editando</span>
            )}
          </div>
          <div className="text-sm font-bold">{chamado.equipamentoNome}</div>
          {chamado.equipamentoCodigo != null && (
            <div className="text-xs text-muted-foreground">Código {String(chamado.equipamentoCodigo).padStart(6, "0")}</div>
          )}

          {isEditing ? (
            <div className="space-y-3 pt-1">
              <textarea
                className={inputCls + " h-24 py-2 text-sm"}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={updating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 disabled:opacity-55"
                >
                  <Save className="h-3.5 w-3.5" /> Salvar
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditDescription(chamado.descricao_problema);
                  }}
                  disabled={updating}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/10"
                >
                  <X className="h-3.5 w-3.5" /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{chamado.descricao_problema}</div>
          )}
        </div>
      )}

      {chamado && (chamado.status === "Concluído" || chamado.status === "Finalizado" || chamado.status === "Aguardando peça") && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Confirmação do atendimento {chamado.status === "Aguardando peça" ? "parcial" : "final"}
          </div>
          {chamado.confirmadoCliente ? (
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-success/10 p-3 text-sm font-semibold text-success">
              {chamado.confirmadoPor === "assinatura_tecnico" ? (
                <PenLine className="h-5 w-5 shrink-0" />
              ) : (
                <ShieldCheck className="h-5 w-5 shrink-0" />
              )}
              <span>
                {chamado.confirmadoPor === "assinatura_tecnico"
                  ? "Confirmado com assinatura durante o atendimento"
                  : "Você confirmou este atendimento"}
                {chamado.confirmadoEm && (
                  <>
                    {" "}em{" "}
                    {new Date(chamado.confirmadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </>
                )}
              </span>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-muted-foreground">
                {chamado.status === "Aguardando peça"
                  ? "O técnico registrou um atendimento parcial (aguardando peça). Confirme se o que foi feito até aqui está de acordo."
                  : "O técnico marcou este atendimento como concluído. Confirme se o serviço foi realizado como descrito."}
              </p>
              <button
                onClick={handleConfirmar}
                disabled={confirmando}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-success text-sm font-semibold text-success-foreground transition hover:bg-success/90 disabled:opacity-60"
              >
                {confirmando ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Confirmando...
                  </span>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Confirmar atendimento
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Técnico designado</div>
        {tecnicoNome ? (
          <>
            <div className="mt-3 flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 font-bold text-primary">
                {tecnicoNome.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{tecnicoNome}</div>
                <div className="text-sm text-muted-foreground">{tecnicoTelefone || "Telefone não informado"}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-xs font-medium transition hover:border-primary/40">
                <Phone className="h-4 w-4 text-primary" /> Ligar
              </button>
              <button className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-xs font-medium transition hover:border-primary/40">
                <MessageCircle className="h-4 w-4 text-success" /> WhatsApp
              </button>
              <button className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-xs font-medium transition hover:border-primary/40">
                <MapPin className="h-4 w-4 text-warning" /> Mapa
              </button>
            </div>
          </>
        ) : (
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-warning/5 p-3 text-sm font-semibold text-warning">
            <AlertCircle className="h-5 w-5 shrink-0" />
            Ainda sem técnico atribuído — em breve alguém da equipe será designado.
          </div>
        )}
      </div>
    </div>
  );
}