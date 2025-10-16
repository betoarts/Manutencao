-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies for each operation
CREATE POLICY "Users can view their own suppliers" ON public.suppliers
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own suppliers" ON public.suppliers
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suppliers" ON public.suppliers
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suppliers" ON public.suppliers
FOR DELETE TO authenticated USING (auth.uid() = user_id);