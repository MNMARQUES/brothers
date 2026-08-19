import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { CHECKLIST_SERVICO } from "@/lib/brothers/mock-data";

export const Route = createFileRoute("/tecnico/atendimento/$id/checklist")({
  head: () => ({ meta: [{ title: "Execução do Serviço — Brothers" }] }),
  component: ExecucaoServico,
});

function ExecucaoServico() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [checked, setChecked] = useState<Record<string, boolean>>({
    "Limpeza de filtros": true,
    "Limpeza da evaporadora": true,
    "Limpeza da condensadora": true,
    "Verificação elétrica": true,
  });

  const toggle = (item: string) => setChecked((c) => ({ ...c, [item]: !c[item] }));

  const handleCancelar = () => {
    if (window.confirm("Cancelar este atendimento e voltar para a lista?")) {
      navigate({ to: "/tecnico/atendimentos" });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="h-1.5 flex-1 rounded-full bg-primary" />
          <div className="h-1.5 flex-1 rounded-full bg-border" />
        </div>
        <button onClick={handleCancelar} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div>
        <h1 className="text-2xl font-black tracking-tight">Checklist de serviço</h1>
        <p className="mt-1 text-sm text-muted-foreground">Marque os itens realizados</p>
      </div>

      <div className="space-y-2">
        {CHECKLIST_SERVICO.map((item) => (
          <label
            key={item}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40"
          >
            <input
              type="checkbox"
              checked={!!checked[item]}
              onChange={() => toggle(item)}
              className="h-5 w-5 rounded-md border-input text-primary focus:ring-primary/30"
            />
            <span className="font-medium">{item}</span>
          </label>
        ))}
      </div>

      <Link
        to="/tecnico/atendimento/$id/registro"
        params={{ id }}
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        Próximo
      </Link>

      <button
        onClick={handleCancelar}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
      >
        <X className="h-4 w-4" /> Cancelar e voltar
      </button>
    </div>
  );
}
