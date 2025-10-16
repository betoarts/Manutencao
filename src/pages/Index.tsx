import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { MadeWithDyad } from '@/components/made-with-dyad';

const Index = () => {
  const { session } = useSupabase();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Carregando Sistema...</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Redirecionando você.</p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;