-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jurusan_nama ON public.jurusan(nama);
CREATE INDEX IF NOT EXISTS idx_kelas_jurusan_id ON public.kelas(jurusan_id);
CREATE INDEX IF NOT EXISTS idx_siswa_jurusan_id ON public.siswa(jurusan_id);
CREATE INDEX IF NOT EXISTS idx_siswa_kelas_id ON public.siswa(kelas_id);
CREATE INDEX IF NOT EXISTS idx_prakerin_siswa_id ON public.prakerin(siswa_id);
CREATE INDEX IF NOT EXISTS idx_prakerin_status ON public.prakerin(status);

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.hash_password(password text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN crypt(password, hash) = hash;
END;
$function$;

CREATE OR REPLACE FUNCTION public.authenticate_user(input_username text, input_password text)
 RETURNS TABLE(id uuid, name text, username text, role text, jurusan text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;