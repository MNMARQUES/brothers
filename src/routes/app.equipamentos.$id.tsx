import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Calendar, History, Loader2, AlertCircle, PenLine, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app/equipamentos/$id")({
  head: () => ({ meta: [{ title: "Equipamento — Brothers" }] }),
  component: EquipamentoDetail,
});

interface EquipamentoDetalhe {
  id: string;
  codigo: number | null;
  nome: string;
  tipo: string | null;
  ambiente: string | null;
  marca: string | null;
  modelo: string | null;
  btus: number | null;
  numero_serie: string | null;
  foto_url: string | null;
  created_at: string;
  confirmado_cliente: boolean;
  confirmado_em: string | null;
  confirmado_por: "cliente" | "assinatura_tecnico" | null;
}

function EquipamentoDetail() {
  const { id } = Route.useParams();
  const [eq, setEq] = useState<EquipamentoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function loadEquipamento() {
      try {
        const { data, error } = await supabase
          .from("equipamentos")
          .select("id, codigo, nome, tipo, ambiente, marca, modelo, btus, numero_serie, foto_url, created_at, confirmado_cliente, confirmado_em, confirmado_por")
          .eq("id", id)
          .single();

        if (error) throw error;
        setEq(data);
      } catch (err) {
        console.error("Erro ao carregar equipamento:", err);
      } finally {
        setLoading(false);
      }
    }

    loadEquipamento();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando equipamento...</p>
      </div>
    );
  }

  if (!eq) {
    return (
      <div className="space-y-5">
        <header>
          <Link to="/app/equipamentos" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </header>
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Equipamento não encontrado</p>
        </div>
      </div>
    );
  }

  const instalado = new Date(eq.created_at).toLocaleDateString("pt-BR");

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <Link to="/app/equipamentos" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="text-right">
          <div className="text-sm font-semibold">{eq.ambiente || eq.nome}</div>
          {eq.codigo != null && (
            <div className="text-xs text-muted-foreground">{String(eq.codigo).padStart(6, "0")}</div>
          )}
        </div>
      </header>

      <div>
        <h1 className="text-2xl font-black">{eq.ambiente || eq.nome}</h1>
        <p className="text-sm text-muted-foreground">{eq.marca} {eq.modelo}</p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 p-2 overflow-hidden">
          <img src={eq.foto_url || "/ar_condicionado.png"} alt={eq.nome} className="h-28 w-28 object-contain" />
        </div>
      </div>

      {eq.confirmado_cliente ? (
        <div className="flex items-center gap-3 rounded-2xl bg-success/10 p-4 text-sm font-semibold text-success">
          <PenLine className="h-5 w-5 shrink-0" />
          <span>
            Confirmado com assinatura durante a instalação
            {eq.confirmado_em && (
              <>
                {" "}em{" "}
                {new Date(eq.confirmado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </>
            )}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-4 text-sm text-warning">
          <Clock className="h-5 w-5 shrink-0" />
          <p>
            <strong>Pendente:</strong> este cadastro é validado apenas pela equipe técnica — em breve um técnico visitará para confirmar presencialmente e fixar a etiqueta de identificação no equipamento.
          </p>
        </div>
      )}

      <dl className="space-y-2 text-sm">
        {eq.codigo != null && <Row label="Código" value={String(eq.codigo).padStart(6, "0")} />}
        {eq.tipo && <Row label="Tipo" value={eq.tipo} />}
        {eq.btus && <Row label="BTUs" value={`${eq.btus.toLocaleString()} BTUs`} />}
        {eq.modelo && <Row label="Modelo" value={eq.modelo} />}
        {eq.numero_serie && <Row label="Nº de série" value={eq.numero_serie} />}
        {eq.ambiente && <Row label="Ambiente" value={eq.ambiente} />}
        <Row label="Cadastrado em" value={instalado} />
      </dl>

      <div className="space-y-2">
        <button className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/40">
          <History className="h-5 w-5 text-primary" />
          <span className="font-medium">Ver histórico</span>
        </button>
        <button className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/40">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="font-medium">Manutenções</span>
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
