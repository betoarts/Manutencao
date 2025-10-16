import { supabase } from './client';

export type DepartmentData = {
  name: string;
  description?: string;
};

export const getDepartments = async () => {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
};

export const createDepartment = async (departmentData: DepartmentData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('departments')
    .insert({ ...departmentData, user_id: user.id })
    .select();
  if (error) throw error;
  return data[0];
};

export const updateDepartment = async (id: string, departmentData: Partial<DepartmentData>) => {
  const { data, error } = await supabase
    .from('departments')
    .update(departmentData)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
};

export const deleteDepartment = async (id: string) => {
  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};