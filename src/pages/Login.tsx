import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { getCompanySettings } from '@/integrations/supabase/company_settings';

function Login() {
  const { data: companySettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['companySettings'],
    queryFn: getCompanySettings,
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        {isLoadingSettings ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mb-6">Carregando logo...</div>
        ) : (
          <>
            {companySettings?.logo_url ? (
              <img
                src={companySettings.logo_url}
                alt={companySettings.company_name || 'Logo da Empresa'}
                className="mx-auto h-16 mb-6 object-contain"
              />
            ) : (
              <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
                {companySettings?.company_name || 'Sistema de Gestão'}
              </h1>
            )}
          </>
        )}
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Bem-vindo ao Sistema de Gestão
        </h2>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          theme="light"
          localization={{
            variables: {
              sign_in: {
                email_label: 'Endereço de E-mail',
                password_label: 'Sua Senha',
                email_input_placeholder: 'Seu endereço de e-mail',
                password_input_placeholder: 'Sua senha',
                button_label: 'Entrar',
                link_text: 'Já tem uma conta? Entrar',
              },
              sign_up: {
                email_label: 'Endereço de E-mail',
                password_label: 'Criar uma Senha',
                email_input_placeholder: 'Seu endereço de e-mail',
                password_input_placeholder: 'Sua senha',
                button_label: 'Registrar',
                link_text: 'Não tem uma conta? Registrar',
              },
              forgotten_password: {
                email_label: 'Endereço de E-mail',
                email_input_placeholder: 'Seu endereço de e-mail',
                button_label: 'Enviar instruções de redefinição',
                link_text: 'Esqueceu sua senha?',
              },
              magic_link: {
                email_input_placeholder: 'Seu endereço de e-mail',
                button_label: 'Enviar Link Mágico',
                link_text: 'Enviar um link mágico',
              },
              update_password: {
                password_label: 'Nova Senha',
                password_input_placeholder: 'Sua nova senha',
                button_label: 'Atualizar Senha',
              },
            },
          }}
        />
      </div>
    </div>
  );
}

export default Login;