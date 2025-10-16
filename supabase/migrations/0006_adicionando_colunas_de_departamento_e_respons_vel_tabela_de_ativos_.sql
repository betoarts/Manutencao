-- Adiciona a coluna para associar um ativo a um departamento
ALTER TABLE public.assets
ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Adiciona a coluna para associar um ativo a um usuário responsável (custodiante)
ALTER TABLE public.assets
ADD COLUMN custodian_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;