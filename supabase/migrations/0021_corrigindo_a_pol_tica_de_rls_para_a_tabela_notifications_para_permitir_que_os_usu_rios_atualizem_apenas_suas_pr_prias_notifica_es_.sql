-- Primeiro, remova a política incorreta
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Em seguida, crie a política correta
CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE TO authenticated USING (auth.uid() = user_id);