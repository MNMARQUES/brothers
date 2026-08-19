import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, ClipboardCheck, CheckCircle2, User } from "lucide-react";
import { fetchEquipamentosPendentes, type EquipamentoPendente } from "@/lib/brothers/clientes-data";
import { TecnicoShell } from "@/components/brothers/TecnicoShell";

export const Route = createFileRoute("/lista-clientes/pendentes")({
  head: () => ({ meta: [{ title: "Equipamentos pendentes — Brothers" }] }),
  component: EquipamentosPendentesPage,
});

function EquipamentosPendentesPage() {
  const [pendentes, setPendentes] = useState<EquipamentoPendente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipamentosPendentes()
      .then(setPendentes)
      .catch((err) => console.error("Erro ao carregar equipamentos pendentes:", err))
      .finally(() => setLoading(false));
  }, []);

  const porCliente = useMemo(() => {
    const grupos = new Map<string, { clienteNome: string; itens: EquipamentoPendente[] }>();
    for (const e of pendentes) {
      if (!grupos.has(e.clienteId)) grupos.set(e.clienteId, { clienteNome: e.clienteNome, itens: [] });
      grupos.get(e.clienteId)!.itens.push(e);
    }
    return Array.from(grupos.values()).sort((a, b) => a.clienteNome.localeCompare(b.clienteNome));
  }, [pendentes]);

  return (
    <TecnicoShell>
      <div className="space-y-5">
        <header className="flex items-center justify-between">
          <Link to="/tecnico" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </header>

        <div>
          <h1 className="text-2xl font-black tracking-tight">Cadastro de equipamento</h1>
          <p className="mt-1 text-sm text-muted-foreground">{pendentes.length} equipamento{pendentes.length !== 1 ? "s" : ""} aguardando confirmação presencial</p>
        </div>

        {loading ? (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : pendentes.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="mx-auto mb-2 h-6 w-6" />
            Nenhum equipamento pendente. Tudo confirmado!
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {porCliente.map((grupo) => (
              <div key={grupo.clienteNome}>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <User className="h-3.5 w-3.5" /> {grupo.clienteNome}
                </div>
                <div className="space-y-3">
                  {grupo.itens.map((e) => (
                    <Link
                      key={e.id}
                      to="/lista-clientes/$id/equipamentos/$equipId"
                      params={{ id: e.clienteId, equipId: e.id }}
                      className="flex items-center gap-4 rounded-2xl border-2 border-warning/50 bg-warning/[0.06] p-4 transition hover:border-warning"
                    >
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning">
                        <ClipboardCheck className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold">{e.nome}</div>
                        <div className="truncate text-sm text-muted-foreground">{e.marca} {e.modelo}</div>
                        {e.codigo != null && (
                          <div className="text-[11px] text-muted-foreground">Código {String(e.codigo).padStart(6, "0")}</div>
                        )}
                      </div>
                      <span className="shrink-0 rounded-lg bg-warning px-3 py-1.5 text-[11px] font-bold text-warning-foreground">
                        Ver
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TecnicoShell>
  );
}
