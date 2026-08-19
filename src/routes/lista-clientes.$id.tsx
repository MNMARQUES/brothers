import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Loader2, AlertCircle, Tag, User, ClipboardCheck } from "lucide-react";
import { fetchCliente, fetchEquipamentosDoCliente, type ClienteListado, type EquipamentoListado } from "@/lib/brothers/clientes-data";
import { TecnicoShell } from "@/components/brothers/TecnicoShell";

export const Route = createFileRoute("/lista-clientes/$id")({
  head: () => ({ meta: [{ title: "Cliente — Brothers" }] }),
  component: ClienteDetalhePage,
});

function ClienteDetalhePage() {
  const { id } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const exactPath = `/lista-clientes/${id}`;
  const [cliente, setCliente] = useState<ClienteListado | null>(null);
  const [equipamentos, setEquipamentos] = useState<EquipamentoListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (pathname !== exactPath) return;

    Promise.all([fetchCliente(id), fetchEquipamentosDoCliente(id)])
      .then(([c, equips]) => {
        setCliente(c);
        setEquipamentos(equips);
      })
      .catch((err) => {
        console.error("Erro ao carregar cliente:", err);
        setErro("Não foi possível carregar este cliente.");
      })
      .finally(() => setLoading(false));
  }, [id, pathname, exactPath]);

  if (pathname !== exactPath) {
    return (
      <TecnicoShell>
        <Outlet />
      </TecnicoShell>
    );
  }

  return (
    <TecnicoShell>
      <div className="space-y-5">
        <header className="flex items-center justify-between">
          <Link to="/lista-clientes" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </header>

        {loading ? (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : erro || !cliente ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            <AlertCircle className="mx-auto mb-2 h-6 w-6" />
            {erro || "Cliente não encontrado."}
          </div>
        ) : (
          <>
            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-warning/10 text-warning">
                <User className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{cliente.nome}</div>
                <div className="truncate text-sm text-muted-foreground">{cliente.endereco || "Endereço não informado"}</div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{cliente.telefone}</span>
                  <span>·</span>
                  <span className="truncate">{cliente.email}</span>
                </div>
              </div>
              {cliente.plano && (
                <span className="shrink-0 rounded-full bg-warning/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-warning">
                  {cliente.plano}
                </span>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <h2 className="text-lg font-black tracking-tight">Equipamentos</h2>
              <Link
                to="/lista-clientes/$id/equipamentos/novo"
                params={{ id }}
                className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
              >
                <Plus className="h-4 w-4" /> Adicionar
              </Link>
            </div>

            <div className="mt-3 space-y-3">
              {equipamentos.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  Nenhum equipamento cadastrado ainda.
                </div>
              )}
              {equipamentos.map((e) => (
                <div
                  key={e.id}
                  className={`flex items-center gap-4 rounded-2xl border-2 p-4 ${
                    e.confirmadoCliente ? "border-border bg-card" : "border-warning/50 bg-warning/[0.06]"
                  }`}
                >
                  <Link
                    to="/lista-clientes/$id/equipamentos/$equipId"
                    params={{ id, equipId: e.id }}
                    className="flex min-w-0 flex-1 items-center gap-4"
                  >
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                      <img src={e.fotoUrl || "/ar_condicionado.png"} alt={e.nome} className="h-12 w-12 object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{e.nome}</div>
                      <div className="truncate text-sm text-muted-foreground">{e.marca} {e.modelo}</div>
                      {e.codigo != null && (
                        <div className="text-[11px] text-muted-foreground">Código {String(e.codigo).padStart(6, "0")}</div>
                      )}
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          e.confirmadoCliente ? "bg-success/10 text-success" : "bg-warning/15 text-warning"
                        }`}
                      >
                        {e.confirmadoCliente ? "Confirmado" : "Pendente de finalização"}
                      </span>
                    </div>
                  </Link>
                  {e.confirmadoCliente ? (
                    <Link
                      to="/etiqueta/$id"
                      params={{ id: e.id }}
                      className="flex shrink-0 flex-col items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                    >
                      <Tag className="h-4 w-4" /> Etiqueta
                    </Link>
                  ) : (
                    <Link
                      to="/lista-clientes/$id/equipamentos/$equipId/finalizar"
                      params={{ id, equipId: e.id }}
                      className="flex shrink-0 flex-col items-center gap-1 rounded-xl bg-warning px-3 py-2 text-[11px] font-bold text-warning-foreground transition hover:bg-warning/90"
                    >
                      <ClipboardCheck className="h-4 w-4" /> Finalizar
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </TecnicoShell>
  );
}
