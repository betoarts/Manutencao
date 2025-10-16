-- Torna o campo asset_id opcional na tabela de compras
ALTER TABLE public.purchases
ALTER COLUMN asset_id DROP NOT NULL;

-- Adiciona novas colunas para compras de produtos
ALTER TABLE public.purchases
ADD COLUMN product_name TEXT,
ADD COLUMN quantity INTEGER;

-- Adiciona uma regra para garantir que uma compra seja para um ativo ou para um produto
ALTER TABLE public.purchases
ADD CONSTRAINT asset_or_product_check
CHECK (asset_id IS NOT NULL OR product_name IS NOT NULL);