-- Fix the RLS policies for hybrid authentication
-- First drop all existing policies to avoid conflicts

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated access to siswa" ON public.siswa;
DROP POLICY IF EXISTS "Allow authenticated access to prakerin" ON public.prakerin;
DROP POLICY IF EXISTS "Allow authenticated access to kelas" ON public.kelas;
DROP POLICY IF EXISTS "Allow authenticated access to jurusan" ON public.jurusan;
DROP POLICY IF EXISTS "Allow authenticated access to sekolah" ON public.sekolah;
DROP POLICY IF EXISTS "Allow authenticated school personnel to access siswa data" ON public.siswa;
DROP POLICY IF EXISTS "Allow authenticated school personnel to access prakerin data" ON public.prakerin;
DROP POLICY IF EXISTS "Allow authenticated school personnel to access kelas data" ON public.kelas;
DROP POLICY IF EXISTS "Allow authenticated school personnel to access jurusan data" ON public.jurusan;
DROP POLICY IF EXISTS "Allow authenticated school personnel to access sekolah data" ON public.sekolah;

-- Create a more permissive function that supports hybrid authentication
CREATE OR REPLACE FUNCTION public.allow_school_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Allow service role (internal operations)
  IF current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role' THEN
    RETURN TRUE;
  END IF;
  
  -- Allow anon role (needed for kaprog custom authentication)
  -- The frontend manages authentication state for kaprog users
  IF current_setting('request.jwt.claims', true)::json ->> 'role' = 'anon' THEN
    RETURN TRUE;
  END IF;
  
  -- Allow authenticated Supabase users (admin)
  IF auth.uid() IS NOT NULL THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Create new policies with unique names
CREATE POLICY "School access policy for siswa"
ON public.siswa
FOR ALL
TO authenticated, anon, service_role
USING (allow_school_access())
WITH CHECK (allow_school_access());

CREATE POLICY "School access policy for prakerin"
ON public.prakerin
FOR ALL
TO authenticated, anon, service_role
USING (allow_school_access())
WITH CHECK (allow_school_access());

CREATE POLICY "School access policy for kelas"
ON public.kelas
FOR ALL
TO authenticated, anon, service_role
USING (allow_school_access())
WITH CHECK (allow_school_access());

CREATE POLICY "School access policy for jurusan"
ON public.jurusan
FOR ALL
TO authenticated, anon, service_role
USING (allow_school_access())
WITH CHECK (allow_school_access());

CREATE POLICY "School access policy for sekolah"
ON public.sekolah
FOR ALL
TO authenticated, anon, service_role
USING (allow_school_access())
WITH CHECK (allow_school_access());