-- Create tasks table
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'completed'
  completed_by TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policies for tasks table
CREATE POLICY "Users can view their own tasks" ON public.tasks
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" ON public.tasks
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON public.tasks
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON public.tasks
FOR DELETE TO authenticated USING (auth.uid() = user_id);