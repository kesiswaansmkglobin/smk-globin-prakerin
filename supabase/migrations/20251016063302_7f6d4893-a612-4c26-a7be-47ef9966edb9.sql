-- Create a security definer function to check if a user can access data for a specific jurusan
-- This function will be used in RLS policies to implement department-scoped access control
CREATE OR REPLACE FUNCTION public.can_access_jurusan_data(_user_id uuid, _jurusan_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Admin can access all jurusan data
  SELECT CASE
    WHEN public.has_role(_user_id, 'admin'::app_role) THEN TRUE
    WHEN public.has_role(_user_id, 'kepala_sekolah'::app_role) THEN TRUE
    -- Kaprog can only access data for their own jurusan
    WHEN public.has_role(_user_id, 'kaprog'::app_role) THEN
      EXISTS (
        SELECT 1 
        FROM public.user_roles ur
        JOIN public.jurusan j ON j.nama = ur.jurusan
        WHERE ur.user_id = _user_id 
          AND ur.role = 'kaprog'::app_role
          AND j.id = _jurusan_id
      )
    ELSE FALSE
  END;
$$;

-- Drop the existing overly permissive policy on siswa table
DROP POLICY IF EXISTS "Authenticated users can view siswa" ON public.siswa;

-- Create new department-scoped SELECT policy for siswa table
CREATE POLICY "Users can view siswa in their department"
ON public.siswa
FOR SELECT
TO authenticated
USING (
  public.can_access_jurusan_data(auth.uid(), jurusan_id)
);

-- Update the ALL policy for siswa to also use department scoping for kaprog
DROP POLICY IF EXISTS "Admin can manage siswa" ON public.siswa;

CREATE POLICY "Admin can manage all siswa"
ON public.siswa
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix prakerin table as well (same issue)
DROP POLICY IF EXISTS "Authenticated users can view prakerin" ON public.prakerin;

-- Create department-scoped policy for prakerin
CREATE POLICY "Users can view prakerin in their department"
ON public.prakerin
FOR SELECT
TO authenticated
USING (
  -- Check access based on the student's jurusan
  EXISTS (
    SELECT 1 FROM public.siswa s
    WHERE s.id = prakerin.siswa_id
      AND public.can_access_jurusan_data(auth.uid(), s.jurusan_id)
  )
);

-- Update prakerin management policy to be department-scoped for kaprog
DROP POLICY IF EXISTS "Admin and Kaprog can manage prakerin" ON public.prakerin;

CREATE POLICY "Admin can manage all prakerin"
ON public.prakerin
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Kaprog can manage prakerin in their department"
ON public.prakerin
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'kaprog'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.siswa s
    WHERE s.id = prakerin.siswa_id
      AND public.can_access_jurusan_data(auth.uid(), s.jurusan_id)
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'kaprog'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.siswa s
    WHERE s.id = prakerin.siswa_id
      AND public.can_access_jurusan_data(auth.uid(), s.jurusan_id)
  )
);

-- Also update kelas table to be department-scoped
DROP POLICY IF EXISTS "Authenticated users can view kelas" ON public.kelas;

CREATE POLICY "Users can view kelas in their department"
ON public.kelas
FOR SELECT
TO authenticated
USING (
  public.can_access_jurusan_data(auth.uid(), jurusan_id)
);