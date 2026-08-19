import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { fetchAtendimentosTecnico, type AtendimentoTecnico } from "@/lib/brothers/tecnico-data";

export const Route = createFileRoute("/tecnico/agenda")({
  head: () => ({ meta: [{ title: "Agenda Técnico — Brothers" }] }),
  component: AgendaTecnico,
});

const FILTERS = ["Todos", "Preventivas", "Corretivas"] as const;

function AgendaTecnico() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Todos");
  const [atendimentos, setAtendimentos] = useState<AtendimentoTecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetchAtendimentosTecnico()
      .then(setAtendimentos)
      .catch((err) => {
        console.error("Erro ao carregar agenda:", err);
        setErro(err.message || "Não foi possível carregar a agenda.");
      })
      .finally(() => setLoading(false));
  }, []);

  const lista = atendimentos.filter((a) => {
    if (filter === "Preventivas") return a.tipo === "Preventiva";
    if (filter === "Corretivas") return a.tipo === "Corretiva";
    return true;
  });

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Agenda do dia</h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
          <Search className="h-4 w-4" />
        </button>
      </header>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando agenda...</p>
        </div>
      ) : erro ? (
        <p className="text-sm text-destructive">{erro}</p>
      ) : (
        <div className="space-y-3">
          {lista.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Nenhum atendimento encontrado.
            </div>
          )}
          {lista.map((a) => (
            <Link
              key={a.id}
              to="/tecnico/atendimento/$id"
              params={{ id: a.id }}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
            >
              <div className="w-12 shrink-0 text-sm font-bold">{a.hora}</div>
              <div className="min-w-0 flex-1">
                <div className="font-bold">
                  <span className="text-primary">OS #{a.numeroOs}</span> {a.cliente}
                </div>
                <div className="truncate text-sm text-muted-foreground">{a.endereco}</div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  a.status === "Aguardando peça"
                    ? "bg-warning/10 text-warning"
                    : a.status === "Resolvido"
                    ? "bg-success/10 text-success"
                    : a.status === "Agendado"
                    ? "bg-slate-200 text-slate-600"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {a.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
