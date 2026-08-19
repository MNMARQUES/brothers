export const PLANS = [
  { id: "bronze", name: "Bronze", price: 39.9, equip: 2, sla: "72h", preventivas: 1, color: "#A1764B", gradient: "from-amber-700 to-amber-500" },
  { id: "prata", name: "Prata", price: 59.9, equip: 4, sla: "48h", preventivas: 1, color: "#94A3B8", gradient: "from-slate-400 to-slate-300" },
  { id: "ouro", name: "Ouro", price: 89.9, equip: 6, sla: "24h", preventivas: 1, color: "#EAB308", gradient: "from-yellow-500 to-amber-300", highlight: true },
  { id: "diamante", name: "Diamante", price: 129.9, equip: 10, sla: "12h", preventivas: 2, color: "#38BDF8", gradient: "from-sky-400 to-cyan-300" },
  { id: "empresarial", name: "Empresarial", price: 0, equip: 999, sla: "Prioritário", preventivas: 999, color: "#0F172A", gradient: "from-slate-900 to-slate-700" },
] as const;

export type Plan = (typeof PLANS)[number];

export const ZONA_SUL_BAIRROS = [
  "Botafogo","Catete","Copacabana","Flamengo","Gávea","Glória","Humaitá","Ipanema","Jardim Botânico","Lagoa","Laranjeiras","Leblon","Leme","São Conrado","Urca","Vidigal",
];

export const TIPOS_EQUIPAMENTO = [
  "Ar-condicionado","Geladeira","Freezer","Frigobar","Adega climatizada","Bebedouro","Purificador de água","Câmara fria","Expositor refrigerado","Balcão refrigerado","Máquina de gelo","Outro",
];

export const AMBIENTES_EQUIPAMENTO = [
  "Sala","Quarto","Suíte","Escritório","Home Office","Cozinha","Sala Comercial","Loja","Consultório","Recepção","Sala de Reunião","Área Gourmet","Outro",
];

export const MARCAS_EQUIPAMENTO = [
  "LG","Samsung","Daikin","Fujitsu","Mitsubishi Electric","Springer Midea","Carrier","Elgin","Gree","Consul","Electrolux","Philco","Agratto","Hitachi","TCL","Komeco","York","Outro",
];

export const MODELOS_EQUIPAMENTO = [
  "Split Hi Wall","Split Inverter","Split Convencional","Cassete","Piso Teto","Multi Split","Janela","Portátil","VRF","Central","Outro",
];

export const BTUS_EQUIPAMENTO = [7000, 9000, 12000, 18000, 22000, 24000, 30000, 36000, 48000, 60000];

export const EQUIPAMENTOS = [
  { id: "BRO-000001", ambiente: "Sala", marca: "Split LG", modelo: "Dual Inverter", btus: 12000, instalado: "10/01/2024", numeroSerie: "LG123456789" },
  { id: "BRO-000002", ambiente: "Quarto Casal", marca: "Samsung", modelo: "WindFree", btus: 18000, instalado: "02/03/2024", numeroSerie: "SM987654321" },
  { id: "BRO-000003", ambiente: "Quarto 2", marca: "Daikin", modelo: "Smart", btus: 9000, instalado: "15/05/2024", numeroSerie: "DK456789123" },
];

export const CHAMADOS = [
  { id: "OS #1254", equip: "Sala — Split LG", status: "Em atendimento", date: "16/06/2026" },
  { id: "OS #1203", equip: "Quarto Casal", status: "Finalizado", date: "02/06/2026" },
];

export const TECNICO = { nome: "Carlos", sobrenome: "Alberto" };

export const ESPECIALIDADES_TECNICO = [
  "Ar-condicionado","Refrigeração comercial","Elétrica","Climatização industrial","Manutenção geral",
];

export const TECNICOS = [
  { id: "T-001", nome: "Carlos Alberto", telefone: "(21) 99999-1010", email: "carlos.alberto@brothers.com", especialidade: "Ar-condicionado", area: "Laranjeiras", ativo: true },
  { id: "T-002", nome: "Fernanda Souza", telefone: "(21) 99999-2020", email: "fernanda.souza@brothers.com", especialidade: "Refrigeração comercial", area: "Ipanema", ativo: true },
  { id: "T-003", nome: "Marcos Vinícius", telefone: "(21) 99999-3030", email: "marcos.vinicius@brothers.com", especialidade: "Elétrica", area: "Flamengo", ativo: true },
  { id: "T-004", nome: "Juliana Ramos", telefone: "(21) 99999-4040", email: "juliana.ramos@brothers.com", especialidade: "Climatização industrial", area: "Humaitá", ativo: false },
];

