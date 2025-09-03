-- Create extension for password hashing if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to hash passwords
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify passwords
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean AS $$
BEGIN
  RETURN crypt(password, hash) = hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing plain text passwords to hashed versions
UPDATE public.users 
SET password = hash_password(password)
WHERE length(password) < 50; -- Only update if not already hashed

-- Drop the overly permissive RLS policy
DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;

-- Create restrictive RLS policies
-- Only allow admins to read all users
CREATE POLICY "Admin can read all users" ON public.users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.user_metadata->>'role' = 'admin' OR auth.users.email = 'admin@smkglobin.sch.id')
  )
);

-- Allow users to read their own data
CREATE POLICY "Users can read own data" ON public.users
FOR SELECT USING (id = auth.uid());

-- Only allow admins to insert users
CREATE POLICY "Admin can insert users" ON public.users
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.user_metadata->>'role' = 'admin' OR auth.users.email = 'admin@smkglobin.sch.id')
  )
);

-- Only allow admins to update users
CREATE POLICY "Admin can update users" ON public.users
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.user_metadata->>'role' = 'admin' OR auth.users.email = 'admin@smkglobin.sch.id')
  )
);

-- Only allow admins to delete users
CREATE POLICY "Admin can delete users" ON public.users
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.user_metadata->>'role' = 'admin' OR auth.users.email = 'admin@smkglobin.sch.id')
  )
);

-- Create function for secure login verification
CREATE OR REPLACE FUNCTION public.authenticate_user(input_username text, input_password text)
RETURNS TABLE(
  id uuid,
  name text,
  username text,
  role text,
  jurusan text
) AS $$
DECLARE
  user_record public.users%ROWTYPE;
BEGIN
  -- Find user by username
  SELECT * INTO user_record
  FROM public.users u
  WHERE u.username = input_username;
  
  -- Check if user exists and password is correct
  IF user_record.id IS NOT NULL AND verify_password(input_password, user_record.password) THEN
    RETURN QUERY SELECT 
      user_record.id,
      user_record.name,
      user_record.username,
      user_record.role,
      user_record.jurusan;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;