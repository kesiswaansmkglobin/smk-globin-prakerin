-- Relax (but secure) RLS gate to restore writes for authenticated admin users
-- Only service_role or any authenticated Supabase user can access; anon is denied

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

  -- Allow any authenticated Supabase user (e.g., admin) regardless of presence in public.users
  IF auth.uid() IS NOT NULL THEN
    RETURN TRUE;
  END IF;

  -- Deny anon/public access
  RETURN FALSE;
END;
$function$;