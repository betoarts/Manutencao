import { supabase } from './client';

export type CompanySettings = {
  id: number;
  logo_url?: string | null;
  company_name?: string | null;
};

export const getCompanySettings = async (): Promise<CompanySettings | null> => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .eq('id', 1) // Assumindo que há apenas uma linha de configurações com ID 1
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    throw error;
  }

  return data || null;
};

export const updateCompanySettings = async (updates: Partial<Omit<CompanySettings, 'id'>>) => {
  const { data, error } = await supabase
    .from('company_settings')
    .update(updates)
    .eq('id', 1)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createCompanySettings = async (settings: Omit<CompanySettings, 'id'>) => {
  const { data, error } = await supabase
    .from('company_settings')
    .insert({ id: 1, ...settings }) // Força o ID 1 para ser a única linha
    .select()
    .single();

  if (error) throw error;
  return data;
};