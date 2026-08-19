import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthCard, Field, inputCls, primaryBtn } from "@/components/brothers/AuthCard";
import { ZONA_SUL_BAIRROS } from "@/lib/brothers/mock-data";

export const Route = createFileRoute("/cadastro-cliente")({
  head: () => ({ meta: [{ title: "Cadastrar cliente — Brothers" }] }),
  component: CadastroClientePage,
});

function CadastroClientePage() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState(ZONA_SUL_BAIRROS[0]);

  return (
    <AuthCard title="Cadastrar cliente" subtitle="Crie o acesso de um novo cliente" back="/lista-clientes">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/lista-clientes" });
        }}
      >
        <Field label="Nome completo">
          <input className={inputCls} placeholder="Digite o nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        </Field>

        <Field label="CPF ou CNPJ">
          <input className={inputCls} placeholder="000.000.000-00" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} />
        </Field>

        <Field label="Telefone">
          <input className={inputCls} placeholder="(21) 99999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </Field>

        <Field label="E-mail">
          <input type="email" className={inputCls} placeholder="cliente@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>

        <Field label="CEP">
          <input className={inputCls} placeholder="22.000-000" value={cep} onChange={(e) => setCep(e.target.value)} />
        </Field>

        <Field label="Endereço">
          <input className={inputCls} placeholder="Rua das Laranjeiras" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Número">
            <input className={inputCls} placeholder="123" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </Field>
          <Field label="Complemento">
            <input className={inputCls} placeholder="Apto 101" value={complemento} onChange={(e) => setComplemento(e.target.value)} />
          </Field>
        </div>

        <Field label="Bairro" hint="Atendemos apenas a Zona Sul">
          <select className={inputCls} value={bairro} onChange={(e) => setBairro(e.target.value)}>
            {ZONA_SUL_BAIRROS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </Field>

        <button className={primaryBtn + " mt-4"} type="submit">Cadastrar cliente</button>
      </form>
    </AuthCard>
  );
}
