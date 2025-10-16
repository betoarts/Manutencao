-- Create a simple table for testing connection
CREATE TABLE public.test_connection (
  id INT PRIMARY KEY,
  message TEXT
);

-- Enable RLS for security best practices
ALTER TABLE public.test_connection ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows ANYONE to read from this table
-- This is ONLY for this specific test table.
CREATE POLICY "Public read access" ON public.test_connection
FOR SELECT USING (true);

-- Insert a test row
INSERT INTO public.test_connection (id, message) VALUES (1, 'Connection successful!');