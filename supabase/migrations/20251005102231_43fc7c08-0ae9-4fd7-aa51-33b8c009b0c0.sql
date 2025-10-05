-- Fix critical security vulnerability: Remove anonymous access to sensitive student data
-- Step 1: Drop all policies that depend on allow_school_access()

DROP POLICY IF EXISTS "Authenticated school access for siswa" ON public.siswa;
DROP POLICY IF EXISTS "Authenticated school access for prakerin" ON public.prakerin;
DROP POLICY IF EXISTS "Authenticated school access for kelas" ON public.kelas;
DROP POLICY IF EXISTS "Authenticated school access for jurusan" ON public.jurusan;
DROP POLICY IF EXISTS "Authenticated school access for sekolah" ON public.sekolah;

-- Step 2: Drop the vulnerable function
DROP FUNCTION IF EXISTS public.allow_school_access();

-- Step 3: Create a new secure function that requires authentication
CREATE OR REPLACE FUNCTION public.is_authenticated_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow service role (internal operations only)
  IF current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- Require authenticated Supabase users (admin)
  IF auth.uid() IS NOT NULL THEN
    RETURN TRUE;
  END IF;

  -- For custom authentication (kaprog users), verify they have a valid session
  -- This requires the request to come through authenticated edge function
  IF current_setting('request.jwt.claims', true)::json ->> 'role' = 'authenticated' THEN
    RETURN TRUE;
  END IF;

  -- Deny all anonymous access
  RETURN FALSE;
END;
$$;

-- Step 4: Create new secure RLS policies

-- Siswa table - protect student PII
CREATE POLICY "Require authentication for siswa access"
ON public.siswa
FOR ALL
USING (public.is_authenticated_user())
WITH CHECK (public.is_authenticated_user());

-- Prakerin table - protect internship records
CREATE POLICY "Require authentication for prakerin access"
ON public.prakerin
FOR ALL
USING (public.is_authenticated_user())
WITH CHECK (public.is_authenticated_user());

-- Kelas table
CREATE POLICY "Require authentication for kelas access"
ON public.kelas
FOR ALL
USING (public.is_authenticated_user())
WITH CHECK (public.is_authenticated_user());

-- Jurusan table
CREATE POLICY "Require authentication for jurusan access"
ON public.jurusan
FOR ALL
USING (public.is_authenticated_user())
WITH CHECK (public.is_authenticated_user());

-- Sekolah table
CREATE POLICY "Require authentication for sekolah access"
ON public.sekolah
FOR ALL
USING (public.is_authenticated_user())
WITH CHECK (public.is_authenticated_user());

-- Add security documentation
COMMENT ON FUNCTION public.is_authenticated_user() IS 'Security function that requires authentication - blocks all anonymous access to protect student PII and sensitive data';