export const CLIENTES = [
  { id: "C-001", nome: "João Silva", telefone: "(21) 99999-1111", email: "joao.silva@email.com", bairro: "Laranjeiras", plano: "Ouro", equipamentos: 1, ativo: true },
  { id: "C-002", nome: "Maria Oliveira", telefone: "(21) 99999-2222", email: "maria.oliveira@email.com", bairro: "Flamengo", plano: "Prata", equipamentos: 2, ativo: true },
  { id: "C-003", nome: "Ana Beatriz", telefone: "(21) 99999-4444", email: "ana.beatriz@email.com", bairro: "Ipanema", plano: "Diamante", equipamentos: 3, ativo: true },
  { id: "C-004", nome: "Pedro Santos", telefone: "(21) 99999-3333", email: "pedro.santos@email.com", bairro: "Ipanema", plano: "Bronze", equipamentos: 1, ativo: false },
  { id: "C-005", nome: "Roberta Lima", telefone: "(21) 99999-5555", email: "roberta.lima@email.com", bairro: "Humaitá", plano: "Ouro", equipamentos: 1, ativo: true },
];

export const STATUS_ATENDIMENTO = ["Agendado", "Em atendimento", "Resolvido", "Aguardando peça"] as const;
export type StatusAtendimento = (typeof STATUS_ATENDIMENTO)[number];

// Agendamento padrão é feito por período (Manhã/Tarde). O horário exato (horarioFixo)
// só é definido como exceção, quando o cliente solicita um horário pontual.
export const AGENDA_TECNICO = [
  {
    id: "1254",
    hora: "09:00",
    horarioFixo: true,
    periodo: "Manhã" as const,
    tecnicoId: "T-001",
    cliente: "João Silva",
    endereco: "Rua das Laranjeiras, 123",
    bairro: "Laranjeiras - RJ",
    tipo: "Preventiva",
    status: "Em atendimento" as StatusAtendimento,
    problema: "Manutenção preventiva periódica",
    telefone: "(21) 99999-1111",
    equipamento: { ambiente: "Sala", marca: "Split LG", modelo: "Dual Inverter", btus: 12000 },
  },
  {
    id: "1255",
    hora: "10:30",
    horarioFixo: false,
    periodo: "Manhã" as const,
    tecnicoId: "T-002",
    cliente: "Maria Oliveira",
    endereco: "Rua General Glicério, 456",
    bairro: "Flamengo - RJ",
    tipo: "Corretiva",
    status: "Aguardando peça" as StatusAtendimento,
    problema: "Equipamento não está gelando",
    telefone: "(21) 99999-2222",
    equipamento: { ambiente: "Quarto", marca: "Samsung", modelo: "WindFree", btus: 18000 },
  },
  {
    id: "1257",
    hora: "11:30",
    horarioFixo: false,
    periodo: "Manhã" as const,
    tecnicoId: "",
    cliente: "Ana Beatriz",
    endereco: "Rua Visconde de Pirajá, 220",
    bairro: "Ipanema - RJ",
    tipo: "Preventiva",
    status: "Agendado" as StatusAtendimento,
    problema: "Manutenção preventiva periódica",
    telefone: "(21) 99999-4444",
    equipamento: { ambiente: "Loja", marca: "Carrier", modelo: "Cassete", btus: 24000 },
  },
  {
    id: "1256",
    hora: "14:00",
    horarioFixo: true,
    periodo: "Tarde" as const,
    tecnicoId: "T-001",
    cliente: "Pedro Santos",
    endereco: "Rua Barão de Torre, 789",
    bairro: "Ipanema - RJ",
    tipo: "Preventiva",
    status: "Resolvido" as StatusAtendimento,
    problema: "Manutenção preventiva periódica",
    telefone: "(21) 99999-3333",
    equipamento: { ambiente: "Escritório", marca: "Daikin", modelo: "Smart", btus: 9000 },
  },
  {
    id: "1258",
    hora: "15:30",
    horarioFixo: false,
    periodo: "Tarde" as const,
    tecnicoId: "",
    cliente: "Roberta Lima",
    endereco: "Rua Humaitá, 95",
    bairro: "Humaitá - RJ",
    tipo: "Corretiva",
    status: "Agendado" as StatusAtendimento,
    problema: "Ruído excessivo ao ligar",
    telefone: "(21) 99999-5555",
    equipamento: { ambiente: "Consultório", marca: "Fujitsu", modelo: "Split Hi Wall", btus: 12000 },
  },
];

export const CHECKLIST_SERVICO = [
  "Limpeza de filtros",
  "Limpeza da evaporadora",
  "Limpeza da condensadora",
  "Verificação elétrica",
  "Carga de gás",
  "Teste de funcionamento",
];

export const TIMELINE = [
  { label: "Solicitação aberta", date: "16/06/2026 09:30", done: true },
  { label: "Técnico designado", date: "16/06/2026 09:45", done: true },
  { label: "Em deslocamento", date: "16/06/2026 10:20", done: true },
  { label: "Em atendimento", date: "16/06/2026 11:00", done: true, active: true },
  { label: "Aguardando peça", date: "—", done: false },
  { label: "Finalizado", date: "—", done: false },
];