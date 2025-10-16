import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam ser definidas.');
}

// Adicionando logs para depuração
console.log('Supabase URL sendo usado:', supabaseUrl);
// Não vamos logar a chave inteira por segurança, apenas confirmar que ela existe.
console.log('Supabase Anon Key sendo usado: [Exists]');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);