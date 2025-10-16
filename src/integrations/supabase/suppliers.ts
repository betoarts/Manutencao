import { supabase } from './client';

export type Supplier = {
  id: string;
  user_id: string;
  name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at: string;
};

export type NewSupplier = Omit<Supplier, 'id' | 'user_id' | 'created_at'>;

export const getSuppliers = async (): Promise<Supplier[]> => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
};

export const createSupplier = async (supplierData: NewSupplier): Promise<Supplier> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('suppliers')
    .insert({ ...supplierData, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateSupplier = async (id: string, updates: Partial<NewSupplier>): Promise<Supplier> => {
  const { data, error } = await supabase
    .from('suppliers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteSupplier = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};