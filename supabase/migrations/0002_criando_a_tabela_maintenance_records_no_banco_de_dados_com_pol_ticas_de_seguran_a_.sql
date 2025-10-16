-- Create maintenance_records table
CREATE TABLE public.maintenance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  completion_date DATE,
  cost NUMERIC,
  status TEXT NOT NULL DEFAULT 'Agendada', -- e.g., Agendada, Em Andamento, Concluída, Cancelada
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own maintenance records"
ON public.maintenance_records FOR SELECT
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own maintenance records"
ON public.maintenance_records FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maintenance records"
ON public.maintenance_records FOR UPDATE
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own maintenance records"
ON public.maintenance_records FOR DELETE
TO authenticated USING (auth.uid() = user_id);