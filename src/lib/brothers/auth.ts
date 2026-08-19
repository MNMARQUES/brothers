import { supabase } from "@/lib/supabase";
import { consumirConviteTecnico } from "@/lib/brothers/equipe";

export interface ClienteAtual {
  id: string;
  codigo: number | null;
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  plano: string | null;
}

/**
 * Retorna os dados do cliente vinculado ao usuário autenticado no momento.
 * Retorna null se não houver sessão ativa ou o usuário não for um cliente
 * (ex.: é um membro da equipe — técnico/admin).
 */
export async function getCurrentCliente(): Promise<ClienteAtual | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, nome, telefone, email, profiles_cliente(codigo, endereco, plano)")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const perfil = Array.isArray(data.profiles_cliente) ? data.profiles_cliente[0] : data.profiles_cliente;
  if (!perfil) return null;

  return {
    id: data.id,
    codigo: perfil.codigo ?? null,
    nome: data.nome,
    telefone: data.telefone,
    email: data.email,
    endereco: perfil.endereco ?? null,
    plano: perfil.plano ?? null,
  };
}

/** Mesma coisa que getCurrentCliente, mas lança erro se não houver cliente. */
export async function requireCurrentClienteId(): Promise<string> {
  const cliente = await getCurrentCliente();
  if (!cliente) throw new Error("Nenhum cliente vinculado ao usuário autenticado.");
  return cliente.id;
}

export type UserRole = "cliente" | "tecnico" | "admin";

/**
 * Retorna o papel (`role`) do usuário autenticado no momento, ou null se
 * não houver sessão ou o registro em `users` ainda não existir.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data, error } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return data?.role ?? null;
}

/** Para onde a pessoa deve ser levada depois de autenticar, de acordo com o papel. */
export function homeRouteForRole(role: UserRole | null): "/app" | "/tecnico" {
  return role === "tecnico" || role === "admin" ? "/tecnico" : "/app";
}

export async function signOut() {
  await supabase.auth.signOut();
}

export interface PendingCliente {
  email: string;
  nome: string;
  telefone: string;
  endereco: string;
  plano: string;
}

const PENDING_KEY = "brothers_pending_cliente";

/**
 * Guarda os dados coletados no cadastro enquanto a confirmação de e-mail
 * (quando exigida pelo projeto Supabase) ainda não gerou uma sessão ativa —
 * sem sessão não é possível inserir em `users`/`profiles_cliente` por causa
 * do RLS.
 */
export function savePendingCliente(data: PendingCliente) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(data));
}

export function getPendingCliente(email: string): PendingCliente | null {
  const raw = localStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingCliente;
    return parsed.email === email ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPendingCliente() {
  localStorage.removeItem(PENDING_KEY);
}

/**
 * Cria o registro em `users`+`profiles_cliente`/`profiles_tecnico` para o
 * usuário já autenticado (userId/email), se ainda não existir.
 *
 * Primeiro verifica se há um convite de equipe pendente para esse e-mail
 * (criado por um admin em /cadastro-tecnico): se houver, a conta vira
 * técnico/admin com o nível de privilégio definido no convite. Caso
 * contrário, vira cliente — usando os dados de `pending` quando disponíveis.
 */
export async function provisionUserAfterSignup(userId: string, email: string, pending: PendingCliente | null): Promise<void> {
  const virouEquipe = await consumirConviteTecnico(userId, email, pending?.nome);
  if (virouEquipe) return;

  const { error: userError } = await supabase.from("users").insert({
    id: userId,
    nome: pending?.nome || email.split("@")[0] || "Cliente",
    telefone: pending?.telefone || null,
    email: pending?.email || email,
    role: "cliente",
  });
  if (userError) throw userError;

  const { error: perfilError } = await supabase.from("profiles_cliente").insert({
    user_id: userId,
    endereco: pending?.endereco || null,
    plano: pending?.plano || null,
  });
  if (perfilError) throw perfilError;
}

/**
 * Garante que o usuário autenticado no momento tem um registro em
 * `users`. Chamada no login e no guard do app — cobre o caso em que o
 * cadastro foi interrompido pela confirmação de e-mail (ver
 * savePendingCliente) e o provisionamento só pôde acontecer agora.
 */
export async function ensureClienteForCurrentUser(pendingLookupEmail: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return;

  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return;

  const pending = getPendingCliente(pendingLookupEmail);
  await provisionUserAfterSignup(user.id, user.email || pendingLookupEmail, pending);
  clearPendingCliente();
}
