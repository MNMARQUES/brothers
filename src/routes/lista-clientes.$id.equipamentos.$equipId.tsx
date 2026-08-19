import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Calendar, History, Loader2, AlertCircle, PenLine, Clock, ClipboardCheck, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchEquipamentoDetalheTecnico, type EquipamentoDetalheTecnico } from "@/lib/brothers/clientes-data";
import { TecnicoShell } from "@/components/brothers/TecnicoShell";

export const Route = createFileRoute("/lista-clientes/$id/equipamentos/$equipId")({
  head: () => ({ meta: [{ title: "Equipamento — Brothers" }] }),
  component: EquipamentoDetalheTecnicoPage,
});

function EquipamentoDetalheTecnicoPage() {
  const { id: clienteId, equipId } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const exactPath = `/lista-clientes/${clienteId}/equipamentos/${equipId}`;
  const [eq, setEq] = useState<EquipamentoDetalheTecnico | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname !== exactPath) return;

    fetchEquipamentoDetalheTecnico(equipId)
      .then(setEq)
      .catch((err) => console.error("Erro ao carregar equipamento:", err))
      .finally(() => setLoading(false));
  }, [equipId, pathname, exactPath]);

  if (pathname !== exactPath) {
    return (
      <TecnicoShell>
        <Outlet />
      </TecnicoShell>
    );
  }

  if (loading) {
    return (
      <TecnicoShell>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TecnicoShell>
    );
  }

  if (!eq) {
    return (
      <TecnicoShell>
        <div className="space-y-5">
          <header>
            <Link to="/lista-clientes/$id" params={{ id: clienteId }} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </header>
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Equipamento não encontrado</p>
          </div>
        </div>
      </TecnicoShell>
    );
  }

  const cadastrado = new Date(eq.createdAt).toLocaleDateString("pt-BR");

  return (
    <TecnicoShell>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <Link to="/lista-clientes/$id" params={{ id: clienteId }} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="text-right">
            <div className="text-sm font-semibold">{eq.ambiente || eq.nome}</div>
            <div className="text-xs text-muted-foreground">Cliente: {eq.clienteNome}</div>
          </div>
        </header>

        <div>
          <h1 className="text-2xl font-black">{eq.ambiente || eq.nome}</h1>
          <p className="text-sm text-muted-foreground">{eq.marca} {eq.modelo}</p>
          {eq.codigo != null && (
            <p className="mt-1 text-xs font-semibold text-muted-foreground">Código {String(eq.codigo).padStart(6, "0")}</p>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 p-2 overflow-hidden">
            <img src={eq.fotoUrl || "/ar_condicionado.png"} alt={eq.nome} className="h-28 w-28 object-contain" />
          </div>
        </div>

        {eq.confirmadoCliente ? (
          <div className="space-y-3 rounded-2xl border border-success/20 bg-success/10 p-4">
            <div className="flex items-center gap-3 text-sm font-semibold text-success">
              <PenLine className="h-5 w-5 shrink-0" />
              <span>
                Confirmado com assinatura
                {eq.confirmadoEm && (
                  <>
                    {" "}em{" "}
                    {new Date(eq.confirmadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </>
                )}
              </span>
            </div>
            <Link
              to="/etiqueta/$id"
              params={{ id: eq.id }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-success text-sm font-semibold text-success-foreground transition hover:bg-success/90"
            >
              <Tag className="h-4 w-4" /> Ver etiqueta
            </Link>
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl border border-warning/20 bg-warning/5 p-4">
            <div className="flex items-center gap-3 text-sm text-warning">
              <Clock className="h-5 w-5 shrink-0" />
              <p>
                <strong>Pendente:</strong> confirme presencialmente com o cliente e emita a etiqueta de identificação.
              </p>
            </div>
            <Link
              to="/lista-clientes/$id/equipamentos/$equipId/finalizar"
              params={{ id: clienteId, equipId: eq.id }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-warning text-sm font-semibold text-warning-foreground transition hover:bg-warning/90"
            >
              <ClipboardCheck className="h-4 w-4" /> Confirmar e emitir etiqueta
            </Link>
          </div>
        )}

        <dl className="space-y-2 text-sm">
          {eq.tipo && <Row label="Tipo" value={eq.tipo} />}
          {eq.btus && <Row label="BTUs" value={`${eq.btus.toLocaleString()} BTUs`} />}
          {eq.modelo && <Row label="Modelo" value={eq.modelo} />}
          {eq.numeroSerie && <Row label="Nº de série" value={eq.numeroSerie} />}
          {eq.ambiente && <Row label="Ambiente" value={eq.ambiente} />}
          <Row label="Cadastrado em" value={cadastrado} />
        </dl>

        <div className="space-y-2">
          <button className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/40">
            <History className="h-5 w-5 text-primary" />
            <span className="font-medium">Ver histórico</span>
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/40">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="font-medium">Manutenções</span>
          </button>
        </div>
      </div>
    </TecnicoShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
