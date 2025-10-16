-- Create purchases table
CREATE TABLE public.purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  vendor TEXT,
  purchase_date DATE,
  cost NUMERIC,
  invoice_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create policies to ensure users can only manage their own data
CREATE POLICY "Authenticated users can view their own purchases" ON public.purchases
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create their own purchases" ON public.purchases
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own purchases" ON public.purchases
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own purchases" ON public.purchases
FOR DELETE TO authenticated USING (auth.uid() = user_id);