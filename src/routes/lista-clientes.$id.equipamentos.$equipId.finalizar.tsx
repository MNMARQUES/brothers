import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, AlertCircle, CloudOff } from "lucide-react";
import { fetchEquipamentoParaFinalizar, type EquipamentoParaFinalizar } from "@/lib/brothers/clientes-data";
import { enviarConfirmacao, queueConfirmacao } from "@/lib/brothers/offline-sync";
import { SignaturePad } from "@/components/brothers/SignaturePad";
import { primaryBtn } from "@/components/brothers/AuthCard";
import { TecnicoShell } from "@/components/brothers/TecnicoShell";

export const Route = createFileRoute("/lista-clientes/$id/equipamentos/$equipId/finalizar")({
  head: () => ({ meta: [{ title: "Finalizar equipamento — Brothers" }] }),
  component: FinalizarEquipamentoPage,
});

function FinalizarEquipamentoPage() {
  const { id: clienteId, equipId } = Route.useParams();
  const navigate = useNavigate();

  const [equip, setEquip] = useState<EquipamentoParaFinalizar | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [ficouPendente, setFicouPendente] = useState(false);
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchEquipamentoParaFinalizar(equipId)
      .then(setEquip)
      .catch((err) => {
        console.error("Erro ao carregar equipamento:", err);
        setErro("Não foi possível carregar este equipamento.");
      })
      .finally(() => setLoading(false));
  }, [equipId]);

  const handleContinuar = async () => {
    if (!assinaturaDataUrl) {
      setErro("Colete a assinatura do cliente para finalizar o cadastro. Equipamento só pode ser confirmado pela equipe técnica presencialmente.");
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      await enviarConfirmacao({ tipo: "equipamento", equipamentoId: equipId, assinaturaDataUrl });
    } catch (err) {
      console.error("Não foi possível enviar agora, ficará pendente:", err);
      queueConfirmacao({ tipo: "equipamento", equipamentoId: equipId, assinaturaDataUrl });
      setFicouPendente(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } finally {
      setSalvando(false);
    }

    navigate({ to: "/etiqueta/$id", params: { id: equipId } });
  };

  return (
    <TecnicoShell>
      <div className="space-y-5">
        <header className="flex items-center justify-between">
          <Link to="/lista-clientes/$id" params={{ id: clienteId }} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </header>

        {loading ? (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !equip ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            <AlertCircle className="mx-auto mb-2 h-6 w-6" />
            {erro || "Equipamento não encontrado."}
          </div>
        ) : (
          <>
            <div className="mt-6">
              <h1 className="text-2xl font-black tracking-tight">Finalizar cadastro</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Confirme a instalação de <strong>{equip.nome}</strong> ({equip.marca} {equip.modelo}) para {equip.clienteNome}. Este cadastro só pode ser validado pela equipe técnica, presencialmente.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CloudOff className="h-3.5 w-3.5" /> Funciona mesmo com sinal fraco — se não conseguir enviar na hora, fica pendente e sincroniza sozinho depois.
                </div>
                <p className="text-sm font-medium">Peça para o cliente assinar abaixo:</p>
                <SignaturePad onChange={setAssinaturaDataUrl} />
              </div>

              {ficouPendente && (
                <div className="flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm font-semibold text-warning">
                  <CloudOff className="h-4 w-4 shrink-0" /> Sem conexão agora — a confirmação ficou salva no aparelho e será enviada automaticamente.
                </div>
              )}

              {erro && <p className="text-sm text-destructive">{erro}</p>}

              <button className={primaryBtn} onClick={handleContinuar} disabled={salvando}>
                {salvando ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                  </span>
                ) : (
                  "Concluir e gerar etiqueta"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </TecnicoShell>
  );
}
