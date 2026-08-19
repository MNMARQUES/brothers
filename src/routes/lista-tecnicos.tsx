import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Search, UserCog, Loader2, Clock } from "lucide-react";
import { fetchEquipe, type MembroOuConvite, type NivelPrivilegio } from "@/lib/brothers/equipe";
import { TecnicoShell } from "@/components/brothers/TecnicoShell";

export const Route = createFileRoute("/lista-tecnicos")({
  head: () => ({ meta: [{ title: "Técnicos — Brothers" }] }),
  component: ListaTecnicosPage,
});

const PRIVILEGIO_BADGE: Record<NivelPrivilegio, string> = {
  Administrador: "bg-destructive/10 text-destructive",
  Supervisor: "bg-warning/10 text-warning",
  Técnico: "bg-primary/10 text-primary",
};

function ListaTecnicosPage() {
  const [busca, setBusca] = useState("");
  const [equipe, setEquipe] = useState<MembroOuConvite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipe()
      .then(setEquipe)
      .catch((err) => console.error("Erro ao carregar equipe:", err))
      .finally(() => setLoading(false));
  }, []);

  const lista = equipe.filter((t) => {
    const alvo = busca.toLowerCase();
    return (
      t.nome.toLowerCase().includes(alvo) ||
      (t.especialidade || "").toLowerCase().includes(alvo) ||
      (t.areaAtuacao || "").toLowerCase().includes(alvo)
    );
  });

  return (
    <TecnicoShell>
      <div className="space-y-5">
        <header className="flex items-center justify-between">
          <Link to="/tecnico/perfil" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link to="/cadastro-tecnico" className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> Adicionar
          </Link>
        </header>

        <div>
          <h1 className="text-2xl font-black tracking-tight">Técnicos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{equipe.length} cadastrados</p>
        </div>

        <div className="relative mt-5">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full h-12 rounded-xl border border-input bg-card pl-10 pr-4 text-[15px] placeholder:text-muted-foreground/60 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder="Buscar por nome, especialidade ou bairro"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {lista.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Nenhum técnico encontrado.
              </div>
            )}
            {lista.map((t) => {
              const pendente = t.status === "pendente";
              const key = pendente ? `convite-${(t as any).id}` : `membro-${(t as any).userId}`;
              return (
                <div key={key} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${pendente ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
                    {pendente ? <Clock className="h-5 w-5" /> : <UserCog className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold">{t.nome}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIVILEGIO_BADGE[t.nivelPrivilegio]}`}>
                        {t.nivelPrivilegio}
                      </span>
                      {pendente ? (
                        <span className="shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">Aguardando cadastro</span>
                      ) : (
                        !("ativo" in t && t.ativo) && (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Inativo</span>
                        )
                      )}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">{t.especialidade} - {t.areaAtuacao}</div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{t.telefone}</span>
                      <span>·</span>
                      <span className="truncate">{t.email}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TecnicoShell>
  );
}
