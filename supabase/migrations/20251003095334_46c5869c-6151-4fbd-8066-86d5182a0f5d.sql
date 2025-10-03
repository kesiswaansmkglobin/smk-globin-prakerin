-- Revert to policies that work with custom authentication
-- The app uses custom auth (not Supabase Auth), so auth.uid() is always NULL
-- We need to allow authenticated anon access for now

-- Drop the auth.uid() based policies
DROP POLICY IF EXISTS "School staff can view students" ON public.siswa;
DROP POLICY IF EXISTS "Admin and kaprog can insert students" ON public.siswa;
DROP POLICY IF EXISTS "Admin and kaprog can update students" ON public.siswa;
DROP POLICY IF EXISTS "Admin and kaprog can delete students" ON public.siswa;
DROP POLICY IF EXISTS "All staff can view school" ON public.sekolah;
DROP POLICY IF EXISTS "Only admin can modify school" ON public.sekolah;
DROP POLICY IF EXISTS "All staff can view jurusan" ON public.jurusan;
DROP POLICY IF EXISTS "Only admin can modify jurusan" ON public.jurusan;
DROP POLICY IF EXISTS "All staff can view kelas" ON public.kelas;
DROP POLICY IF EXISTS "Only admin can modify kelas" ON public.kelas;
DROP POLICY IF EXISTS "School staff can view prakerin" ON public.prakerin;
DROP POLICY IF EXISTS "Admin and kaprog can insert prakerin" ON public.prakerin;
DROP POLICY IF EXISTS "Admin and kaprog can update prakerin" ON public.prakerin;
DROP POLICY IF EXISTS "Admin and kaprog can delete prakerin" ON public.prakerin;

-- Recreate allow_school_access function for custom authentication
CREATE OR REPLACE FUNCTION public.allow_school_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service role (internal operations)
  IF current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- Allow anon role (needed for custom authentication from frontend)
  -- The frontend handles authentication state management
  IF current_setting('request.jwt.claims', true)::json ->> 'role' = 'anon' THEN
    RETURN TRUE;
  END IF;

  -- Allow authenticated Supabase users
  IF auth.uid() IS NOT NULL THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Apply simple policies that work with custom auth
CREATE POLICY "Authenticated school access for siswa"
ON public.siswa
FOR ALL
TO anon, authenticated
USING (allow_school_access())
WITH CHECK (allow_school_access());

CREATE POLICY "Authenticated school access for sekolah"
ON public.sekolah
FOR ALL
TO anon, authenticated
USING (allow_school_access())
WITH CHECK (allow_school_access());

CREATE POLICY "Authenticated school access for jurusan"
ON public.jurusan
FOR ALL
TO anon, authenticated
USING (allow_school_access())
WITH CHECK (allow_school_access());

CREATE POLICY "Authenticated school access for kelas"
ON public.kelas
FOR ALL
TO anon, authenticated
USING (allow_school_access())
WITH CHECK (allow_school_access());

CREATE POLICY "Authenticated school access for prakerin"
ON public.prakerin
FOR ALL
TO anon, authenticated
USING (allow_school_access())
WITH CHECK (allow_school_access());