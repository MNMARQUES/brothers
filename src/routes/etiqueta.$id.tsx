import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, AlertCircle, Printer } from "lucide-react";
import QRCode from "qrcode";
import { fetchEtiquetaEquipamento, type EtiquetaEquipamento } from "@/lib/brothers/clientes-data";

export const Route = createFileRoute("/etiqueta/$id")({
  head: () => ({ meta: [{ title: "Etiqueta do equipamento — Brothers" }] }),
  component: EtiquetaPage,
});

function EtiquetaPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [equip, setEquip] = useState<EtiquetaEquipamento | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetchEtiquetaEquipamento(id)
      .then(setEquip)
      .catch((err) => {
        console.error("Erro ao carregar etiqueta:", err);
        setErro(err.message || "Não foi possível carregar a etiqueta.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // O QR aponta para a ficha do equipamento no app do técnico — lida a
  // cada atendimento, para identificar o item na hora sem precisar
  // procurar o cliente ou digitar o código manualmente. Gerado 100%
  // localmente (sem chamar nenhum serviço externo), então funciona mesmo
  // com sinal ruim no momento da emissão.
  useEffect(() => {
    if (!equip) return;
    const url = `${window.location.origin}/lista-clientes/${equip.clienteId}/equipamentos/${equip.id}`;
    QRCode.toDataURL(url, { margin: 1, width: 240, color: { dark: "#0f172a", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch((err) => console.error("Erro ao gerar QR code:", err));
  }, [equip]);

  const codigoFormatado = equip?.codigo != null ? `BRO-${String(equip.codigo).padStart(6, "0")}` : "—";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md px-5 pb-10 pt-6 sm:max-w-lg sm:px-8">
        <header className="flex items-center justify-between print:hidden">
          <button
            onClick={() => (window.history.length > 1 ? window.history.back() : navigate({ to: "/tecnico" }))}
            className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {equip && (
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Printer className="h-4 w-4" /> Imprimir etiqueta
            </button>
          )}
        </header>

        {loading ? (
          <div className="mt-8 flex justify-center print:hidden">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : erro || !equip ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground print:hidden">
            <AlertCircle className="mx-auto mb-2 h-6 w-6" />
            {erro || "Equipamento não encontrado."}
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-3 print:mt-0">
            <div className="w-full max-w-xs rounded-3xl border-2 border-dashed border-border bg-card p-6 text-center print:w-64 print:rounded-none print:border-black print:p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground print:text-black">
                Brothers · Manutenção Premium
              </div>
              <div className="mt-3 text-2xl font-black tracking-wider text-foreground print:text-black">
                {codigoFormatado}
              </div>

              <div className="mx-auto mt-3 grid h-40 w-40 place-items-center rounded-xl bg-white p-2 print:h-36 print:w-36">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt={`QR code do equipamento ${codigoFormatado}`} className="h-full w-full object-contain" />
                ) : (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground print:hidden" />
                )}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground print:text-black">
                Leia este código a cada atendimento
              </p>

              <div className="mt-4 space-y-0.5 text-sm">
                <div className="font-bold text-foreground print:text-black">{equip.nome}</div>
                <div className="text-muted-foreground print:text-black">
                  {equip.marca} {equip.modelo}
                </div>
                {equip.btus && <div className="text-muted-foreground print:text-black">{equip.btus.toLocaleString()} BTUs</div>}
              </div>
              <div className="mt-3 border-t border-dashed border-border pt-3 text-xs text-muted-foreground print:border-black print:text-black">
                Cliente: {equip.clienteNome}
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground print:text-black">
                Não remover — identificação Brothers
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground print:hidden">
              Fixe esta etiqueta no equipamento. O QR identifica o item de forma única e pode ser lido em qualquer atendimento futuro.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
