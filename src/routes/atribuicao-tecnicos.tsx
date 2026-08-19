import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, AlertTriangle, CheckCircle2, Loader2, Check } from "lucide-react";
import {
  fetchAtendimentosTecnico,
  fetchTecnicosAtivos,
  atribuirTecnico,
  type AtendimentoTecnico,
  type TecnicoAtivo,
} from "@/lib/brothers/tecnico-data";
import { TecnicoShell } from "@/components/brothers/TecnicoShell";

export const Route = createFileRoute("/atribuicao-tecnicos")({
  head: () => ({ meta: [{ title: "Atribuição de técnicos — Brothers" }] }),
  component: AtribuicaoTecnicosPage,
});

const STATUS_FECHADOS = ["Resolvido", "Cancelado"];

function AtribuicaoTecnicosPage() {
  const [atendimentos, setAtendimentos] = useState<AtendimentoTecnico[]>([]);
  const [tecnicos, setTecnicos] = useState<TecnicoAtivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchAtendimentosTecnico(), fetchTecnicosAtivos()])
      .then(([lista, tecnicosAtivos]) => {
        setAtendimentos(lista.filter((a) => !STATUS_FECHADOS.includes(a.status)));
        setTecnicos(tecnicosAtivos);
      })
      .catch((err) => {
        console.error("Erro ao carregar atribuições:", err);
        setErro(err.message || "Não foi possível carregar os atendimentos.");
      })
      .finally(() => setLoading(false));
  }, []);

  const semTecnico = atendimentos.filter((a) => !a.tecnicoId).length;

  const handleChange = async (osId: string, tecnicoId: string) => {
    const novoTecnicoId = tecnicoId || null;
    const tecnico = tecnicos.find((t) => t.id === novoTecnicoId);
    setSalvandoId(osId);
    try {
      await atribuirTecnico(osId, novoTecnicoId);
      setAtendimentos((prev) =>
        prev.map((a) => (a.id === osId ? { ...a, tecnicoId: novoTecnicoId, tecnicoNome: tecnico?.nome || null } : a))
      );
    } catch (err) {
      console.error("Erro ao atribuir técnico:", err);
      setErro("Não foi possível salvar essa atribuição. Tente novamente.");
    } finally {
      setSalvandoId(null);
    }
  };

  return (
    <TecnicoShell>
      <div className="space-y-5">
        <header className="flex items-center justify-between">
          <Link to="/tecnico/perfil" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </header>

        <div>
          <h1 className="text-2xl font-black tracking-tight">Atribuição de técnicos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Defina o técnico responsável por cada OS em aberto</p>
        </div>

        {loading ? (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {erro && <p className="mt-5 text-sm text-destructive">{erro}</p>}

            {semTecnico > 0 ? (
              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm font-semibold text-warning">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {semTecnico} OS ainda sem técnico atribuído
              </div>
            ) : (
              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-success/20 bg-success/5 px-4 py-3 text-sm font-semibold text-success">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> Todas as OS em aberto têm técnico atribuído
              </div>
            )}

            <div className="mt-5 space-y-3">
              {atendimentos.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  Nenhuma OS em aberto no momento.
                </div>
              )}
              {atendimentos.map((a) => {
                const sem = !a.tecnicoId;
                return (
                  <div
                    key={a.id}
                    className={`rounded-2xl border p-4 ${sem ? "border-warning/30 bg-warning/5" : "border-border bg-card"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">OS #{a.numeroOs}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">{a.tipo}</span>
                        </div>
                        <div className="truncate text-sm text-muted-foreground">{a.cliente} - {a.bairro}</div>
                        <div className="text-[11px] text-muted-foreground">Aberta em {a.dataAbertura}</div>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-muted-foreground">{a.periodo}</span>
                    </div>

                    <div className="relative mt-3">
                      <select
                        className="w-full h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
                        value={a.tecnicoId || ""}
                        disabled={salvandoId === a.id}
                        onChange={(e) => handleChange(a.id, e.target.value)}
                      >
                        <option value="">Sem técnico atribuído</option>
                        {tecnicos.map((t) => (
                          <option key={t.id} value={t.id}>{t.nome}{t.especialidade ? ` - ${t.especialidade}` : ""}</option>
                        ))}
                      </select>
                      {salvandoId === a.id && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                      )}
                      {salvandoId !== a.id && a.tecnicoId && (
                        <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-success" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </TecnicoShell>
  );
}
