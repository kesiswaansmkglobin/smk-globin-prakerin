-- Add kepala_sekolah role to the users table
-- Update the role constraint to include kepala_sekolah
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'kaprog', 'kepala_sekolah'));

-- Update RLS policies to allow kepala_sekolah access to all data
-- Kepala sekolah should be able to view all data across all jurusan

-- Update allow_school_access function to include kepala_sekolah
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

  -- Allow any authenticated Supabase user (admin, kaprog, kepala_sekolah)
  IF auth.uid() IS NOT NULL THEN
    RETURN TRUE;
  END IF;

  -- Deny anon/public access
  RETURN FALSE;
END;
$function$;