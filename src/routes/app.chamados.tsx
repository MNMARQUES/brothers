import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Plus, AlertCircle, CheckCircle2, Clock, Loader2, XCircle, Wrench } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { requireCurrentClienteId } from "@/lib/brothers/auth";

export const Route = createFileRoute("/app/chamados")({
  head: () => ({ meta: [{ title: "Chamados — Brothers" }] }),
  component: ChamadosLayout,
});

interface ChamadoItem {
  id: string;
  numeroOs: number | string;
  equip: string;
  equipCodigo: number | null;
  status: string;
  date: string;
  tecnicoNome: string | null;
}

const STATUS_STYLES: Record<string, { icon: typeof Clock; className: string }> = {
  "Aberto": { icon: Clock, className: "bg-warning/10 text-warning" },
  "Em Andamento": { icon: Wrench, className: "bg-primary/10 text-primary" },
  "Em atendimento": { icon: Wrench, className: "bg-primary/10 text-primary" },
  "Aguardando peça": { icon: AlertCircle, className: "bg-orange-500/10 text-orange-500" },
  "Concluído": { icon: CheckCircle2, className: "bg-success/10 text-success" },
  "Finalizado": { icon: CheckCircle2, className: "bg-success/10 text-success" },
  "Cancelado": { icon: XCircle, className: "bg-destructive/10 text-destructive" },
};

const DEFAULT_STATUS_STYLE = { icon: Clock, className: "bg-warning/10 text-warning" };

function statusStyle(status: string) {
  return STATUS_STYLES[status] || DEFAULT_STATUS_STYLE;
}

function ChamadosLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [chamados, setChamados] = useState<ChamadoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname !== "/app/chamados") return;

    async function loadChamados() {
      try {
        const clienteId = await requireCurrentClienteId();

        const { data, error } = await supabase
          .from("ordens_servico")
          .select(`
            id,
            numero_os,
            status,
            descricao_problema,
            data_entrada,
            tecnicos ( nome ),
            equipamentos!inner (
              nome,
              marca,
              codigo,
              cliente_id
            )
          `)
          .eq("equipamentos.cliente_id", clienteId)
          .order("data_entrada", { ascending: false });

        if (error) throw error;

        const dbChamados: ChamadoItem[] = (data || []).map((os) => {
          const equipName = os.equipamentos
            ? `${(os.equipamentos as any).nome} ${(os.equipamentos as any).marca ? `(${(os.equipamentos as any).marca})` : ""}`
            : "Equipamento Desconhecido";

          const formattedDate = new Date(os.data_entrada).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return {
            id: os.id,
            numeroOs: os.numero_os ?? os.id.substring(0, 8),
            equip: equipName,
            equipCodigo: (os.equipamentos as any)?.codigo ?? null,
            status: os.status,
            date: formattedDate,
            tecnicoNome: (os.tecnicos as any)?.nome || null,
          };
        });

        setChamados(dbChamados);
      } catch (err) {
        console.error("Erro ao carregar chamados:", err);
        setChamados([]);
      } finally {
        setLoading(false);
      }
    }

    loadChamados();
  }, [pathname]);

  if (pathname !== "/app/chamados") return <Outlet />;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Chamados</h1>
          <p className="text-sm text-muted-foreground">Acompanhe seus atendimentos</p>
        </div>
        <Link to="/app/chamados/novo" className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Novo
        </Link>
      </header>

      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando chamados...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chamados.map((c) => {
            const { icon: StatusIcon, className } = statusStyle(c.status);
            return (
              <Link
                key={c.id}
                to="/app/chamados/$id"
                params={{ id: c.id }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
              >
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${className}`}>
                  <StatusIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">OS #{c.numeroOs}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}>{c.status}</span>
                  </div>
                  <div className="truncate text-sm text-muted-foreground">
                    {c.equip}
                    {c.equipCodigo != null && ` · Código ${String(c.equipCodigo).padStart(6, "0")}`}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                    <span className="text-muted-foreground">{c.date}</span>
                    <span className="text-muted-foreground">·</span>
                    {c.tecnicoNome ? (
                      <span className="font-semibold text-foreground">{c.tecnicoNome}</span>
                    ) : (
                      <span className="font-semibold text-warning">Sem técnico atribuído</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
          {chamados.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Nenhum chamado ainda</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
