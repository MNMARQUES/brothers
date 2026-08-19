import { createFileRoute } from "@tanstack/react-router";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ensureClienteForCurrentUser, getCurrentUserRole, homeRouteForRole } from "@/lib/brothers/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Brothers — Entrar" },
    ],
  }),
  component: MobileLoginSplash,
});

function MobileLoginSplash() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
      await ensureClienteForCurrentUser(email);
      const role = await getCurrentUserRole();
      navigate({ to: homeRouteForRole(role) });
    } catch (err: any) {
      console.error("Erro ao entrar:", err);
      const mensagem = err.message?.includes("Email not confirmed")
        ? "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada."
        : "E-mail ou senha inválidos.";
      setErro(mensagem);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{ backgroundImage: "url('/fundo_login.png')" }}
      className="relative flex min-h-[100dvh] w-full flex-col bg-[#020617] bg-cover bg-center bg-no-repeat font-sans overflow-y-auto overflow-x-hidden"
    >
      {/* Película escura para dar contraste ao logotipo e elementos */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none z-0"></div>

      {/* =========================================
          HERO SECTION
          ========================================= */}
      <section className="relative flex flex-col items-center justify-start pt-16 pb-8 w-full z-10">

        {/* Logo Brothers */}
        <div className="relative z-10 flex items-center gap-3 mb-10">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-[#0066FF]">
            <circle cx="12" cy="2" r="2.5" />
            <circle cx="12" cy="22" r="2.5" />
            <circle cx="2" cy="12" r="2.5" />
            <circle cx="22" cy="12" r="2.5" />
            <circle cx="4.9" cy="4.9" r="2" />
            <circle cx="19.1" cy="4.9" r="2" />
            <circle cx="4.9" cy="19.1" r="2" />
            <circle cx="19.1" cy="19.1" r="2" />
          </svg>
          <div className="flex flex-col justify-center">
            <span className="text-3xl font-bold tracking-tight text-white leading-none mb-1">Brothers</span>
            <span className="text-[9px] font-bold tracking-[0.25em] text-[#0066FF] uppercase leading-none">Manutenção Premium</span>
          </div>
        </div>

        {/* Ilustração do Ar Condicionado 3D */}
        <div className="relative z-10 mt-auto mb-2 w-full flex justify-center px-8">
          <div className="relative h-20 w-full max-w-[340px] rounded-[16px] bg-gradient-to-b from-[#ffffff] to-[#f4f4f4] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] flex flex-col z-10">

            {/* Top indent */}
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-gray-200/60"></div>

            {/* Main body & Logo AC */}
            <div className="flex-1 px-4 py-1 flex items-center justify-center">
               <span className="text-[7px] font-bold tracking-[0.3em] text-gray-300">BROTHERS</span>
            </div>

            {/* Bottom flap & Blue Glow (LED) */}
            <div className="h-[18px] w-full rounded-b-[16px] border-t border-gray-200 bg-[#e8e8e8] flex items-start justify-center overflow-hidden relative">
               <div className="absolute top-1 w-4/5 h-[3px] rounded-full bg-[#0066FF] shadow-[0_2px_15px_6px_rgba(0,102,255,0.8)]"></div>
            </div>
          </div>
          {/* Efeito de luz do AC no fundo (fora do card do AC para nao ser cortado) */}
          <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-full max-w-[400px] h-32 bg-[conic-gradient(from_180deg_at_50%_0%,rgba(0,102,255,0.1)_0deg,transparent_60deg,transparent_300deg,rgba(0,102,255,0.1)_360deg)] blur-xl pointer-events-none"></div>
        </div>
      </section>

      {/* =========================================
          LOGIN CARD
          ========================================= */}
      <section className="relative z-20 w-[92%] max-w-md mx-auto bg-white rounded-[32px] shadow-[0_15px_50px_rgba(0,0,0,0.5)] px-6 sm:px-8 pt-8 pb-8 flex flex-col mb-16">
        <div className="w-full flex flex-col">
          <div className="mb-6">
            <h1 className="text-[26px] font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              Bem-vindo de volta! <span className="text-2xl">👋</span>
            </h1>
            <p className="text-[15px] text-gray-500 mt-1">Faça login para continuar</p>
          </div>

          <form className="flex flex-col gap-5 flex-1" onSubmit={handleSubmit}>
            {/* E-mail */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-gray-700 ml-4">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="seuemail@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-[52px] pl-14 pr-6 rounded-full border border-gray-200/80 bg-white text-[15px] focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-gray-700 ml-4">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  className="w-full h-[52px] pl-14 pr-14 rounded-full border border-gray-200/80 bg-white text-[15px] focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Links Auxiliares */}
            <div className="flex items-center justify-end mt-1 px-4">
              <a href="#" className="text-[13px] font-bold text-[#0066FF] hover:underline">
                Esqueci minha senha
              </a>
            </div>

            {erro && <p className="px-4 text-[13px] font-semibold text-red-600">{erro}</p>}

            {/* Botão Entrar */}
            <div className="mt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] rounded-full bg-[#0066FF] text-white font-bold text-[15px] shadow-[0_8px_20px_-6px_rgba(0,102,255,0.6)] hover:bg-[#0052cc] transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Entrando...
                  </span>
                ) : (
                  "Entrar"
                )}
              </button>
            </div>

            <div className="mt-auto pt-6 pb-2 text-center">
              <span className="text-[14px] text-gray-500 font-medium">
                Ainda não tem conta?{' '}
                <Link to="/cadastro" className="text-[#0066FF] font-bold hover:underline">
                  Criar conta
                </Link>
              </span>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
