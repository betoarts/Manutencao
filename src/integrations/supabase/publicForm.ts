import { supabase } from './client';
import { MaintenanceRequest } from './maintenance_requests';
import { createNotification } from './notifications'; // Importar a função de criar notificação
import { playNotificationSound } from '@/utils/notificationSound'; // Importar a função de som
import { getAdminUserIds } from './profiles'; // Importar a função para obter IDs de administradores
import { queryClient } from '@/App'; // Importar queryClient

export type FormFieldData = {
  field_label: string;
  field_type: 'text' | 'textarea';
  is_required: boolean;
};

export type MaintenanceRequestData = {
  requester_name: string;
  requester_email?: string;
  requester_phone?: string;
  description: string;
  custom_data?: Record<string, any>;
};

// --- Funções para Campos Customizados ---

export const getPublicFormFields = async () => {
  const { data, error } = await supabase
    .from('public_form_fields')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

export const createPublicFormField = async (fieldData: FormFieldData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('public_form_fields')
    .insert({ ...fieldData, user_id: user.id })
    .select();
  if (error) throw error;
  return data[0];
};

// --- Funções para Chamados de Manutenção ---

export const createMaintenanceRequest = async (requestData: MaintenanceRequestData) => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .insert(requestData)
    .select()
    .single(); // Usar single para obter o objeto inserido

  if (error) throw error;

  // Após criar o chamado, criar uma notificação interna para todos os administradores
  try {
    const adminIds = await getAdminUserIds();
    console.log('createMaintenanceRequest: IDs de administradores encontrados:', adminIds);

    if (adminIds.length === 0) {
      console.warn('createMaintenanceRequest: Nenhum administrador encontrado para enviar notificação.');
    }

    const notificationPromises = adminIds.map(adminId => {
      const notificationPayload = {
        title: 'Novo Chamado Aberto!',
        body: `Um novo chamado foi aberto por ${requestData.requester_name}: "${requestData.description.substring(0, 50)}..."`,
        type: 'alert' as const, // Corrigido: define o tipo literal 'alert'
        link: '/requests', // Link para a página de chamados
      };
      console.log(`createMaintenanceRequest: Preparando notificação para admin ${adminId}:`, notificationPayload);
      return createNotification(notificationPayload, adminId); // Passa o ID do administrador como targetUserId
    });
    await Promise.all(notificationPromises);
    playNotificationSound(); // Toca o som de notificação

    // Invalida as queries de notificações para forçar a atualização
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
    console.log('createMaintenanceRequest: Queries de notificações invalidadas.');

  } catch (notificationError) {
    console.error('createMaintenanceRequest: Erro ao criar notificações para administradores:', notificationError);
    // Não impede a criação do chamado principal, apenas loga o erro da notificação
  }

  return data;
};

export const getMaintenanceRequests = async () => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const updateMaintenanceRequest = async (id: string, updateData: Partial<{ status: string; technician_name: string; started_at: string; completed_at: string }>) => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getMaintenanceRequestsByEmail = async (email: string): Promise<MaintenanceRequest[]> => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('requester_email', email)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as MaintenanceRequest[];
};