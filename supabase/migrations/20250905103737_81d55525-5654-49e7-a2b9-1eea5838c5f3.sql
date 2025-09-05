-- Fix critical security vulnerability: Remove anonymous access to sensitive student data
-- The current is_valid_api_request() function allows anonymous users to access student data

-- Create a secure function that only allows authenticated school personnel
CREATE OR REPLACE FUNCTION public.is_authenticated_school_personnel()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is authenticated via Supabase Auth
  IF auth.uid() IS NOT NULL THEN
    -- Additional check: ensure user exists in our users table with proper role
    RETURN EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'kaprog')
    );
  END IF;
  
  -- For service role (internal operations), allow access
  IF current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role' THEN
    RETURN TRUE;
  END IF;
  
  -- Deny all other access (including anonymous users)
  RETURN FALSE;
END;
$$;

-- Update RLS policies for siswa table to use secure authentication
DROP POLICY IF EXISTS "Allow authenticated API requests for siswa" ON public.siswa;

CREATE POLICY "Allow authenticated school personnel to access siswa data"
ON public.siswa
FOR ALL
TO authenticated, anon, service_role
USING (is_authenticated_school_personnel())
WITH CHECK (is_authenticated_school_personnel());

-- Update RLS policies for prakerin table to use secure authentication  
DROP POLICY IF EXISTS "Allow authenticated API requests for prakerin" ON public.prakerin;

CREATE POLICY "Allow authenticated school personnel to access prakerin data"
ON public.prakerin
FOR ALL
TO authenticated, anon, service_role
USING (is_authenticated_school_personnel())
WITH CHECK (is_authenticated_school_personnel());

-- Update RLS policies for other sensitive tables as well
DROP POLICY IF EXISTS "Allow authenticated API requests for kelas" ON public.kelas;

CREATE POLICY "Allow authenticated school personnel to access kelas data"
ON public.kelas
FOR ALL
TO authenticated, anon, service_role
USING (is_authenticated_school_personnel())
WITH CHECK (is_authenticated_school_personnel());

DROP POLICY IF EXISTS "Allow authenticated API requests for jurusan" ON public.jurusan;

CREATE POLICY "Allow authenticated school personnel to access jurusan data"
ON public.jurusan
FOR ALL
TO authenticated, anon, service_role
USING (is_authenticated_school_personnel())
WITH CHECK (is_authenticated_school_personnel());

DROP POLICY IF EXISTS "Allow authenticated API requests for sekolah" ON public.sekolah;

CREATE POLICY "Allow authenticated school personnel to access sekolah data"
ON public.sekolah
FOR ALL
TO authenticated, anon, service_role
USING (is_authenticated_school_personnel())
WITH CHECK (is_authenticated_school_personnel());