import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Plus, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireCurrentClienteId } from "@/lib/brothers/auth";

export const Route = createFileRoute("/app/equipamentos")({
  head: () => ({ meta: [{ title: "Equipamentos — Brothers" }] }),
  component: EquipamentosPage,
});

interface EquipamentoItem {
  id: string;
  codigo: number | null;
  nome: string;
  marca: string | null;
  modelo: string | null;
  btus: number | null;
  foto_url: string | null;
  confirmado_cliente: boolean;
}

function EquipamentosPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [equipamentos, setEquipamentos] = useState<EquipamentoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname !== "/app/equipamentos") return;

    async function loadEquipamentos() {
      try {
        const clienteId = await requireCurrentClienteId();

        const { data, error } = await supabase
          .from("equipamentos")
          .select("id, codigo, nome, marca, modelo, btus, foto_url, confirmado_cliente")
          .eq("cliente_id", clienteId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setEquipamentos(data || []);
      } catch (err) {
        console.error("Erro ao carregar equipamentos:", err);
        setEquipamentos([]);
      } finally {
        setLoading(false);
      }
    }

    loadEquipamentos();
  }, [pathname]);

  if (pathname !== "/app/equipamentos") return <Outlet />;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Meus Equipamentos</h1>
          <p className="text-sm text-muted-foreground">{equipamentos.length} cadastrados</p>
        </div>
        <Link to="/app/equipamentos/novo" className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Adicionar
        </Link>
      </header>

      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando equipamentos...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {equipamentos.map((e) => (
            <Link
              key={e.id}
              to="/app/equipamentos/$id"
              params={{ id: e.id }}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
            >
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                <img src={e.foto_url || "/ar_condicionado.png"} alt={e.nome} className="h-12 w-12 object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{e.nome}</div>
                <div className="truncate text-sm text-muted-foreground">{e.marca} {e.modelo}</div>
                {e.codigo != null && (
                  <div className="text-[11px] text-muted-foreground">Código {String(e.codigo).padStart(6, "0")}</div>
                )}
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  {e.btus && <span>{e.btus.toLocaleString()} BTUs</span>}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      e.confirmado_cliente ? "bg-success/10 text-success" : "bg-warning/15 text-warning"
                    }`}
                  >
                    {e.confirmado_cliente ? "Confirmado" : "Pendente de validação"}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
          {equipamentos.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Nenhum equipamento cadastrado ainda</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
