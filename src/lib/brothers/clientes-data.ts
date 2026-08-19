import { supabase } from "@/lib/supabase";

export interface ClienteListado {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  codigo: number | null;
  plano: string | null;
  endereco: string | null;
}

export async function fetchClientes(): Promise<ClienteListado[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, nome, email, telefone, profiles_cliente!inner(codigo, plano, endereco)")
    .order("nome", { ascending: true });

  if (error) throw error;

  return (data || []).map((row: any) => {
    const perfil = Array.isArray(row.profiles_cliente) ? row.profiles_cliente[0] : row.profiles_cliente;
    return {
      id: row.id,
      nome: row.nome,
      email: row.email,
      telefone: row.telefone,
      codigo: perfil?.codigo ?? null,
      plano: perfil?.plano ?? null,
      endereco: perfil?.endereco ?? null,
    };
  });
}

export async function fetchCliente(id: string): Promise<ClienteListado | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, nome, email, telefone, profiles_cliente!inner(codigo, plano, endereco)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const perfil = Array.isArray((data as any).profiles_cliente) ? (data as any).profiles_cliente[0] : (data as any).profiles_cliente;
  return {
    id: data.id,
    nome: data.nome,
    email: data.email,
    telefone: data.telefone,
    codigo: perfil?.codigo ?? null,
    plano: perfil?.plano ?? null,
    endereco: perfil?.endereco ?? null,
  };
}

export interface EquipamentoListado {
  id: string;
  codigo: number | null;
  nome: string;
  marca: string | null;
  modelo: string | null;
  btus: number | null;
  fotoUrl: string | null;
  confirmadoCliente: boolean;
}

export async function fetchEquipamentosDoCliente(clienteId: string): Promise<EquipamentoListado[]> {
  const { data, error } = await supabase
    .from("equipamentos")
    .select("id, codigo, nome, marca, modelo, btus, foto_url, confirmado_cliente")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((e: any) => ({
    id: e.id,
    codigo: e.codigo,
    nome: e.nome,
    marca: e.marca,
    modelo: e.modelo,
    btus: e.btus,
    fotoUrl: e.foto_url,
    confirmadoCliente: e.confirmado_cliente,
  }));
}

export interface NovoEquipamentoCliente {
  clienteId: string;
  tipo: string;
  ambiente: string;
  marca: string;
  modelo: string;
  btus: number;
  numeroSerie: string;
  fotoUrl: string | null;
}

export async function criarEquipamentoParaCliente(input: NovoEquipamentoCliente): Promise<string> {
  const { data, error } = await supabase
    .from("equipamentos")
    .insert({
      cliente_id: input.clienteId,
      nome: input.ambiente,
      tipo: input.tipo,
      ambiente: input.ambiente,
      marca: input.marca,
      modelo: input.modelo,
      btus: input.btus,
      numero_serie: input.numeroSerie || null,
      foto_url: input.fotoUrl,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export interface EquipamentoParaFinalizar {
  id: string;
  clienteId: string;
  clienteNome: string;
  nome: string;
  marca: string | null;
  modelo: string | null;
  ambiente: string | null;
  confirmadoCliente: boolean;
}

export async function fetchEquipamentoParaFinalizar(id: string): Promise<EquipamentoParaFinalizar | null> {
  const { data, error } = await supabase
    .from("equipamentos")
    .select("id, cliente_id, nome, marca, modelo, ambiente, confirmado_cliente, users(nome)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    clienteId: data.cliente_id,
    clienteNome: (data.users as any)?.nome || "Cliente",
    nome: data.nome,
    marca: data.marca,
    modelo: data.modelo,
    ambiente: data.ambiente,
    confirmadoCliente: data.confirmado_cliente,
  };
}

export interface EquipamentoPendente {
  id: string;
  codigo: number | null;
  nome: string;
  marca: string | null;
  modelo: string | null;
  clienteId: string;
  clienteNome: string;
  createdAt: string;
}

/**
 * Todos os equipamentos ainda não confirmados por um técnico (cadastrados
 * pelo próprio cliente, ou pelo técnico mas sem assinatura colhida ainda),
 * de qualquer cliente — usado no card "Cadastro de Equipamento" da agenda.
 */
export async function fetchEquipamentosPendentes(): Promise<EquipamentoPendente[]> {
  const { data, error } = await supabase
    .from("equipamentos")
    .select("id, codigo, nome, marca, modelo, cliente_id, created_at, users(nome)")
    .eq("confirmado_cliente", false)
    .not("cliente_id", "is", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []).map((e: any) => ({
    id: e.id,
    codigo: e.codigo,
    nome: e.nome,
    marca: e.marca,
    modelo: e.modelo,
    clienteId: e.cliente_id,
    clienteNome: e.users?.nome || "Cliente",
    createdAt: e.created_at,
  }));
}

export interface EquipamentoDetalheTecnico {
  id: string;
  codigo: number | null;
  clienteId: string;
  clienteNome: string;
  nome: string;
  tipo: string | null;
  ambiente: string | null;
  marca: string | null;
  modelo: string | null;
  btus: number | null;
  numeroSerie: string | null;
  fotoUrl: string | null;
  createdAt: string;
  confirmadoCliente: boolean;
  confirmadoEm: string | null;
}

/** Mesma tela de detalhe que o cliente vê, usada também pelo técnico pra consulta. */
export async function fetchEquipamentoDetalheTecnico(id: string): Promise<EquipamentoDetalheTecnico | null> {
  const { data, error } = await supabase
    .from("equipamentos")
    .select("id, codigo, cliente_id, nome, tipo, ambiente, marca, modelo, btus, numero_serie, foto_url, created_at, confirmado_cliente, confirmado_em, users(nome)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    codigo: data.codigo,
    clienteId: data.cliente_id,
    clienteNome: (data.users as any)?.nome || "Cliente",
    nome: data.nome,
    tipo: data.tipo,
    ambiente: data.ambiente,
    marca: data.marca,
    modelo: data.modelo,
    btus: data.btus,
    numeroSerie: data.numero_serie,
    fotoUrl: data.foto_url,
    createdAt: data.created_at,
    confirmadoCliente: data.confirmado_cliente,
    confirmadoEm: data.confirmado_em,
  };
}

export interface EtiquetaEquipamento {
  id: string;
  clienteId: string;
  codigo: number | null;
  nome: string;
  marca: string | null;
  modelo: string | null;
  btus: number | null;
  ambiente: string | null;
  clienteNome: string;
}

export async function fetchEtiquetaEquipamento(id: string): Promise<EtiquetaEquipamento | null> {
  const { data, error } = await supabase
    .from("equipamentos")
    .select("id, cliente_id, codigo, nome, marca, modelo, btus, ambiente, users(nome)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    clienteId: data.cliente_id,
    codigo: data.codigo,
    nome: data.nome,
    marca: data.marca,
    modelo: data.modelo,
    btus: data.btus,
    ambiente: data.ambiente,
    clienteNome: (data.users as any)?.nome || "Cliente",
  };
}
