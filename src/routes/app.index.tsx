import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Calendar, Snowflake, AlertCircle, Plus, ArrowRight, Clock, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentCliente } from "@/lib/brothers/auth";
import { PLANS } from "@/lib/brothers/mock-data";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Início — Brothers" }] }),
  component: Dashboard,
});

const STATUS_FECHADOS = ["Finalizado", "Concluído", "Resolvido", "Cancelado"];

function Dashboard() {
  const [nome, setNome] = useState("");
  const [clienteCodigo, setClienteCodigo] = useState<string | null>(null);
  const [planoNome, setPlanoNome] = useState<string | null>(null);
  const [equipamentosCount, setEquipamentosCount] = useState(0);
  const [chamadosAbertos, setChamadosAbertos] = useState(0);
  const [historicoCount, setHistoricoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  function copiarCodigo() {
    if (!clienteCodigo) return;
    navigator.clipboard.writeText(clienteCodigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  useEffect(() => {
    async function load() {
      try {
        const cliente = await getCurrentCliente();
        if (!cliente) return;

        setNome(cliente.nome?.split(" ")[0] || "");
        setClienteCodigo(cliente.codigo != null ? String(cliente.codigo).padStart(6, "0") : null);
        setPlanoNome(cliente.plano);

        const [{ count: equipCount }, { data: chamados }] = await Promise.all([
          supabase.from("equipamentos").select("id", { count: "exact", head: true }).eq("cliente_id", cliente.id),
          supabase
            .from("ordens_servico")
            .select("status, equipamentos!inner(cliente_id)")
            .eq("equipamentos.cliente_id", cliente.id),
        ]);

        setEquipamentosCount(equipCount || 0);

        const lista = chamados || [];
        setHistoricoCount(lista.length);
        setChamadosAbertos(lista.filter((c) => !STATUS_FECHADOS.includes(c.status)).length);
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const plano = planoNome ? PLANS.find((p) => p.name.toLowerCase() === planoNome.toLowerCase()) : null;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Bem-vindo de volta</div>
          <h1 className="text-2xl font-black tracking-tight">Olá, {loading ? "..." : nome || "cliente"} 👋</h1>
          {clienteCodigo && (
            <button
              onClick={copiarCodigo}
              className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              {clienteCodigo}
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
        <button className="relative grid h-11 w-11 place-items-center rounded-xl border border-border bg-card">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </button>
      </header>

      <div
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-[0_20px_50px_-20px_rgba(37,99,235,0.5)] bg-[#020D24] bg-cover bg-center"
        style={{ backgroundImage: "url('/fundo-plano.png')" }}
      >
        {/* Overlay escuro para garantir que o texto fique legível sobre a imagem */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/90 via-[#020617]/50 to-transparent" />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl z-0" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
              {planoNome ? `Plano ${planoNome}` : "Sem plano ativo"}
            </span>
            <Snowflake className="h-5 w-5 text-white drop-shadow-md" />
          </div>
          <div className="mt-6 text-3xl font-black drop-shadow-md">
            {plano ? (
              <>R$ {plano.price.toFixed(2).replace(".", ",")}<span className="text-base font-medium text-white/80">/mês</span></>
            ) : (
              <span className="text-xl font-bold text-white/80">Nenhum plano contratado</span>
            )}
          </div>
          {plano && (
            <div className="mt-1 text-xs font-medium text-white/90 drop-shadow-md">Atendimento em até {plano.sla}</div>
          )}
          <Link
            to="/planos"
            className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-white hover:text-white/80 drop-shadow-md transition"
          >
            Ver detalhes <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Snowflake} label="Equipamentos" value={loading ? "—" : String(equipamentosCount)} sub="cadastrados" tint="primary" />
        <StatCard icon={AlertCircle} label="Chamados abertos" value={loading ? "—" : String(chamadosAbertos)} sub="em andamento" tint="destructive" />
        <StatCard icon={Calendar} label="Histórico" value={loading ? "—" : String(historicoCount)} sub="atendimentos" tint="success" />
        <StatCard icon={Clock} label="SLA do plano" value={plano ? plano.sla : "—"} sub="tempo de atendimento" tint="warning" />
      </div>

      <Link
        to="/app/chamados/novo"
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-[0_20px_40px_-20px_rgba(37,99,235,0.5)] transition hover:bg-primary/90"
      >
        <Plus className="h-5 w-5" /> Solicitar atendimento
      </Link>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tint }: { icon: any; label: string; value: string; sub: string; tint: "primary" | "warning" | "destructive" | "success" }) {
  const tints: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${tints[tint]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}