-- Cria uma tabela para armazenar configurações da empresa, como a URL do logo
CREATE TABLE public.company_settings (
  id INT PRIMARY KEY DEFAULT 1,
  logo_url TEXT,
  company_name TEXT,
  CONSTRAINT singleton CHECK (id = 1)
);

-- Habilita a Segurança em Nível de Linha (RLS)
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para a tabela de configurações
-- Permite que qualquer pessoa leia as configurações (necessário para exibir o logo publicamente)
CREATE POLICY "Public can read company settings" ON public.company_settings
FOR SELECT USING (true);

-- Permite que usuários autenticados atualizem as configurações
CREATE POLICY "Authenticated users can update settings" ON public.company_settings
FOR UPDATE TO authenticated USING (true);

-- Insere uma linha padrão para garantir que ela exista para futuras atualizações
INSERT INTO public.company_settings (id, company_name) VALUES (1, 'Gestão Ativos') ON CONFLICT (id) DO NOTHING;

-- Cria um "bucket" de armazenamento para os logos e outros ativos da empresa
INSERT INTO storage.buckets (id, name, public)
VALUES ('company_assets', 'company_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de segurança para o armazenamento
-- Permite que usuários autenticados gerenciem os arquivos de logo
CREATE POLICY "Authenticated users can manage logos" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'company_assets')
WITH CHECK (bucket_id = 'company_assets');

-- Permite que qualquer pessoa visualize os logos (necessário para exibir no layout)
CREATE POLICY "Public can view logos" ON storage.objects
FOR SELECT
USING (bucket_id = 'company_assets');