import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthCard, Field, inputCls, primaryBtn } from "@/components/brothers/AuthCard";
import { ESPECIALIDADES_TECNICO, ZONA_SUL_BAIRROS } from "@/lib/brothers/mock-data";
import { criarConviteTecnico, NIVEIS_PRIVILEGIO, type NivelPrivilegio } from "@/lib/brothers/equipe";

export const Route = createFileRoute("/cadastro-tecnico")({
  head: () => ({ meta: [{ title: "Cadastrar técnico — Brothers" }] }),
  component: CadastroTecnicoPage,
});

function CadastroTecnicoPage() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [crea, setCrea] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [especialidade, setEspecialidade] = useState(ESPECIALIDADES_TECNICO[0]);
  const [areaAtuacao, setAreaAtuacao] = useState(ZONA_SUL_BAIRROS[0]);
  const [nivelPrivilegio, setNivelPrivilegio] = useState<NivelPrivilegio>("Técnico");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      await criarConviteTecnico({ nome, crea, telefone, email, especialidade, areaAtuacao, nivelPrivilegio });
      navigate({ to: "/lista-tecnicos" });
    } catch (err: any) {
      console.error("Erro ao criar convite de técnico:", err);
      setErro(err.message || "Não foi possível criar o convite.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AuthCard title="Cadastrar técnico" subtitle="Convide um novo membro da equipe" back="/lista-tecnicos">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
          A pessoa convidada precisa criar a própria conta em <strong>Criar conta</strong> usando este mesmo e-mail — o acesso e o nível de privilégio abaixo são aplicados automaticamente nesse momento.
        </p>

        <Field label="Nome completo">
          <input className={inputCls} placeholder="Digite o nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </Field>

        <Field label="E-mail">
          <input type="email" className={inputCls} placeholder="tecnico@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>

        <Field label="Telefone">
          <input className={inputCls} placeholder="(21) 99999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </Field>

        <Field label="CREA / registro profissional">
          <input className={inputCls} placeholder="Opcional" value={crea} onChange={(e) => setCrea(e.target.value)} />
        </Field>

        <Field label="Especialidade">
          <select className={inputCls} value={especialidade} onChange={(e) => setEspecialidade(e.target.value)}>
            {ESPECIALIDADES_TECNICO.map((esp) => (
              <option key={esp} value={esp}>{esp}</option>
            ))}
          </select>
        </Field>

        <Field label="Área de atuação">
          <select className={inputCls} value={areaAtuacao} onChange={(e) => setAreaAtuacao(e.target.value)}>
            {ZONA_SUL_BAIRROS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </Field>

        <Field label="Nível de privilégio">
          <select className={inputCls} value={nivelPrivilegio} onChange={(e) => setNivelPrivilegio(e.target.value as NivelPrivilegio)}>
            {NIVEIS_PRIVILEGIO.map((nivel) => (
              <option key={nivel} value={nivel}>{nivel}</option>
            ))}
          </select>
        </Field>

        {erro && <p className="text-sm text-destructive">{erro}</p>}

        <button className={primaryBtn + " mt-4"} type="submit" disabled={salvando}>
          {salvando ? "Enviando convite..." : "Convidar técnico"}
        </button>
      </form>
    </AuthCard>
  );
}
