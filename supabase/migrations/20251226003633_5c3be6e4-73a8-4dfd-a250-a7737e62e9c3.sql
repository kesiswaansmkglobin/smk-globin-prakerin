-- Add guru_pembimbing to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'guru_pembimbing';

-- Add password column to guru_pembimbing table for login
ALTER TABLE public.guru_pembimbing 
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Function to authenticate guru pembimbing
CREATE OR REPLACE FUNCTION public.authenticate_guru_pembimbing(input_username TEXT, input_password TEXT)
RETURNS TABLE(id UUID, nama TEXT, username TEXT, nip TEXT, email TEXT, jurusan_id UUID, jurusan_nama TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guru_record public.guru_pembimbing%ROWTYPE;
  jurusan_record public.jurusan%ROWTYPE;
BEGIN
  -- Find guru by username
  SELECT * INTO guru_record
  FROM public.guru_pembimbing gp
  WHERE gp.username = input_username;
  
  -- Check if guru exists and password is correct
  IF guru_record.id IS NOT NULL AND verify_password(input_password, guru_record.password) THEN
    -- Get jurusan nama
    SELECT * INTO jurusan_record
    FROM public.jurusan j
    WHERE j.id = guru_record.jurusan_id;
    
    RETURN QUERY SELECT 
      guru_record.id,
      guru_record.nama,
      guru_record.username,
      guru_record.nip,
      guru_record.email,
      guru_record.jurusan_id,
      jurusan_record.nama;
  END IF;
  
  RETURN;
END;
$$;

-- Update RLS policies to include guru_pembimbing role
-- Guru pembimbing can see their own bimbingan data
DROP POLICY IF EXISTS "Guru can manage their bimbingan" ON public.bimbingan;
CREATE POLICY "Guru can manage their bimbingan" 
ON public.bimbingan 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.guru_pembimbing gp
    WHERE gp.id = bimbingan.guru_pembimbing_id 
    AND gp.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'kaprog'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.guru_pembimbing gp
    WHERE gp.id = bimbingan.guru_pembimbing_id 
    AND gp.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'kaprog'::app_role)
);

-- Guru pembimbing can see prakerin data for their students
DROP POLICY IF EXISTS "Guru can view prakerin for their students" ON public.prakerin;
CREATE POLICY "Guru can view prakerin for their students"
ON public.prakerin
FOR SELECT
USING (
  guru_pembimbing_id IN (
    SELECT gp.id FROM public.guru_pembimbing gp WHERE gp.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.siswa s
    WHERE s.id = prakerin.siswa_id 
    AND can_access_jurusan_data(auth.uid(), s.jurusan_id)
  )
);

-- Guru pembimbing can manage nilai for their students
DROP POLICY IF EXISTS "Guru can manage nilai for their students" ON public.nilai_prakerin;
CREATE POLICY "Guru can manage nilai for their students" 
ON public.nilai_prakerin 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.prakerin p
    JOIN public.guru_pembimbing gp ON gp.id = p.guru_pembimbing_id
    WHERE p.id = nilai_prakerin.prakerin_id 
    AND gp.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'kaprog'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.prakerin p
    JOIN public.guru_pembimbing gp ON gp.id = p.guru_pembimbing_id
    WHERE p.id = nilai_prakerin.prakerin_id 
    AND gp.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'kaprog'::app_role)
);

-- Add guru_pembimbing to allowed viewers for siswa
DROP POLICY IF EXISTS "Users can view siswa in their department" ON public.siswa;
CREATE POLICY "Users can view siswa in their department" 
ON public.siswa 
FOR SELECT 
USING (
  can_access_jurusan_data(auth.uid(), jurusan_id)
  OR EXISTS (
    SELECT 1 FROM public.prakerin p
    JOIN public.guru_pembimbing gp ON gp.id = p.guru_pembimbing_id
    WHERE p.siswa_id = siswa.id 
    AND gp.user_id = auth.uid()
  )
);