import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Camera, Plus, Loader2, AlertCircle } from "lucide-react";
import { Field, inputCls, primaryBtn } from "@/components/brothers/AuthCard";
import { supabase } from "@/lib/supabase";
import { requireCurrentClienteId } from "@/lib/brothers/auth";

export const Route = createFileRoute("/app/chamados/novo")({
  head: () => ({ meta: [{ title: "Nova solicitação — Brothers" }] }),
  component: NovoChamadoPage,
});

const PROBLEMAS = ["Não gela", "Não liga", "Vazamento", "Ruído", "Mau cheiro", "Outro"];

interface EquipamentoDB {
  id: string;
  nome: string;
  marca?: string;
  modelo?: string;
  foto_url?: string | null;
}

function NovoChamadoPage() {
  const [problema, setProblema] = useState("Não gela");
  const [descricao, setDescricao] = useState("");
  const [equipamentos, setEquipamentos] = useState<EquipamentoDB[]>([]);
  const [selectedEquipId, setSelectedEquipId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();
  const selectedEquip = equipamentos.find((e) => e.id === selectedEquipId);

  useEffect(() => {
    async function loadEquipamentos() {
      try {
        const clienteId = await requireCurrentClienteId();

        const { data, error } = await supabase
          .from("equipamentos")
          .select("id, nome, marca, modelo, foto_url")
          .eq("cliente_id", clienteId);

        if (error) throw error;

        if (data && data.length > 0) {
          setEquipamentos(data);
          setSelectedEquipId(data[0].id);
        }
      } catch (err: any) {
        console.error("Erro ao carregar equipamentos:", err);
        setErro(err.message || "Não foi possível carregar seus equipamentos.");
      } finally {
        setLoading(false);
      }
    }

    loadEquipamentos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipId) return;

    setSaving(true);
    setErro(null);
    try {
      const descricaoCompleta = `[${problema}] ${descricao || "Sem observações adicionais"}`;

      const { data, error } = await supabase
        .from("ordens_servico")
        .insert({
          equipamento_id: selectedEquipId,
          descricao_problema: descricaoCompleta,
          status: "Aberto",
        })
        .select("id, numero_os")
        .single();

      if (error) throw error;

      navigate({ to: "/app/chamados/$id", params: { id: data.id } });
    } catch (err: any) {
      console.error("Erro ao criar ordem de serviço no banco:", err);
      setErro(err.message || "Não foi possível enviar a solicitação. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando equipamentos...</p>
      </div>
    );
  }

  if (equipamentos.length === 0) {
    return (
      <div className="space-y-5">
        <header className="flex items-center justify-between">
          <Link to="/app" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </header>
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          {erro ? (
            <p className="mt-3 text-sm text-destructive">{erro}</p>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted-foreground">Cadastre um equipamento antes de abrir um chamado</p>
              <Link to="/app/equipamentos/novo" className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Cadastrar equipamento
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <Link to="/app" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </header>
      <div>
        <h1 className="text-2xl font-black tracking-tight">Novo atendimento</h1>
        <p className="mt-1 text-sm text-muted-foreground">Selecione o equipamento e descreva o problema</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Equipamento">
          <div className="flex items-center gap-3">
            {selectedEquip?.foto_url && (
              <img
                src={selectedEquip.foto_url}
                alt={selectedEquip.nome}
                className="h-11 w-11 shrink-0 rounded-lg border border-border object-cover"
              />
            )}
            <select
              className={inputCls}
              value={selectedEquipId}
              onChange={(e) => setSelectedEquipId(e.target.value)}
            >
              {equipamentos.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome} {e.marca ? `(${e.marca})` : ""}
                </option>
              ))}
            </select>
          </div>
        </Field>

        <Field label="Problema">
          <div className="flex flex-wrap gap-2">
            {PROBLEMAS.map((p) => {
              const active = problema === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProblema(p)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Descrição">
          <textarea
            className={inputCls + " h-28 py-3"}
            placeholder="Ar condicionado não está gelando adequadamente desde ontem."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </Field>

        <Field label="Adicionar fotos">
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <button key={i} type="button" className="grid h-20 w-20 place-items-center rounded-xl border border-dashed border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary">
                {i === 3 ? <Plus className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
              </button>
            ))}
          </div>
        </Field>

        {erro && <p className="text-sm text-destructive">{erro}</p>}

        <button className={primaryBtn} type="submit" disabled={saving}>
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
            </span>
          ) : (
            "Enviar solicitação"
          )}
        </button>
      </form>
    </div>
  );
}
