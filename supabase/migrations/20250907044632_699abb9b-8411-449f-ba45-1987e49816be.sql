-- Fix critical security vulnerability: Remove anon access from allow_school_access function
-- This function was allowing public access to sensitive student data

CREATE OR REPLACE FUNCTION public.allow_school_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service role (internal operations)
  IF current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role' THEN
    RETURN TRUE;
  END IF;
  
  -- Remove anon role access - this was the security vulnerability!
  -- Anon users should NOT have access to sensitive school data
  
  -- Allow authenticated Supabase users (admin users with proper auth)
  IF auth.uid() IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'kaprog')
    );
  END IF;
  
  RETURN FALSE;
END;
$function$;

-- Create a new function specifically for authenticated school personnel
-- This will be used for the custom authentication system
CREATE OR REPLACE FUNCTION public.is_authenticated_school_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- For service role (backend operations)
  IF current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role' THEN
    RETURN TRUE;
  END IF;
  
  -- For authenticated Supabase users (admin)
  IF auth.uid() IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'kaprog')
    );
  END IF;
  
  -- For custom authentication: check if there's a valid session
  -- This requires the frontend to set proper context or use service role for authenticated requests
  RETURN FALSE;
END;
$function$;

-- Update RLS policies to use the more secure function
DROP POLICY IF EXISTS "School access policy for siswa" ON public.siswa;
CREATE POLICY "Authenticated school access for siswa" 
ON public.siswa 
FOR ALL 
USING (allow_school_access())
WITH CHECK (allow_school_access());

DROP POLICY IF EXISTS "School access policy for sekolah" ON public.sekolah;
CREATE POLICY "Authenticated school access for sekolah" 
ON public.sekolah 
FOR ALL 
USING (allow_school_access())
WITH CHECK (allow_school_access());

DROP POLICY IF EXISTS "School access policy for prakerin" ON public.prakerin;
CREATE POLICY "Authenticated school access for prakerin" 
ON public.prakerin 
FOR ALL 
USING (allow_school_access())
WITH CHECK (allow_school_access());

DROP POLICY IF EXISTS "School access policy for kelas" ON public.kelas;
CREATE POLICY "Authenticated school access for kelas" 
ON public.kelas 
FOR ALL 
USING (allow_school_access())
WITH CHECK (allow_school_access());

DROP POLICY IF EXISTS "School access policy for jurusan" ON public.jurusan;
CREATE POLICY "Authenticated school access for jurusan" 
ON public.jurusan 
FOR ALL 
USING (allow_school_access())
WITH CHECK (allow_school_access());