import { supabase } from "@/lib/supabase";

export const NIVEIS_PRIVILEGIO = ["Administrador", "Supervisor", "Técnico"] as const;
export type NivelPrivilegio = (typeof NIVEIS_PRIVILEGIO)[number];

export interface MembroEquipe {
  userId: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  especialidade: string | null;
  crea: string | null;
  areaAtuacao: string | null;
  disponibilidade: string | null;
  nivelPrivilegio: NivelPrivilegio;
  ativo: boolean;
  status: "ativo";
}

export interface ConviteTecnico {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  especialidade: string | null;
  crea: string | null;
  areaAtuacao: string | null;
  nivelPrivilegio: NivelPrivilegio;
  status: "pendente";
}

export type MembroOuConvite = MembroEquipe | ConviteTecnico;

export interface MembroEquipeAtual {
  nome: string;
  nivelPrivilegio: NivelPrivilegio;
}

/**
 * Retorna nome e nível de privilégio do usuário de equipe autenticado no
 * momento (null se não houver sessão ou não for um membro da equipe).
 * Usado para diferenciar visualmente as telas de supervisor/admin das de
 * técnico comum.
 */
export async function getCurrentMembroEquipe(): Promise<MembroEquipeAtual | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles_tecnico")
    .select("nivel_privilegio, users!inner(nome)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    nome: (data.users as any).nome,
    nivelPrivilegio: data.nivel_privilegio as NivelPrivilegio,
  };
}

/**
 * Lista a equipe (admins/supervisores/técnicos): quem já concluiu o próprio
 * cadastro (profiles_tecnico) e quem ainda está com convite pendente
 * (aguardando a pessoa criar a própria conta em /cadastro com esse e-mail).
 */
export async function fetchEquipe(): Promise<MembroOuConvite[]> {
  const [{ data: membros, error: membrosError }, { data: convites, error: convitesError }] = await Promise.all([
    supabase
      .from("profiles_tecnico")
      .select("user_id, especialidade, crea, area_atuacao, disponibilidade, nivel_privilegio, ativo, users!inner(nome, email, telefone)"),
    supabase
      .from("convites_tecnico")
      .select("id, nome, email, telefone, especialidade, crea, area_atuacao, nivel_privilegio")
      .eq("usado", false),
  ]);

  if (membrosError) throw membrosError;
  if (convitesError) throw convitesError;

  const membrosMapeados: MembroEquipe[] = (membros || []).map((m: any) => ({
    userId: m.user_id,
    nome: m.users.nome,
    email: m.users.email,
    telefone: m.users.telefone,
    especialidade: m.especialidade,
    crea: m.crea,
    areaAtuacao: m.area_atuacao,
    disponibilidade: m.disponibilidade,
    nivelPrivilegio: m.nivel_privilegio,
    ativo: m.ativo,
    status: "ativo",
  }));

  const convitesMapeados: ConviteTecnico[] = (convites || []).map((c: any) => ({
    id: c.id,
    nome: c.nome,
    email: c.email,
    telefone: c.telefone,
    especialidade: c.especialidade,
    crea: c.crea,
    areaAtuacao: c.area_atuacao,
    nivelPrivilegio: c.nivel_privilegio,
    status: "pendente",
  }));

  return [...membrosMapeados, ...convitesMapeados];
}

export interface NovoConviteTecnico {
  nome: string;
  email: string;
  telefone: string;
  especialidade: string;
  crea: string;
  areaAtuacao: string;
  nivelPrivilegio: NivelPrivilegio;
}

/**
 * Cria um convite de equipe. Não cria login: a pessoa convidada precisa
 * criar a própria conta (mesmo e-mail) para o convite virar um cadastro
 * de verdade — veja `consumirConviteTecnico` em auth.ts.
 */
export async function criarConviteTecnico(input: NovoConviteTecnico): Promise<void> {
  const { error } = await supabase.from("convites_tecnico").insert({
    nome: input.nome,
    email: input.email,
    telefone: input.telefone || null,
    especialidade: input.especialidade || null,
    crea: input.crea || null,
    area_atuacao: input.areaAtuacao || null,
    nivel_privilegio: input.nivelPrivilegio,
  });

  if (error) throw error;
}

/**
 * Se existir um convite pendente para este e-mail, consome-o: cria `users`
 * (com o role correto) e `profiles_tecnico` para o usuário recém-autenticado.
 * Retorna true se um convite foi consumido (ou seja, esta pessoa é da
 * equipe, não cliente).
 */
export async function consumirConviteTecnico(userId: string, email: string, nomeFallback?: string): Promise<boolean> {
  const { data: convite, error: conviteError } = await supabase
    .from("convites_tecnico")
    .select("*")
    .eq("email", email)
    .eq("usado", false)
    .maybeSingle();

  if (conviteError) throw conviteError;
  if (!convite) return false;

  const role = convite.nivel_privilegio === "Administrador" ? "admin" : "tecnico";

  const { error: userError } = await supabase.from("users").insert({
    id: userId,
    nome: convite.nome || nomeFallback || email.split("@")[0],
    email,
    telefone: convite.telefone,
    role,
  });
  if (userError) throw userError;

  const { error: perfilError } = await supabase.from("profiles_tecnico").insert({
    user_id: userId,
    especialidade: convite.especialidade,
    crea: convite.crea,
    area_atuacao: convite.area_atuacao,
    nivel_privilegio: convite.nivel_privilegio,
  });
  if (perfilError) throw perfilError;

  await supabase.from("convites_tecnico").update({ usado: true }).eq("id", convite.id);
  return true;
}
