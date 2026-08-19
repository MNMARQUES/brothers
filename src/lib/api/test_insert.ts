import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydpykacpzyxszdsprlkh.supabase.co';
const supabaseAnonKey = 'sb_publishable_21FE6Bn1Qs_Y5qDHw78F-Q_7aMQ8nVY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Iniciando teste de conexão e inserção...");
  
  // 1. Verificar clientes
  const { data: clientes, error: errC } = await supabase.from('clientes').select('*');
  console.log("Clientes:", clientes, "Erro:", errC);

  // 2. Verificar equipamentos
  const { data: equipamentos, error: errE } = await supabase.from('equipamentos').select('*');
  console.log("Equipamentos:", equipamentos, "Erro:", errE);

  if (equipamentos && equipamentos.length > 0) {
    const equipId = equipamentos[0].id;
    console.log(`Tentando inserir ordem_servico para o equipamento: ${equipId}`);
    
    const { data: newOs, error: errOs } = await supabase
      .from('ordens_servico')
      .insert({
        equipamento_id: equipId,
        descricao_problema: '[Teste] Descrição de teste do script',
        status: 'Aberto'
      })
      .select();
      
    console.log("Resultado OS:", newOs, "Erro OS:", errOs);
  } else {
    console.log("Nenhum equipamento encontrado para vincular a OS.");
  }
}

test();
