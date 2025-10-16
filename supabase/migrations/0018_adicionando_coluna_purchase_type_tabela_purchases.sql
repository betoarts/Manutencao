-- Adiciona a coluna purchase_type como TEXT e permite valores nulos temporariamente
ALTER TABLE public.purchases
ADD COLUMN purchase_type TEXT;

-- Atualiza as linhas existentes para definir o purchase_type
-- Se asset_id não for nulo, assume-se que é uma compra de 'asset'.
-- Caso contrário, assume-se que é uma compra de 'product'.
UPDATE public.purchases
SET purchase_type = CASE
    WHEN asset_id IS NOT NULL THEN 'asset'
    ELSE 'product'
END;

-- Torna a coluna purchase_type NOT NULL, pois todas as linhas existentes foram atualizadas
ALTER TABLE public.purchases
ALTER COLUMN purchase_type SET NOT NULL;

-- Define um valor padrão para novas inserções
ALTER TABLE public.purchases
ALTER COLUMN purchase_type SET DEFAULT 'product';