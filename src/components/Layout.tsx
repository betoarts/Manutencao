import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Settings, Package, ShoppingCart, Users, Wrench, LogOut, Box, ClipboardList, ListTodo, Bell, ChevronLeft, ChevronRight, Truck, CalendarDays } from 'lucide-react'; // Importação de Brain removida
import { Button } from '@/components/ui/button';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { MadeWithDyad } from './made-with-dyad';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '@/integrations/supabase/profiles';
import { getSettings } from '@/integrations/supabase/settings';
import { getUnreadNotificationsCount } from '@/integrations/supabase/notifications';
import { cn } from '@/lib/utils';
import RealtimeNotificationListener from './RealtimeNotificationListener';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase, session } = useSupabase();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const { data: unreadNotificationsCount } = useQuery({
    queryKey: ['unreadNotificationsCount'],
    queryFn: getUnreadNotificationsCount,
    refetchInterval: 30000, // Atualiza a contagem a cada 30 segundos
    refetchOnWindowFocus: true, // Garante que a contagem seja atualizada ao focar na janela
  });

  // Efeito para atualizar o favicon dinamicamente
  useEffect(() => {
    if (settings?.favicon_url) {
      const link = document.getElementById('favicon-link') as HTMLLinkElement;
      if (link) {
        link.href = settings.favicon_url;
      }
    }
  }, [settings?.favicon_url]);

  // Log para depuração do ID do usuário e contagem de notificações
  useEffect(() => {
    console.log('Layout: session.user.id:', session?.user?.id);
    console.log('Layout: unreadNotificationsCount (from query):', unreadNotificationsCount);
  }, [session?.user?.id, unreadNotificationsCount]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar dark:bg-sidebar-background text-sidebar-foreground dark:text-sidebar-foreground p-4 flex flex-col border-r border-sidebar-border dark:border-sidebar-border print:hidden transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="mb-8 h-16 flex items-center justify-between">
          {!isSidebarCollapsed && (
            settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="max-h-full max-w-full" />
            ) : (
              <div className="text-2xl font-bold text-sidebar-primary dark:text-sidebar-primary-foreground">
                {settings?.company_name || 'Gestão Ativos'}
              </div>
            )
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-sidebar-foreground dark:text-sidebar-foreground hover:bg-sidebar-accent dark:hover:bg-sidebar-accent"
          >
            {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
        <nav className="flex-grow">
          <ul>
            <li className="mb-2">
              <Link to="/dashboard" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:text-sidebar-accent-foreground transition-colors">
                <Home className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                {!isSidebarCollapsed && "Dashboard"}
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/assets" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:text-sidebar-accent-foreground transition-colors">
                <Package className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                {!isSidebarCollapsed && "Ativos"}
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/purchases" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:text-sidebar-accent-foreground transition-colors">
                <ShoppingCart className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                {!isSidebarCollapsed && "Compras"}
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/inventory" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:text-sidebar-accent-foreground transition-colors">
                <Box className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                {!isSidebarCollapsed && "Estoque"}
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/maintenance" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:text-sidebar-accent-foreground transition-colors">
                <Wrench className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                {!isSidebarCollapsed && "Manutenção"}
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/requests" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:text-sidebar-accent-foreground transition-colors">
                <ClipboardList className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                {!isSidebarCollapsed && "Chamados"}
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/tasks" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:text-sidebar-accent-foreground transition-colors">
                <ListTodo className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                {!isSidebarCollapsed && "Tarefas"}
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/calendar" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:text-sidebar-accent-foreground transition-colors">
                <CalendarDays className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                {!isSidebarCollapsed && "Calendário"}
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/suppliers" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:text-sidebar-accent-foreground transition-colors">
                <Truck className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                {!isSidebarCollapsed && "Fornecedores"}
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/notifications" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:text-sidebar-accent-foreground transition-colors relative">
                <div className="relative"> {/* Wrapper para posicionamento relativo ao ícone */}
                  <Bell className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                  {unreadNotificationsCount !== undefined && unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </div>
                {!isSidebarCollapsed && "Notificações"}
              </Link>
            </li>
            {/* Item de menu "Assistente IA" removido */}
            <li className="mb-2">
              <Link to="/departments-users" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:text-sidebar-accent-foreground transition-colors">
                <Users className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                {!isSidebarCollapsed && "Departamentos & Usuários"}
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/settings" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:text-sidebar-accent-foreground transition-colors">
                <Settings className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                {!isSidebarCollapsed && "Configurações"}
              </Link>
            </li>
          </ul>
        </nav>
        <div className="mt-auto">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start"
          >
            <LogOut className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
            {!isSidebarCollapsed && "Sair"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "ml-0" : "ml-0"
        )}
      >
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center print:hidden">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Sistema de Gestão NBA PARK</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 dark:text-gray-300">Olá, {profile?.first_name || 'Usuário'}!</span>
            {/* DEBUG VISUAL TEMPORÁRIO */}
            {unreadNotificationsCount !== undefined && (
              <span className="text-sm text-red-600 dark:text-red-400 font-bold">
                DEBUG: {unreadNotificationsCount}
              </span>
            )}
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
        <div className="print:hidden">
          <MadeWithDyad />
        </div>
      </div>
      <RealtimeNotificationListener />
    </div>
  );
};

export default Layout;