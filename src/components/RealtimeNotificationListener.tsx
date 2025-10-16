import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { toast } from 'sonner';
import { playNotificationSound } from '@/utils/notificationSound';
import { useQueryClient } from '@tanstack/react-query';
import { Notification } from '@/integrations/supabase/notifications';


const RealtimeNotificationListener: React.FC = () => {
  const { session } = useSupabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!session?.user?.id) {
      console.log('RealtimeNotificationListener: Sem ID de usuário na sessão, não se inscrevendo.');
      return;
    }

    console.log('RealtimeNotificationListener: Tentando se inscrever para o usuário:', session.user.id);

    const channel = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`, // Filtra para notificações do usuário logado
        },
        (payload) => {
          console.log('Realtime notification payload received:', payload); // Log do payload completo
          const newNotification = payload.new as Notification;
          console.log('Realtime notification received (parsed):', newNotification);

          // Exibir a notificação como um toast
          toast.info(newNotification.title, {
            description: newNotification.body,
            action: newNotification.link ? {
              label: 'Ver',
              onClick: () => window.location.href = newNotification.link!,
            } : undefined,
            duration: 10000, // Mantém o toast por 10 segundos
            onAutoClose: () => {
              // Opcional: marcar como lida automaticamente após fechar o toast
              // queryClient.invalidateQueries({ queryKey: ['notifications'] });
              // queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
            }
          });
          playNotificationSound();
          
          // Adicionar um pequeno atraso antes de invalidar as queries
          // Isso dá tempo para o banco de dados processar a inserção completamente
          setTimeout(() => {
            console.log('RealtimeNotificationListener: Invalidando queries de notificações e contagem após atraso.');
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
          }, 500); // Atraso de 500ms
        }
      )
      .subscribe();

    return () => {
      console.log('RealtimeNotificationListener: Desinscrevendo do canal de notificações.');
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, queryClient]);

  return null; // Este componente não renderiza nada visível
};

export default RealtimeNotificationListener;