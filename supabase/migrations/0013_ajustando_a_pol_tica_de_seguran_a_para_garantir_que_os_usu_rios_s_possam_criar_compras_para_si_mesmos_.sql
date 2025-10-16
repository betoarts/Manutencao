-- Remove a política de inserção de compras existente, que era muito permissiva.
DROP POLICY IF EXISTS "Authenticated users can create their own purchases" ON public.purchases;

-- Cria uma nova política mais segura que verifica se o ID do usuário na nova compra corresponde ao usuário autenticado.
CREATE POLICY "Authenticated users can create their own purchases" ON public.purchases
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);