-- Remover a política de SELECT existente (se houver uma que permita acesso público ou amplo)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notifications;

-- Criar uma nova política de SELECT que permite ao usuário ver apenas suas próprias notificações
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT TO authenticated
USING (auth.uid() = user_id);