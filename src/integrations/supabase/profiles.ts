import { supabase } from './client';

export const getProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      avatar_url,
      role,
      department_id,
      department:departments ( name )
    `)
    .order('first_name', { ascending: true });
    
  if (error) throw error;
  
  // Manually shape the data to make it easier to work with on the client
  return data.map(profile => ({
    ...profile,
    // Acessando o alias 'department' que agora é corretamente tipado como um objeto
    department_name: (profile.department as any)?.name || null
  }));
};

export const getAdminUserIds = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (error) throw error;
  console.log('getAdminUserIds: IDs de administradores do banco de dados:', data.map(profile => profile.id));
  return data.map(profile => profile.id);
};

export const updateProfileDepartment = async (profileId: string, departmentId: string | null) => {
    const { data, error } = await supabase
        .from('profiles')
        .update({ department_id: departmentId })
        .eq('id', profileId)
        .select();
    if (error) throw error;
    return data[0];
};

export const getProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, role')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
};

export const updateProfile = async (profileData: {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...profileData, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateUserRole = async (userId: string, newRole: string) => {
  const { data, error } = await supabase.functions.invoke('update-user-role', {
    body: { userId, newRole },
  });

  if (error) throw error;
  return data;
};