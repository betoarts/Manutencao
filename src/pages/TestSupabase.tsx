import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TestSupabase = () => {
  const [status, setStatus] = useState('loading');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Tentando buscar dados da nova tabela pública 'test_connection'.
        const { data, error } = await supabase.from('test_connection').select('*').limit(1);

        if (error) {
          throw error;
        }

        setStatus('success');
        setData(data);
      } catch (err: any) {
        setStatus('error');
        setError(err);
        console.error("Erro no teste de conexão com Supabase:", err);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Teste de Conexão com Supabase</h1>
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold">Status:</h2>
            {status === 'loading' && <p className="text-blue-600">Testando conexão com a tabela pública...</p>}
            {status === 'success' && <p className="text-green-600">Conexão bem-sucedida!</p>}
            {status === 'error' && <p className="text-red-600">Falha na conexão.</p>}
          </div>
          {data && (
            <div>
              <h2 className="font-semibold">Dados Recebidos (da tabela de teste):</h2>
              <pre className="bg-gray-200 p-2 rounded mt-2 text-sm overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
          {error && (
            <div>
              <h2 className="font-semibold">Detalhes do Erro:</h2>
              <pre className="bg-red-100 text-red-800 p-2 rounded mt-2 text-sm overflow-auto">
                {JSON.stringify(error, null, 2)}
              </pre>
              <p className="mt-4 text-red-700 font-bold">
                A falha persistiu mesmo com uma tabela pública. Isso indica que o problema não está nas regras do banco de dados (RLS), mas sim na comunicação com o Supabase. Verifique se há algum bloqueio de rede (firewall, proxy) ou se o projeto Supabase está ativo e sem problemas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestSupabase;