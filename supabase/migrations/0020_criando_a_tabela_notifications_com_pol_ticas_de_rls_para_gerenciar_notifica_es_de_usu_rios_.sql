CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- e.g., 'info', 'warning', 'success', 'alert'
  link TEXT, -- Optional link to navigate to
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE TO authenticated USING (auth.uid() = id); -- Corrigido para 'id' para permitir que o usuário atualize sua própria notificação (marcar como lida)

CREATE POLICY "Users can delete their own notifications" ON public.notifications
FOR DELETE TO authenticated USING (auth.uid() = user_id);