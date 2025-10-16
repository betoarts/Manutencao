import { supabase } from './client';

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  link?: string | null;
  read_at?: string | null;
  created_at: string;
};

export type NewNotification = Omit<Notification, 'id' | 'user_id' | 'created_at'>;

export const getNotifications = async (): Promise<Notification[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('getNotifications: Usuário não autenticado.');
    throw new Error('User not authenticated');
  }
  console.log('getNotifications: Buscando notificações para user_id:', user.id);

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getNotifications: Erro ao buscar notificações:', error);
    throw error;
  }
  console.log('getNotifications: Notificações buscadas com sucesso:', data.length, 'para user_id:', user.id);
  return data;
};

export const getUnreadNotificationsCount = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('getUnreadNotificationsCount: Usuário não autenticado.');
    return 0; // Retorna 0 se não autenticado
  }
  console.log('getUnreadNotificationsCount: Buscando contagem de não lidas para user_id:', user.id);

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null);

  if (error) {
    console.error('getUnreadNotificationsCount: Erro ao buscar contagem de não lidas:', error);
    throw error;
  }
  console.log('getUnreadNotificationsCount: Contagem de não lidas:', count ?? 0, 'para user_id:', user.id);
  return count ?? 0;
};

export const markNotificationAsRead = async (id: string): Promise<Notification> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('markNotificationAsRead: Usuário não autenticado.');
    throw new Error('User not authenticated');
  }
  console.log('markNotificationAsRead: Marcando notificação como lida. ID:', id, 'para user_id:', user.id);

  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id) // Garante que o usuário só pode marcar suas próprias notificações
    .select()
    .single();

  if (error) {
    console.error('markNotificationAsRead: Erro ao marcar como lida:', error);
    throw error;
  }
  console.log('markNotificationAsRead: Notificação marcada como lida com sucesso:', data);
  return data;
};

export const createNotification = async (notificationData: NewNotification, targetUserId?: string): Promise<Notification> => {
  const { data: { user } } = await supabase.auth.getUser();
  const userIdToUse = targetUserId || user?.id; // Usa targetUserId se fornecido, caso contrário, o ID do usuário atual

  if (!userIdToUse) {
    console.log('createNotification: Usuário não autenticado e nenhum targetUserId fornecido.');
    throw new Error('User not authenticated and no targetUserId provided');
  }

  // Garante que read_at seja null por padrão na criação
  const dataToInsert = { ...notificationData, user_id: userIdToUse, read_at: null };
  console.log('createNotification: Criando notificação. Dados:', dataToInsert);

  const { data, error } = await supabase
    .from('notifications')
    .insert(dataToInsert)
    .select()
    .single();

  if (error) {
    console.error('createNotification: Erro ao criar notificação:', error);
    throw error;
  }
  console.log('createNotification: Notificação criada com sucesso:', data);
  return data;
};