-- Remove a política de segurança antiga que estava causando o problema.
DROP POLICY IF EXISTS "Public can create maintenance requests" ON public.maintenance_requests;

-- Cria uma nova política, mais explícita, para permitir que qualquer pessoa insira um novo chamado de manutenção.
CREATE POLICY "Allow public insert access for maintenance requests"
ON public.maintenance_requests
FOR INSERT
TO public -- A role 'public' inclui tanto usuários anônimos quanto autenticados
WITH CHECK (true);