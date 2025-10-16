-- Tabela para armazenar os campos customizados do formulário público
CREATE TABLE public.public_form_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', -- ex: text, textarea, select
  is_required BOOLEAN NOT NULL DEFAULT false,
  options JSONB, -- Para campos do tipo 'select'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.public_form_fields ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança para campos do formulário
CREATE POLICY "Public can read form fields" ON public.public_form_fields
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage form fields" ON public.public_form_fields
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Tabela para armazenar os chamados de manutenção abertos
CREATE TABLE public.maintenance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_name TEXT NOT NULL,
  requester_email TEXT,
  requester_phone TEXT,
  description TEXT NOT NULL,
  custom_data JSONB,
  status TEXT NOT NULL DEFAULT 'Novo', -- ex: Novo, Em Análise, Concluído
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança para chamados
CREATE POLICY "Public can create maintenance requests" ON public.maintenance_requests
FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Authenticated users can view and manage requests" ON public.maintenance_requests
FOR ALL TO authenticated USING (true);