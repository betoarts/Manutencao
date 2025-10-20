import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Settings, Package, ShoppingCart, Users, Wrench, LogOut, Box, ClipboardList, ListTodo, Bell, ChevronLeft, ChevronRight, Truck, CalendarDays, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { MadeWithDyad } from './made-with-dyad';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '@/integrations/supabase/profiles';
import { getSettings } from '@/integrations/supabase/settings';
import { getUnreadNotificationsCount } from '@/integrations/supabase/notifications';
import { cn } from '@/lib/utils';
import RealtimeNotificationListener from './RealtimeNotificationListener';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// Componente auxiliar para renderizar os links de navegação
const NavLinks: React.FC<{ isCollapsed: boolean; onLinkClick?: () => void }> = ({ isCollapsed, onLinkClick }) => {
  const { data: unreadNotificationsCount } = useQuery({
    queryKey: ['unreadNotificationsCount'],
    queryFn: getUnreadNotificationsCount,
  });

  const links = [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/assets", icon: Package, label: "Ativos" },
    { to: "/purchases", icon: ShoppingCart, label: "Compras" },
    { to: "/inventory", icon: Box, label: "Estoque" },
    { to: "/maintenance", icon: Wrench, label: "Manutenção" },
    { to: "/requests", icon: ClipboardList, label: "Chamados" },
    { to: "/tasks", icon: ListTodo, label: "Tarefas" },
    { to: "/calendar", icon: CalendarDays, label: "Calendário" },
    { to: "/suppliers", icon: Truck, label: "Fornecedores" },
    { to: "/notifications", icon: Bell, label: "Notificações", count: unreadNotificationsCount },
    { to: "/departments-users", icon: Users, label: "Departamentos & Usuários" },
    { to: "/settings", icon: Settings, label: "Configurações" },
  ];

  return (
    <ul>
      {links.map((link) => (
        <li key={link.to} className="mb-2">
          <Link 
            to={link.to} 
            onClick={onLinkClick}
            className="flex items-center p-2 rounded-md hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:text-sidebar-accent-foreground transition-colors"
          >
            <div className="relative">
              <link.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
              {link.count !== undefined && link.count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {link.count}
                </span>
              )}
            </div>
            {!isCollapsed && link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
};


const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase } = useSupabase();
  const isMobile = useIsMobile();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isMobile);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Função para gerar iniciais do usuário
  const getUserInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
    return (firstInitial + lastInitial).slice(0, 2);
  };

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
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
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

  // Ajusta o estado de recolhimento ao mudar de mobile para desktop
  useEffect(() => {
    if (isMobile) {
      setIsSidebarCollapsed(true);
    } else {
      // Pode manter o estado anterior ou definir um padrão para desktop
      setIsSidebarCollapsed(false); 
    }
  }, [isMobile]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const renderSidebarContent = (isCollapsed: boolean, onLinkClick?: () => void) => (
    <>
      <div className="mb-8 h-16 flex items-center justify-between">
        {!isCollapsed && (
          settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="max-h-full max-w-full" />
          ) : (
            <div className="text-2xl font-bold text-sidebar-primary dark:text-sidebar-primary-foreground">
              {settings?.company_name || 'Gestão Ativos'}
            </div>
          )
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-sidebar-foreground dark:text-sidebar-foreground hover:bg-sidebar-accent dark:hover:bg-sidebar-accent"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        )}
      </div>
      <nav className="flex-grow">
        <NavLinks isCollapsed={isCollapsed} onLinkClick={onLinkClick} />
      </nav>
      <div className="mt-auto">
        {!isCollapsed && profile && (
          <div className="flex items-center space-x-3 p-2 mb-4 rounded-md bg-sidebar-accent dark:bg-sidebar-accent">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile.avatar_url || ''} alt="Avatar do usuário" />
              <AvatarFallback className="text-sm font-medium">
                {getUserInitials(profile.first_name, profile.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile.first_name} {profile.last_name}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {profile.role === 'admin' ? 'Administrador' : 'Usuário'}
              </p>
            </div>
          </div>
        )}
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start"
        >
          <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && "Sair"}
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar (Desktop/Tablet) */}
      {!isMobile && (
        <aside
          className={cn(
            "bg-sidebar dark:bg-sidebar-background text-sidebar-foreground dark:text-sidebar-foreground p-4 flex flex-col border-r border-sidebar-border dark:border-sidebar-border print:hidden transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? "w-20" : "w-64"
          )}
        >
          {renderSidebarContent(isSidebarCollapsed)}
        </aside>
      )}

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out"
      >
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center print:hidden">
          {isMobile && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-4 w-64 flex flex-col bg-sidebar dark:bg-sidebar-background overflow-y-auto">
                {/* Conteúdo do Sheet é o mesmo da Sidebar, mas não recolhível */}
                {renderSidebarContent(false, () => setIsSheetOpen(false))}
              </SheetContent>
            </Sheet>
          )}
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
            {settings?.company_name || 'Sistema de Gestão'}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ''} alt="Avatar do usuário" />
                <AvatarFallback className="text-sm font-medium">
                  {getUserInitials(profile?.first_name, profile?.last_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-gray-700 dark:text-gray-300 hidden sm:inline">
                Olá, {profile?.first_name || 'Usuário'}!
              </span>
            </div>
            <Link to="/notifications" className="relative">
              <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              {unreadNotificationsCount !== undefined && unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
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