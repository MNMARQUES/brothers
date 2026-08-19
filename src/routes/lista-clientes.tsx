import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, User, Loader2, ChevronRight } from "lucide-react";
import { fetchClientes, type ClienteListado } from "@/lib/brothers/clientes-data";
import { TecnicoShell } from "@/components/brothers/TecnicoShell";

export const Route = createFileRoute("/lista-clientes")({
  head: () => ({ meta: [{ title: "Clientes — Brothers" }] }),
  component: ListaClientesPage,
});

function ListaClientesPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [busca, setBusca] = useState("");
  const [clientes, setClientes] = useState<ClienteListado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname !== "/lista-clientes") return;

    fetchClientes()
      .then(setClientes)
      .catch((err) => console.error("Erro ao carregar clientes:", err))
      .finally(() => setLoading(false));
  }, [pathname]);

  if (pathname !== "/lista-clientes") {
    return (
      <TecnicoShell>
        <Outlet />
      </TecnicoShell>
    );
  }

  const alvo = busca.toLowerCase();
  const lista = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(alvo) ||
      (c.endereco || "").toLowerCase().includes(alvo) ||
      (c.plano || "").toLowerCase().includes(alvo)
  );

  return (
    <TecnicoShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clientes.length} cadastrados</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full h-12 rounded-xl border border-input bg-card pl-10 pr-4 text-[15px] placeholder:text-muted-foreground/60 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder="Buscar por nome, endereço ou plano"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {lista.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Nenhum cliente encontrado.
              </div>
            )}
            {lista.map((c) => (
              <Link
                key={c.id}
                to="/lista-clientes/$id"
                params={{ id: c.id }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-warning/10 text-warning">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="truncate font-bold">{c.nome}</span>
                  <div className="truncate text-sm text-muted-foreground">
                    {c.plano ? `Plano ${c.plano}` : "Sem plano"} - {c.endereco || "Endereço não informado"}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{c.telefone}</span>
                    <span>·</span>
                    <span className="truncate">{c.email}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </TecnicoShell>
  );
}
