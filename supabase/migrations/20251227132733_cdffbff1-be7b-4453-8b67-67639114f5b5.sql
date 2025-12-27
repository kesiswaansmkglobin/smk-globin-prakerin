-- Drop existing problematic policy
DROP POLICY IF EXISTS "Users can view siswa in their department" ON siswa;

-- Create security definer function to check guru access to siswa
CREATE OR REPLACE FUNCTION public.guru_can_access_siswa(p_user_id uuid, p_siswa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM prakerin p
    JOIN guru_pembimbing gp ON gp.id = p.guru_pembimbing_id
    WHERE p.siswa_id = p_siswa_id 
    AND gp.user_id = p_user_id
  );
$$;

-- Recreate policy using the security definer function
CREATE POLICY "Users can view siswa in their department" 
ON siswa 
FOR SELECT 
USING (
  can_access_jurusan_data(auth.uid(), jurusan_id) 
  OR public.guru_can_access_siswa(auth.uid(), id)
  OR has_role(auth.uid(), 'guru_pembimbing'::app_role)
);

-- Also add SELECT policy for guru_pembimbing to access jurusan table
DROP POLICY IF EXISTS "Authenticated users can view jurusan" ON jurusan;
CREATE POLICY "Authenticated users can view jurusan" 
ON jurusan 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'kaprog'::app_role) 
  OR has_role(auth.uid(), 'kepala_sekolah'::app_role)
  OR has_role(auth.uid(), 'guru_pembimbing'::app_role)
);

-- Add kelas policy for guru_pembimbing
DROP POLICY IF EXISTS "Users can view kelas in their department" ON kelas;
CREATE POLICY "Users can view kelas in their department" 
ON kelas 
FOR SELECT 
USING (
  can_access_jurusan_data(auth.uid(), jurusan_id)
  OR has_role(auth.uid(), 'guru_pembimbing'::app_role)
);

-- Add sekolah view policy for guru_pembimbing
DROP POLICY IF EXISTS "Authenticated users can view sekolah" ON sekolah;
CREATE POLICY "Authenticated users can view sekolah" 
ON sekolah 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'kaprog'::app_role) 
  OR has_role(auth.uid(), 'kepala_sekolah'::app_role)
  OR has_role(auth.uid(), 'guru_pembimbing'::app_role)
);