import { supabase } from './client';

export type Asset = {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  tag_code: string;
  acquisition_date?: string | null;
  supplier?: string | null;
  value?: number | null;
  useful_life_years?: number | null;
  status: string;
  created_at: string;
  department_id?: string | null;
  custodian_id?: string | null;
};

export type NewAsset = Omit<Asset, 'id' | 'user_id' | 'created_at'>;

type GetAssetsParams = {
  searchTerm?: string;
  page?: number;
  pageSize?: number;
};

export const getAssets = async (params?: GetAssetsParams): Promise<{ data: Asset[]; count: number }> => {
  let query = supabase
    .from('assets')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (params?.searchTerm) {
    query = query.or(`name.ilike.%${params.searchTerm}%,tag_code.ilike.%${params.searchTerm}%,status.ilike.%${params.searchTerm}%`);
  }

  if (params?.page && params?.pageSize) {
    const start = (params.page - 1) * params.pageSize;
    const end = start + params.pageSize - 1;
    query = query.range(start, end);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { data: data || [], count: count || 0 };
};

export const getAssetById = async (id: string): Promise<Asset | null> => {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found
  return data;
};

export const createAsset = async (asset: NewAsset): Promise<Asset> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('assets')
    .insert({ ...asset, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAsset = async (id: string, updates: Partial<NewAsset>): Promise<Asset> => {
  const { data, error } = await supabase
    .from('assets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteAsset = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

// Função auxiliar para obter todos os ativos sem paginação, útil para selects em formulários
export const getAllAssets = async (): Promise<Asset[]> => {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
};