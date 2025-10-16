import { supabase } from './client';

export type TaskData = {
  title: string;
  description?: string | null;
  due_date?: string | null;
  status: 'pending' | 'completed'; // Corrigido para não-opcional
  completed_by?: string | null;
  completed_at?: string | null;
};

export const getTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createTask = async (taskData: TaskData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...taskData, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateTask = async (id: string, taskData: Partial<TaskData>) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(taskData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteTask = async (id: string) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};