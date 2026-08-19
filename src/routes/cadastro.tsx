import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Check, MapPin, Sparkles, Eye, EyeOff, Loader2 } from "lucide-react";
import { PLANS, ZONA_SUL_BAIRROS } from "@/lib/brothers/mock-data";
import { supabase } from "@/lib/supabase";
import { savePendingCliente, provisionUserAfterSignup } from "@/lib/brothers/auth";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Criar conta — Brothers" }] }),
  component: CadastroPage,
});

function CadastroPage() {
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);

  const [cep, setCep] = useState("22.000-000");
  const [endereco, setEndereco] = useState("Rua das Laranjeiras");
  const [numero, setNumero] = useState("123");
  const [complemento, setComplemento] = useState("Apto 101");
  const [bairro, setBairro] = useState("Laranjeiras");
  
  const [plan, setPlan] = useState<string>("ouro");
  const [showAllPlans, setShowAllPlans] = useState(false);

  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);

  const navigate = useNavigate();

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate({ to: "/" });
    }
  };

  const isBairroValido = ZONA_SUL_BAIRROS.includes(bairro);

  // Encontra plano ativo
  const activePlanDetails = PLANS.find((p) => p.id === plan) || PLANS[2]; // Default Ouro

  const handleFinish = async () => {
    setSaving(true);
    setErro(null);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: senha,
      });
      if (signUpError) throw signUpError;

      const userId = signUpData.user?.id;
      if (!userId) throw new Error("Não foi possível criar o usuário.");

      const enderecoCompleto = `${endereco}, ${numero}${complemento ? ` - ${complemento}` : ""} - ${bairro}, CEP ${cep}`;
      const dadosCliente = { email, nome, telefone, endereco: enderecoCompleto, plano: activePlanDetails.id };

      if (!signUpData.session) {
        // Projeto exige confirmação de e-mail: sem sessão ativa o RLS bloqueia
        // o insert em `users`/`profiles_cliente`. Guardamos os dados e
        // finalizamos o cadastro no primeiro login, depois que o e-mail for
        // confirmado.
        savePendingCliente(dadosCliente);
        setAguardandoConfirmacao(true);
        return;
      }

      await provisionUserAfterSignup(userId, email, dadosCliente);

      navigate({ to: "/pagamento" });
    } catch (err: any) {
      console.error("Erro ao criar conta:", err);
      let mensagem = "Não foi possível criar sua conta. Tente novamente.";
      if (err.message?.includes("already registered") || err.code === "user_already_exists") {
        mensagem = "Este e-mail já está cadastrado.";
      } else if (err.message?.includes("Password") || err.code === "weak_password") {
        mensagem = "A senha precisa ter pelo menos 6 caracteres.";
      } else if (err.message) {
        mensagem = err.message;
      }
      setErro(mensagem);
    } finally {
      setSaving(false);
    }
  };

  if (aguardandoConfirmacao) {
    return (
      <main className="min-h-screen bg-slate-50 font-sans flex items-center justify-center py-6 px-4">
        <div className="w-full max-w-md bg-white rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col items-center justify-center gap-4 min-h-[780px] border border-gray-100 px-8 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Confirme seu e-mail</h1>
          <p className="text-slate-500 font-medium">
            Enviamos um link de confirmação para <span className="font-bold text-slate-700">{email}</span>. Depois de confirmar, faça login para continuar seu cadastro.
          </p>
          <a
            href="/login"
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-white font-bold shadow-[0_8px_25px_-6px_rgba(37,99,235,0.5)] hover:bg-blue-700 transition"
          >
            Ir para o login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans flex items-center justify-center py-6 px-4">
      {/* Mobile viewport mock card */}
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col min-h-[780px] border border-gray-100">
        
        {/* Header Navigation */}
        <header className="px-6 pt-8 pb-4 flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100/80 text-gray-700 hover:bg-slate-200/80 transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          {/* Custom Step Progress Bar */}
          <div className="flex items-center gap-2 flex-1 max-w-[160px] mx-auto relative justify-between">
            <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-[2px] bg-slate-200 z-0"></div>
            
            {/* Step Line Active Overlay */}
            <div 
              className="absolute left-1 top-1/2 -translate-y-1/2 h-[2px] bg-primary transition-all duration-300 z-0"
              style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}
            ></div>
            
            {[1, 2, 3].map((s) => {
              const isActive = s === step;
              const isCompleted = s < step;
              return (
                <div 
                  key={s} 
                  className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 ${
                    isActive 
                      ? "bg-primary text-white scale-110 shadow-[0_0_0_4px_rgba(37,99,235,0.2)]" 
                      : isCompleted 
                      ? "bg-primary text-white" 
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {s}
                </div>
              );
            })}
          </div>
          
          {/* Empty spacer for alignment */}
          <div className="w-10"></div>
        </header>

        {/* Content Container */}
        <div className="flex-1 px-6 pb-8 flex flex-col">
          
          {/* Form Step Headers */}
          <div className="mt-4 mb-8">
            {step === 1 && (
              <>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Vamos começar</h1>
                <p className="text-slate-500 mt-2 font-medium">Informe seus dados pessoais</p>
              </>
            )}
            {step === 2 && (
              <>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Endereço</h1>
                <p className="text-slate-500 mt-2 font-medium">
                  Informe seu endereço <br />
                  <span className="text-slate-400 text-xs font-normal">(Atendemos apenas Zona Sul)</span>
                </p>
              </>
            )}
            {step === 3 && (
              <>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Escolha seu plano</h1>
                <p className="text-slate-500 mt-2 font-medium">Selecione o plano ideal para você</p>
              </>
            )}
          </div>

          {/* Step Panels */}
          <div className="flex-1 flex flex-col justify-between">
            
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-700 ml-1">Nome completo</label>
                    <input 
                      type="text"
                      className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[15px] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-slate-300"
                      placeholder="Digite seu nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-700 ml-1">CPF</label>
                    <input 
                      type="text"
                      className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[15px] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-slate-300"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-700 ml-1">Telefone</label>
                    <input 
                      type="text"
                      className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[15px] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-slate-300"
                      placeholder="(21) 99999-9999"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-700 ml-1">E-mail</label>
                    <input
                      type="email"
                      className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[15px] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-slate-300"
                      placeholder="seuemail@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-700 ml-1">Senha</label>
                    <div className="relative">
                      <input
                        type={showSenha ? "text" : "password"}
                        className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-[15px] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-slate-300"
                        placeholder="Crie uma senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSenha(!showSenha)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full h-13 mt-8 rounded-full bg-primary text-white font-bold text-[16px] shadow-[0_8px_25px_-6px_rgba(37,99,235,0.5)] hover:bg-blue-700 transition active:scale-[0.98]"
                >
                  Continuar
                </button>
              </div>
            )}

            {/* Step 2: Address Info */}
            {step === 2 && (
              <div className="space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-700 ml-1">CEP</label>
                    <div className="relative">
                      <input 
                        type="text"
                        className="w-full h-12 rounded-2xl border border-slate-200 bg-white pl-4 pr-28 text-[15px] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-slate-300"
                        placeholder="22.000-000"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                      />
                      <button 
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#0066FF] hover:underline"
                      >
                        Buscar CEP
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-700 ml-1">Endereço</label>
                    <input 
                      type="text"
                      className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[15px] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-slate-300"
                      placeholder="Rua das Laranjeiras"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-gray-700 ml-1">Número</label>
                      <input 
                        type="text"
                        className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[15px] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-slate-300"
                        placeholder="123"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-gray-700 ml-1">Complemento</label>
                      <input 
                        type="text"
                        className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[15px] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-slate-300"
                        placeholder="Apto 101"
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-700 ml-1">Bairro</label>
                    <div className="relative">
                      <select 
                        className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[15px] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none text-slate-800"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                      >
                        {ZONA_SUL_BAIRROS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {isBairroValido && (
                    <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-100/50 px-4 py-2.5 text-[13px] font-bold text-emerald-600">
                      <MapPin className="h-4 w-4" />
                      <span>Endereço dentro da Zona Sul</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setStep(3)}
                  className="w-full h-13 mt-8 rounded-full bg-primary text-white font-bold text-[16px] shadow-[0_8px_25px_-6px_rgba(37,99,235,0.5)] hover:bg-blue-700 transition active:scale-[0.98]"
                >
                  Continuar
                </button>
              </div>
            )}

            {/* Step 3: Choose Plan */}
            {step === 3 && (
              <div className="space-y-5 flex-1 flex flex-col justify-between">
                
                <div className="space-y-5">
                  {/* Selected Plan Details Card */}
                  <div className="relative rounded-3xl bg-amber-50/50 border border-amber-100 p-6 flex flex-col items-center text-center shadow-[0_8px_30px_rgba(245,158,11,0.05)] overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-200/20 to-transparent rounded-full blur-lg pointer-events-none"></div>
                    
                    <span className="text-[13px] font-extrabold text-amber-700 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 fill-amber-700" />
                      Plano {activePlanDetails.name}
                    </span>
                    
                    <ul className="mt-4 space-y-3 w-full max-w-[260px] text-slate-700 font-semibold text-[14px] text-left mx-auto">
                      <li className="flex items-center gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                          <Check className="h-3 w-3 stroke-[3px]" />
                        </span>
                        <span>Até {activePlanDetails.equip} equipamentos</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                          <Check className="h-3 w-3 stroke-[3px]" />
                        </span>
                        <span>Atendimento em {activePlanDetails.sla}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                          <Check className="h-3 w-3 stroke-[3px]" />
                        </span>
                        <span>{activePlanDetails.preventivas} preventiva{activePlanDetails.preventivas > 1 ? "s" : ""} anual</span>
                      </li>
                    </ul>

                    {/* Price Tag styling matching mock */}
                    <div className="mt-8 mb-2 flex items-baseline justify-center text-slate-900">
                      <span className="text-lg font-bold">R$</span>
                      <span className="text-4xl font-black mx-1">
                        {activePlanDetails.price === 0 ? "Sob Consulta" : activePlanDetails.price.toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-sm font-semibold text-slate-400">/mês</span>
                    </div>
                  </div>

                  {/* Toggle All Plans Button */}
                  <div className="flex justify-center">
                    <button 
                      onClick={() => setShowAllPlans(!showAllPlans)}
                      className="inline-flex items-center justify-center rounded-full bg-slate-100 px-5 py-2.5 text-xs font-bold text-primary hover:bg-slate-200 transition"
                    >
                      {showAllPlans ? "Fechar lista de planos" : "Ver todos os planos"}
                    </button>
                  </div>

                  {/* Expandable plans selection grid */}
                  {showAllPlans && (
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-[190px] overflow-y-auto pr-1">
                      {PLANS.filter((p) => p.id !== "empresarial").map((p) => {
                        const isSelected = plan === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              setPlan(p.id);
                              setShowAllPlans(false);
                            }}
                            className={`p-3 rounded-2xl border text-left transition ${
                              isSelected 
                                ? "border-primary bg-primary/[0.04] shadow-[0_4px_12px_rgba(37,99,235,0.1)]" 
                                : "border-slate-100 bg-card hover:border-slate-200"
                            }`}
                          >
                            <div className="text-[13px] font-bold text-slate-800">{p.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Até {p.equip} equip.</div>
                            <div className="text-[13px] font-extrabold text-slate-950 mt-1">R$ {p.price.toFixed(2).replace(".", ",")}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {erro && <p className="text-sm text-destructive text-center">{erro}</p>}

                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="w-full h-13 mt-8 rounded-full bg-primary text-white font-bold text-[16px] shadow-[0_8px_25px_-6px_rgba(37,99,235,0.5)] hover:bg-blue-700 transition active:scale-[0.98] disabled:opacity-60"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Criando conta...
                    </span>
                  ) : (
                    "Continuar"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}