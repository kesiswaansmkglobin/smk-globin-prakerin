-- First check if pgcrypto is enabled
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

-- Drop and recreate the extension to ensure it's working
DROP EXTENSION IF EXISTS pgcrypto CASCADE;
CREATE EXTENSION pgcrypto;

-- Test the gen_salt function directly
SELECT gen_salt('bf') as test_salt;

-- Recreate the hash_password function with explicit type casting
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN crypt(password::text, gen_salt('bf'::text));
END;
$function$;

-- Test the hash_password function
SELECT public.hash_password('test123') as test_hash;