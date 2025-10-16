import { supabase } from './client';

// Define the type for maintenance data for creation
export type MaintenanceData = {
  asset_id: string;
  maintenance_type: string;
  description?: string;
  scheduled_date: string;
  completion_date?: string;
  cost?: number;
  status: string;
  notes?: string;
  technician_name?: string;
};

// Definindo o tipo MaintenanceRecord completo, incluindo a relação com assets e products
export type MaintenanceRecord = {
  id: string;
  user_id: string;
  asset_id: string;
  maintenance_type: string;
  description?: string | null;
  scheduled_date: string | Date; // Permitindo Date para uso no frontend
  completion_date?: string | Date | null; // Permitindo Date para uso no frontend
  cost?: number | null;
  status: string;
  notes?: string | null;
  technician_name?: string | null;
  created_at: string;
  assets: { name: string, tag_code: string } | null; // Adicionado o tipo para assets
  maintenance_products: { product_name: string; quantity_used: number }[]; // Adicionado o tipo para maintenance_products
};


export const getMaintenanceRecords = async () => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*, assets(name, tag_code), maintenance_products(*)') // Join with assets and products
    .order('scheduled_date', { ascending: false });
  if (error) throw error;
  return data;
};

export const getMaintenanceRecordsByAssetId = async (assetId: string) => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*, assets(name, tag_code), maintenance_products(*)') // Join with assets and products
    .eq('asset_id', assetId)
    .order('scheduled_date', { ascending: false });
  if (error) throw error;
  return data;
};

export const createMaintenanceRecord = async (maintenanceData: Omit<MaintenanceData, 'status'> & { status?: string }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('maintenance_records')
    .insert({ ...maintenanceData, user_id: user.id })
    .select()
    .single(); // Retorna um único objeto
  if (error) throw error;
  return data;
};

export const updateMaintenanceRecord = async (id: string, maintenanceData: Partial<MaintenanceData>) => {
  const { data, error } = await supabase
    .from('maintenance_records')
    .update(maintenanceData)
    .eq('id', id)
    .select()
    .single(); // Retorna um único objeto
  if (error) throw error;
  return data;
};

export const deleteMaintenanceRecord = async (id: string) => {
  // Primeiro, buscamos os produtos associados a esta manutenção
  const { data: products, error: productsError } = await supabase
    .from('maintenance_products')
    .select('product_name, quantity_used')
    .eq('maintenance_record_id', id);
  
  if (productsError) throw productsError;

  // Em seguida, excluímos o registro de manutenção
  const { error } = await supabase
    .from('maintenance_records')
    .delete()
    .eq('id', id);
  
  if (error) throw error;

  // Se houver produtos, restauramos o estoque
  if (products && products.length > 0) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const stockRestoreRecords = products.map(p => ({
      user_id: user.id,
      product_name: p.product_name,
      quantity: p.quantity_used, // Quantidade positiva para restaurar
      purchase_date: new Date().toISOString(),
      notes: `Restauração de estoque - Cancelamento de manutenção`,
    }));

    const { error: restoreError } = await supabase.from('purchases').insert(stockRestoreRecords);
    if (restoreError) throw restoreError;
  }

  return true;
};

// Novas funções para produtos em manutenção
export const addProductsToMaintenance = async (maintenanceId: string, products: { product_name: string; quantity: number }[]) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const recordsToInsert = products.map(p => ({
    maintenance_record_id: maintenanceId,
    product_name: p.product_name,
    quantity_used: p.quantity,
    user_id: user.id,
  }));

  const { error } = await supabase.from('maintenance_products').insert(recordsToInsert);
  if (error) throw error;
  return;
};

// Nova função para remover produtos de uma manutenção
export const removeProductsFromMaintenance = async (maintenanceId: string) => {
  const { error } = await supabase
    .from('maintenance_products')
    .delete()
    .eq('maintenance_record_id', maintenanceId);
  
  if (error) throw error;
  return;
};