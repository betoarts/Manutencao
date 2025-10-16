import { supabase } from './client';

export type MaintenanceRequest = {
  id: string;
  requester_name: string;
  requester_email?: string | null;
  requester_phone?: string | null;
  description: string;
  custom_data?: Record<string, unknown> | null;
  status: string;
  created_at: string;
  technician_name?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
};

export type NewMaintenanceRequest = Omit<MaintenanceRequest, 'id' | 'created_at'>;

export const getMaintenanceRequests = async () => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createMaintenanceRequest = async (request: NewMaintenanceRequest) => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .insert(request)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateMaintenanceRequest = async (id: string, updates: Partial<NewMaintenanceRequest>) => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteMaintenanceRequest = async (id: string) => {
  const { error } = await supabase
    .from('maintenance_requests')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};