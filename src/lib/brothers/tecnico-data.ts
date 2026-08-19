import { supabase } from "@/lib/supabase";

export interface AtendimentoTecnico {
  id: string;
  numeroOs: number | string;
  hora: string;
  dataAbertura: string;
  periodo: "Manhã" | "Tarde";
  status: string;
  statusRaw: string;
  tipo: string;
  cliente: string;
  telefone: string;
  endereco: string;
  bairro: string;
  tecnicoId: string | null;
  tecnicoNome: string | null;
  problema: string;
  equipamento: {
    codigo: number | null;
    marca: string;
    modelo: string;
    btus: number | null;
    ambiente: string;
    fotoUrl: string | null;
  };
}

// A tabela ordens_servico guarda o status em português "administrativo"
// (Aberto/Em Andamento/Concluído/Cancelado). O app do técnico usa rótulos
// operacionais (Agendado/Em atendimento/Resolvido/Aguardando peça). Convertemos
// nos dois sentidos para não precisar mudar o schema nem o restante do app.
const STATUS_DB_TO_LABEL: Record<string, string> = {
  Aberto: "Agendado",
  "Em Andamento": "Em atendimento",
  Concluído: "Resolvido",
  Cancelado: "Cancelado",
};

const STATUS_LABEL_TO_DB: Record<string, string> = {
  Agendado: "Aberto",
  "Em atendimento": "Em Andamento",
  Resolvido: "Concluído",
  "Aguardando peça": "Aguardando peça",
  Cancelado: "Cancelado",
};

export function statusDbToLabel(status: string): string {
  return STATUS_DB_TO_LABEL[status] || status;
}

export function statusLabelToDb(label: string): string {
  return STATUS_LABEL_TO_DB[label] || label;
}

function extrairBairro(endereco: string | null): string {
  if (!endereco) return "";
  const partes = endereco.split(",").map((p) => p.trim());
  return partes[partes.length - 1] || endereco;
}

function mapRow(os: any): AtendimentoTecnico {
  const equip = os.equipamentos || {};
  const cliente = equip.users || {};
  const perfilCliente = (Array.isArray(cliente.profiles_cliente) ? cliente.profiles_cliente[0] : cliente.profiles_cliente) || {};
  const tecnico = os.tecnicos || null;
  const dataEntrada = new Date(os.data_entrada);
  const problemaMatch = /^\[(.+?)\]\s*(.*)$/.exec(os.descricao_problema || "");

  return {
    id: os.id,
    numeroOs: os.numero_os ?? os.id.substring(0, 8),
    hora: dataEntrada.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    dataAbertura: dataEntrada.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    periodo: dataEntrada.getHours() < 12 ? "Manhã" : "Tarde",
    status: statusDbToLabel(os.status),
    statusRaw: os.status,
    tipo: "Corretiva",
    cliente: cliente.nome || "Cliente",
    telefone: cliente.telefone || "",
    endereco: perfilCliente.endereco || "",
    bairro: extrairBairro(perfilCliente.endereco),
    tecnicoId: os.tecnico_id,
    tecnicoNome: tecnico?.nome || null,
    problema: problemaMatch ? problemaMatch[2] || problemaMatch[1] : os.descricao_problema,
    equipamento: {
      codigo: equip.codigo ?? null,
      marca: equip.marca || "",
      modelo: equip.modelo || "",
      btus: equip.btus ?? null,
      ambiente: equip.ambiente || equip.nome || "",
      fotoUrl: equip.foto_url || null,
    },
  };
}

const SELECT_ATENDIMENTO = `
  id,
  numero_os,
  status,
  descricao_problema,
  data_entrada,
  tecnico_id,
  tecnicos ( nome, telefone ),
  equipamentos!inner (
    codigo, nome, marca, modelo, btus, ambiente, foto_url,
    users!inner ( nome, telefone, profiles_cliente ( endereco ) )
  )
`;

export async function fetchAtendimentosTecnico(): Promise<AtendimentoTecnico[]> {
  const { data, error } = await supabase
    .from("ordens_servico")
    .select(SELECT_ATENDIMENTO)
    .order("data_entrada", { ascending: true });

  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function fetchAtendimentoTecnico(id: string): Promise<AtendimentoTecnico | null> {
  const { data, error } = await supabase
    .from("ordens_servico")
    .select(SELECT_ATENDIMENTO)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function atualizarAtendimentoTecnico(
  id: string,
  updates: { statusLabel?: string; servicoRealizado?: string }
) {
  const payload: Record<string, any> = {};
  if (updates.statusLabel) payload.status = statusLabelToDb(updates.statusLabel);
  if (updates.servicoRealizado !== undefined) payload.servico_realizado = updates.servicoRealizado;
  if (updates.statusLabel === "Resolvido") payload.data_saida = new Date().toISOString();

  const { error } = await supabase.from("ordens_servico").update(payload).eq("id", id);
  if (error) throw error;
}

export interface TecnicoAtual {
  id: string;
  nome: string;
}

/**
 * Sem autenticação própria para o app do técnico (compartilha a sessão do
 * cliente logado): usa o primeiro técnico cadastrado na tabela legada
 * `tecnicos`. O cadastro de equipe com nível de privilégio real
 * (users/profiles_tecnico) vive em `equipe.ts`; migrar esta tela para usar
 * o técnico realmente autenticado é um projeto à parte (login próprio do
 * app técnico).
 */
export async function getCurrentTecnico(): Promise<TecnicoAtual | null> {
  const { data, error } = await supabase.from("tecnicos").select("id, nome").limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export interface TecnicoAtivo {
  id: string;
  nome: string;
  especialidade: string | null;
}

/** Lista de técnicos ativos, para preencher o seletor de atribuição do supervisor. */
export async function fetchTecnicosAtivos(): Promise<TecnicoAtivo[]> {
  const { data, error } = await supabase
    .from("tecnicos")
    .select("id, nome, especialidade")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data || [];
}

/** O supervisor atribui (ou troca/remove, com tecnicoId null) o técnico de uma OS. */
export async function atribuirTecnico(osId: string, tecnicoId: string | null): Promise<void> {
  const { error } = await supabase.from("ordens_servico").update({ tecnico_id: tecnicoId }).eq("id", osId);
  if (error) throw error;
}

/** O próprio técnico "puxa" (assume) uma OS ainda sem responsável. */
export async function assumirAtendimento(osId: string): Promise<void> {
  const tecnico = await getCurrentTecnico();
  if (!tecnico) throw new Error("Nenhum técnico disponível para assumir o atendimento.");
  await atribuirTecnico(osId, tecnico.id);
}
