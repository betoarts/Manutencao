import Layout from '@/components/Layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationAsRead, Notification } from '@/integrations/supabase/notifications';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { CheckCircle, MailOpen, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading, error } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      console.log('NotificationsPage: markAsReadMutation onSuccess. Invalidando queries.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] }); // Invalida a contagem também
      toast.success('Notificação marcada como lida!');
    },
    onError: (err) => {
      console.error('NotificationsPage: markAsReadMutation onError:', err);
      toast.error(`Erro ao marcar como lida: ${err.message}`);
    },
  });

  const handleMarkAsRead = (id: string) => {
    console.log('NotificationsPage: Tentando marcar notificação como lida:', id);
    markAsReadMutation.mutate(id);
  };

  const getNotificationBadgeVariant = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'destructive';
      case 'alert': return 'destructive';
      case 'info':
      default: return 'secondary';
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'alert': return <Bell className="h-4 w-4 text-red-500" />;
      case 'info':
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  if (isLoading) {
    return <Layout><div className="container mx-auto py-8 text-center">Carregando notificações...</div></Layout>;
  }

  if (error) {
    return <Layout><div className="container mx-auto py-8 text-center text-red-500">Erro ao carregar notificações: {error.message}</div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Minhas Notificações</h2>
        <div className="space-y-4">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <Card key={notification.id} className={cn(
                "flex items-start p-4",
                !notification.read_at ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-700" : "bg-white dark:bg-gray-800"
              )}>
                <div className="mr-4 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-center mb-1">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      {notification.title}
                      {!notification.read_at && <Badge variant={getNotificationBadgeVariant(notification.type)}>Novo</Badge>}
                    </CardTitle>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                  <CardDescription className="text-gray-700 dark:text-gray-300 mb-2">
                    {notification.body}
                  </CardDescription>
                  <CardContent className="p-0 flex gap-2">
                    {notification.link && (
                      <Button asChild variant="link" className="p-0 h-auto">
                        <Link to={notification.link}>Ver Detalhes</Link>
                      </Button>
                    )}
                    {!notification.read_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markAsReadMutation.isPending}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                      >
                        <MailOpen className="h-4 w-4 mr-1" /> Marcar como lida
                      </Button>
                    )}
                  </CardContent>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">Nenhuma notificação encontrada.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NotificationsPage;