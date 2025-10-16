import { supabase } from './client';

export type MaintenanceRecord = {
  id: string;
  user_id: string;
  asset_id: string;
  maintenance_type: string;
  description?: string | null;
  scheduled_date: string; // Stored as string (date) in DB
  completion_date?: string | null; // Stored as string (date) in DB
  cost?: number | null;
  status: string;
  notes?: string | null;
  technician_name?: string | null;
  created_at: string;
  assets?: { name: string, tag_code: string } | null; // Adicionado o tipo para assets
  maintenance_products?: { product_name: string; quantity_used: number }[]; // Adicionado o tipo para maintenance_products
};

export type NewMaintenanceRecord = Omit<MaintenanceRecord, 'id' | 'user_id' | 'created_at'>;

export const getMaintenanceRecords = async (): Promise<MaintenanceRecord[]> => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*, assets(name, tag_code), maintenance_products(*)') // Incluindo assets e maintenance_products
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getMaintenanceRecordsByAssetId = async (assetId: string): Promise<MaintenanceRecord[]> => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*, assets(name, tag_code), maintenance_products(*)') // Incluindo assets e maintenance_products
    .eq('asset_id', assetId)
    .order('scheduled_date', { ascending: false });
  if (error) throw error;
  return data;
};

export const createMaintenanceRecord = async (record: NewMaintenanceRecord): Promise<MaintenanceRecord> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('maintenance_records')
    .insert({ ...record, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateMaintenanceRecord = async (id: string, updates: Partial<NewMaintenanceRecord>): Promise<MaintenanceRecord> => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteMaintenanceRecord = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('maintenance_records')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};