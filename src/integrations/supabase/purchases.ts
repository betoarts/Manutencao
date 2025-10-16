import { supabase } from './client';

export type NewPurchase = {
  asset_id?: string | null;
  product_name?: string | null;
  quantity?: number | null;
  vendor?: string | null;
  purchase_date?: string | null;
  cost?: number | null;
  invoice_number?: string | null;
  notes?: string | null;
  purchase_type: 'product' | 'asset'; // Adicionada a nova coluna
};

export const getPurchases = async () => {
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      assets (
        name
      )
    `)
    .order('purchase_date', { ascending: false });
  if (error) throw error;
  return data;
};

export const createPurchase = async (purchaseData: NewPurchase) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const dataToInsert = { ...purchaseData, user_id: user.id };

  // Garante que campos numéricos sejam salvos como números
  if (dataToInsert.cost) dataToInsert.cost = Number(dataToInsert.cost);
  if (dataToInsert.quantity) dataToInsert.quantity = Number(dataToInsert.quantity);

  const { error } = await supabase.from('purchases').insert([dataToInsert]);
  if (error) {
    console.error('Erro do Supabase ao criar compra:', error);
    throw error;
  }
  return;
};

export const updatePurchase = async (id: string, purchaseData: Partial<NewPurchase>) => {
  const dataToUpdate = { ...purchaseData };
  // Garante que campos numéricos sejam salvos como números
  if (dataToUpdate.cost) dataToUpdate.cost = Number(dataToUpdate.cost);
  if (dataToUpdate.quantity) dataToUpdate.quantity = Number(dataToUpdate.quantity);

  const { error } = await supabase
    .from('purchases')
    .update(dataToUpdate)
    .eq('id', id);
  if (error) {
    console.error('Erro do Supabase ao atualizar compra:', error);
    throw error;
  }
  return;
};

export const deletePurchase = async (id: string) => {
  const { error } = await supabase.from('purchases').delete().eq('id', id);
  if (error) throw error;
  return;
};

export const getPurchaseByAssetId = async (assetId: string) => {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('asset_id', assetId);
  if (error) throw error;
  return data;
};

export const getPurchasesByProductName = async (productName: string) => {
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      assets (
        name
      )
    `)
    .eq('product_name', productName)
    .order('purchase_date', { ascending: false });
  if (error) throw error;
  return data;
};

// Nova função para registrar a baixa de estoque
export const recordStockUsage = async (items: { product_name: string; quantity: number }[], notes: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const stockUsageRecords = items.map(item => ({
    user_id: user.id,
    product_name: item.product_name,
    quantity: -Math.abs(item.quantity), // Garante que a quantidade seja negativa
    purchase_date: new Date().toISOString(),
    notes: notes,
    purchase_type: 'product', // Definindo o tipo para uso de estoque
  }));

  const { error } = await supabase.from('purchases').insert(stockUsageRecords);
  if (error) throw error;
  return;
};

// Nova função para restaurar o estoque
export const restoreStock = async (items: { product_name: string; quantity: number }[], notes: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const stockRestoreRecords = items.map(item => ({
    user_id: user.id,
    product_name: item.product_name,
    quantity: Math.abs(item.quantity), // Garante que a quantidade seja positiva
    purchase_date: new Date().toISOString(),
    notes: notes,
    purchase_type: 'product', // Definindo o tipo para restauração de estoque
  }));

  const { error: restoreError } = await supabase.from('purchases').insert(stockRestoreRecords);
  if (restoreError) throw restoreError;
  return;
};