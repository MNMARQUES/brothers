import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltam variáveis de ambiente do Supabase. Verifique o arquivo .env');
}

export const supabase = createClient(
  supabaseUrl || 'https://sua-url-aqui.supabase.co',
  supabaseAnonKey || 'sua-chave-anon-aqui'
);
