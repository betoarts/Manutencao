-- Cria a tabela para associar produtos a uma ordem de manutenção
CREATE TABLE public.maintenance_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_record_id UUID NOT NULL REFERENCES public.maintenance_records(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity_used INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilita a segurança a nível de linha (RLS)
ALTER TABLE public.maintenance_products ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Usuários autenticados podem ver os produtos usados"
ON public.maintenance_products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários podem registrar produtos em suas manutenções"
ON public.maintenance_products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar os produtos que registraram"
ON public.maintenance_products FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover os produtos que registraram"
ON public.maintenance_products FOR DELETE
TO authenticated
USING (auth.uid() = user_id);