import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Camera, Loader2, X } from "lucide-react";
import { Field, inputCls, primaryBtn } from "@/components/brothers/AuthCard";
import { TIPOS_EQUIPAMENTO, AMBIENTES_EQUIPAMENTO, MARCAS_EQUIPAMENTO, MODELOS_EQUIPAMENTO, BTUS_EQUIPAMENTO } from "@/lib/brothers/mock-data";
import { supabase } from "@/lib/supabase";
import { requireCurrentClienteId } from "@/lib/brothers/auth";

export const Route = createFileRoute("/app/equipamentos/novo")({
  head: () => ({ meta: [{ title: "Novo equipamento — Brothers" }] }),
  component: NovoEquipamentoPage,
});

function NovoEquipamentoPage() {
  const [tipo, setTipo] = useState(TIPOS_EQUIPAMENTO[0]);
  const [ambiente, setAmbiente] = useState(AMBIENTES_EQUIPAMENTO[0]);
  const [marca, setMarca] = useState(MARCAS_EQUIPAMENTO[0]);
  const [modelo, setModelo] = useState(MODELOS_EQUIPAMENTO[0]);
  const [btus, setBtus] = useState(String(BTUS_EQUIPAMENTO[0]));
  const [numeroSerie, setNumeroSerie] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErro(null);
    try {
      const clienteId = await requireCurrentClienteId();

      let fotoUrl: string | null = null;
      if (foto) {
        const path = `${clienteId}/${Date.now()}-${foto.name}`;
        const { error: uploadError } = await supabase.storage.from("equipamentos").upload(path, foto);
        if (uploadError) {
          console.error("Erro ao enviar foto do equipamento:", uploadError);
        } else {
          const { data: publicUrl } = supabase.storage.from("equipamentos").getPublicUrl(path);
          fotoUrl = publicUrl.publicUrl;
        }
      }

      const { data, error } = await supabase
        .from("equipamentos")
        .insert({
          cliente_id: clienteId,
          nome: ambiente,
          tipo,
          ambiente,
          marca,
          modelo,
          btus: Number(btus),
          numero_serie: numeroSerie || null,
          foto_url: fotoUrl,
        })
        .select("id")
        .single();

      if (error) throw error;

      navigate({ to: "/app/equipamentos/$id", params: { id: data.id } });
    } catch (err: any) {
      console.error("Erro ao cadastrar equipamento:", err);
      setErro(err.message || "Não foi possível cadastrar o equipamento. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <Link to="/app/equipamentos" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </header>
      <div>
        <h1 className="text-2xl font-black tracking-tight">Novo equipamento</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cadastre os dados do seu ar condicionado</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Tipo de equipamento">
          <select className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_EQUIPAMENTO.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>

        <Field label="Ambiente">
          <select className={inputCls} value={ambiente} onChange={(e) => setAmbiente(e.target.value)}>
            {AMBIENTES_EQUIPAMENTO.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </Field>

        <Field label="Marca">
          <select className={inputCls} value={marca} onChange={(e) => setMarca(e.target.value)}>
            {MARCAS_EQUIPAMENTO.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>

        <Field label="Modelo/Categoria">
          <select className={inputCls} value={modelo} onChange={(e) => setModelo(e.target.value)}>
            {MODELOS_EQUIPAMENTO.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>

        <Field label="Capacidade">
          <select className={inputCls} value={btus} onChange={(e) => setBtus(e.target.value)}>
            {BTUS_EQUIPAMENTO.map((b) => (
              <option key={b} value={b}>{b.toLocaleString()} BTUs</option>
            ))}
          </select>
        </Field>

        <Field label="Número de série">
          <input className={inputCls} placeholder="LG123456789" value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} />
        </Field>

        <Field label="Foto do equipamento" hint="Opcional, mas recomendado">
          {fotoPreview ? (
            <div className="relative h-28 w-28">
              <img src={fotoPreview} alt="Prévia do equipamento" className="h-28 w-28 rounded-xl border border-border object-cover" />
              <button
                type="button"
                onClick={() => {
                  setFoto(null);
                  setFotoPreview(null);
                }}
                className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-destructive text-destructive-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex h-28 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground transition hover:border-primary/40 hover:text-primary">
              <Camera className="h-5 w-5" />
              Adicionar foto
              <input type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
            </label>
          )}
        </Field>

        {erro && <p className="text-sm text-destructive">{erro}</p>}

        <button className={primaryBtn} type="submit" disabled={saving}>
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Cadastrando...
            </span>
          ) : (
            "Cadastrar equipamento"
          )}
        </button>
      </form>
    </div>
  );
}
