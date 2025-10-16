import { supabase } from './client';

export const inviteUser = async (email: string) => {
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: { email },
  });

  if (error) throw error;
  return data;
};