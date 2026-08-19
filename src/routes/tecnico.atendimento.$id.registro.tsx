import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, ChevronRight, X, Loader2, Smartphone, PenLine, CloudOff } from "lucide-react";
import { Field, inputCls } from "@/components/brothers/AuthCard";
import { STATUS_ATENDIMENTO, type StatusAtendimento } from "@/lib/brothers/mock-data";
import { fetchAtendimentoTecnico, atualizarAtendimentoTecnico, type AtendimentoTecnico } from "@/lib/brothers/tecnico-data";
import { SignaturePad } from "@/components/brothers/SignaturePad";
import { enviarConfirmacao, queueConfirmacao } from "@/lib/brothers/offline-sync";

export const Route = createFileRoute("/tecnico/atendimento/$id/registro")({
  head: () => ({ meta: [{ title: "Registro do Serviço — Brothers" }] }),
  component: RegistroServico,
});

function RegistroServico() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [a, setA] = useState<AtendimentoTecnico | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [observacoes, setObservacoes] = useState("Serviço realizado com sucesso. Equipamento funcionando normalmente.");
  const [status, setStatus] = useState<StatusAtendimento>("Resolvido");
  const [problema, setProblema] = useState("");
  const [solucao, setSolucao] = useState("");
  const [periodoNovaVisita, setPeriodoNovaVisita] = useState<"Manhã" | "Tarde">("Manhã");
  const [dataNovaVisita, setDataNovaVisita] = useState("");

  // Como o atendimento (final ou parcial) foi confirmado: o cliente confirma
  // depois pelo app dele, ou o técnico colhe a assinatura na hora (útil com
  // sinal de internet ruim, já que a assinatura em si funciona offline).
  const [confirmacao, setConfirmacao] = useState<"cliente_app" | "assinatura">("cliente_app");
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState<string | null>(null);
  const [ficouPendente, setFicouPendente] = useState(false);

  useEffect(() => {
    fetchAtendimentoTecnico(id)
      .then((data) => {
        setA(data);
        if (data) {
          setProblema(data.problema);
          if (STATUS_ATENDIMENTO.includes(data.status as StatusAtendimento)) {
            setStatus(data.status as StatusAtendimento);
          }
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar atendimento:", err);
        setErro(err.message || "Não foi possível carregar o atendimento.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancelar = () => {
    if (window.confirm("Cancelar este atendimento e voltar para a lista?")) {
      navigate({ to: "/tecnico/atendimentos" });
    }
  };

  const exigeConfirmacao = status === "Resolvido" || status === "Aguardando peça";

  const handleSalvar = async () => {
    if (exigeConfirmacao && confirmacao === "assinatura" && !assinaturaDataUrl) {
      setErro("Colete a assinatura do cliente antes de concluir, ou escolha a confirmação pelo app dele.");
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const servicoRealizado = `${observacoes}${solucao ? `\nSolução: ${solucao}` : ""}`;

      if (exigeConfirmacao && confirmacao === "assinatura" && assinaturaDataUrl) {
        try {
          await enviarConfirmacao({ tipo: "os", osId: id, statusLabel: status, servicoRealizado, assinaturaDataUrl });
        } catch (err) {
          // Sem conexão (ou instável) pra enviar agora: fica guardado no
          // aparelho e sincroniza sozinho quando a internet voltar.
          console.error("Não foi possível enviar agora, ficará pendente:", err);
          queueConfirmacao({ tipo: "os", osId: id, statusLabel: status, servicoRealizado, assinaturaDataUrl });
          setFicouPendente(true);
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } else {
        await atualizarAtendimentoTecnico(id, { statusLabel: status, servicoRealizado });
      }

      navigate({ to: "/tecnico" });
    } catch (err: any) {
      console.error("Erro ao salvar registro do serviço:", err);
      setErro(err.message || "Não foi possível salvar o registro.");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!a) {
    return <p className="text-sm text-destructive">{erro || "Atendimento não encontrado"}</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Registro do serviço</h1>
          <p className="mt-1 text-sm text-muted-foreground">Fotos e observações</p>
        </div>
        <button onClick={handleCancelar} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card">
          <X className="h-4 w-4" />
        </button>
      </header>

      <PhotoGrid label="Fotos antes" />
      <PhotoGrid label="Fotos depois" />

      <Field label="Observações">
        <textarea
          className={inputCls + " h-28 py-3"}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
      </Field>

      <Field label="Status do atendimento">
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as StatusAtendimento)}>
          {STATUS_ATENDIMENTO.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      {status === "Resolvido" && (
        <div className="space-y-4 rounded-2xl border border-success/20 bg-success/5 p-4">
          <Field label="Problema">
            <textarea
              className={inputCls + " h-20 py-3"}
              placeholder="Descreva o problema identificado"
              value={problema}
              onChange={(e) => setProblema(e.target.value)}
            />
          </Field>
          <Field label="Solução">
            <textarea
              className={inputCls + " h-20 py-3"}
              placeholder="Descreva a solução aplicada"
              value={solucao}
              onChange={(e) => setSolucao(e.target.value)}
            />
          </Field>
        </div>
      )}

      {status === "Aguardando peça" && (
        <div className="space-y-4 rounded-2xl border border-warning/20 bg-warning/5 p-4">
          <Field label="Estimativa de nova visita" hint="Data prevista para retornar com a peça">
            <input
              type="date"
              className={inputCls}
              value={dataNovaVisita}
              onChange={(e) => setDataNovaVisita(e.target.value)}
            />
          </Field>
          <Field label="Período">
            <div className="flex gap-2">
              {(["Manhã", "Tarde"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriodoNovaVisita(p)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    periodoNovaVisita === p ? "border-warning bg-warning text-white" : "border-border bg-card text-foreground hover:border-warning/40"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}

      <button className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/40">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Peças utilizadas</div>
          <div className="mt-0.5 font-semibold">Nenhuma peça utilizada</div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      {exigeConfirmacao && (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Confirmação do {status === "Resolvido" ? "atendimento" : "atendimento parcial"}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setConfirmacao("cliente_app")}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${
                confirmacao === "cliente_app" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <Smartphone className={`h-5 w-5 ${confirmacao === "cliente_app" ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-xs font-semibold">Cliente confirma pelo app dele</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmacao("assinatura")}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${
                confirmacao === "assinatura" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <PenLine className={`h-5 w-5 ${confirmacao === "assinatura" ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-xs font-semibold">Colher assinatura agora</span>
            </button>
          </div>

          {confirmacao === "assinatura" && (
            <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CloudOff className="h-3.5 w-3.5" /> Funciona mesmo com sinal fraco — se não conseguir enviar na hora, fica pendente e sincroniza sozinho depois.
              </div>
              <p className="text-sm font-medium">Peça para o cliente assinar abaixo:</p>
              <SignaturePad onChange={setAssinaturaDataUrl} />
            </div>
          )}
        </div>
      )}

      {ficouPendente && (
        <div className="flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm font-semibold text-warning">
          <CloudOff className="h-4 w-4 shrink-0" /> Sem conexão agora — a confirmação ficou salva no aparelho e será enviada automaticamente.
        </div>
      )}

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <button
        onClick={handleSalvar}
        disabled={salvando}
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
      >
        {salvando ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
          </span>
        ) : (
          "Concluir"
        )}
      </button>

      <button
        onClick={handleCancelar}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
      >
        <X className="h-4 w-4" /> Cancelar e voltar
      </button>
    </div>
  );
}

function PhotoGrid({ label }: { label: string }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
            <img src="/ar_condicionado.png" alt={label} className="h-14 w-14 object-contain" />
          </div>
        ))}
        <label className="grid h-20 w-20 shrink-0 cursor-pointer place-items-center rounded-xl border border-dashed border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary">
          <Camera className="h-5 w-5" />
          <input type="file" accept="image/*" className="hidden" />
        </label>
      </div>
    </div>
  );
}
