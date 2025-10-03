-- Drop the overly permissive allow_school_access function and create proper role-based security

-- First, create security definer functions to check user roles and jurusan
-- These functions access the users table with elevated privileges to avoid RLS recursion

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_jurusan(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jurusan FROM public.users WHERE id = user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_kaprog(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'kaprog'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_kepala_sekolah(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'kepala_sekolah'
  );
$$;

-- Function to check if kaprog can access specific jurusan data
CREATE OR REPLACE FUNCTION public.can_access_jurusan(user_id uuid, jurusan_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND (role = 'admin' OR (role = 'kaprog' AND jurusan = jurusan_name))
  );
$$;

-- Now update RLS policies for siswa table (most sensitive)
DROP POLICY IF EXISTS "Authenticated school access for siswa" ON public.siswa;

-- Allow SELECT for all authenticated school staff
CREATE POLICY "School staff can view students"
ON public.siswa
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (
    public.is_admin(auth.uid())
    OR public.is_kepala_sekolah(auth.uid())
    OR (
      public.is_kaprog(auth.uid()) 
      AND EXISTS (
        SELECT 1 FROM public.jurusan j
        WHERE j.id = siswa.jurusan_id
        AND public.can_access_jurusan(auth.uid(), j.nama)
      )
    )
  )
);

-- Only admin and kaprog can INSERT students
CREATE POLICY "Admin and kaprog can insert students"
ON public.siswa
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    public.is_admin(auth.uid())
    OR (
      public.is_kaprog(auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.jurusan j
        WHERE j.id = jurusan_id
        AND public.can_access_jurusan(auth.uid(), j.nama)
      )
    )
  )
);

-- Only admin and kaprog can UPDATE students
CREATE POLICY "Admin and kaprog can update students"
ON public.siswa
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (
    public.is_admin(auth.uid())
    OR (
      public.is_kaprog(auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.jurusan j
        WHERE j.id = siswa.jurusan_id
        AND public.can_access_jurusan(auth.uid(), j.nama)
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    public.is_admin(auth.uid())
    OR (
      public.is_kaprog(auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.jurusan j
        WHERE j.id = jurusan_id
        AND public.can_access_jurusan(auth.uid(), j.nama)
      )
    )
  )
);

-- Only admin and kaprog can DELETE students
CREATE POLICY "Admin and kaprog can delete students"
ON public.siswa
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (
    public.is_admin(auth.uid())
    OR (
      public.is_kaprog(auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.jurusan j
        WHERE j.id = siswa.jurusan_id
        AND public.can_access_jurusan(auth.uid(), j.nama)
      )
    )
  )
);

-- Update policies for other tables (sekolah, jurusan, kelas, prakerin)
-- All authenticated staff can view, only admin can modify

-- SEKOLAH table
DROP POLICY IF EXISTS "Authenticated school access for sekolah" ON public.sekolah;

CREATE POLICY "All staff can view school"
ON public.sekolah
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admin can modify school"
ON public.sekolah
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- JURUSAN table
DROP POLICY IF EXISTS "Authenticated school access for jurusan" ON public.jurusan;

CREATE POLICY "All staff can view jurusan"
ON public.jurusan
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admin can modify jurusan"
ON public.jurusan
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- KELAS table
DROP POLICY IF EXISTS "Authenticated school access for kelas" ON public.kelas;

CREATE POLICY "All staff can view kelas"
ON public.kelas
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admin can modify kelas"
ON public.kelas
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- PRAKERIN table (similar to siswa - kaprog can manage their jurusan)
DROP POLICY IF EXISTS "Authenticated school access for prakerin" ON public.prakerin;

CREATE POLICY "School staff can view prakerin"
ON public.prakerin
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (
    public.is_admin(auth.uid())
    OR public.is_kepala_sekolah(auth.uid())
    OR (
      public.is_kaprog(auth.uid()) 
      AND EXISTS (
        SELECT 1 FROM public.siswa s
        INNER JOIN public.jurusan j ON j.id = s.jurusan_id
        WHERE s.id = prakerin.siswa_id
        AND public.can_access_jurusan(auth.uid(), j.nama)
      )
    )
  )
);

CREATE POLICY "Admin and kaprog can insert prakerin"
ON public.prakerin
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    public.is_admin(auth.uid())
    OR (
      public.is_kaprog(auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.siswa s
        INNER JOIN public.jurusan j ON j.id = s.jurusan_id
        WHERE s.id = siswa_id
        AND public.can_access_jurusan(auth.uid(), j.nama)
      )
    )
  )
);

CREATE POLICY "Admin and kaprog can update prakerin"
ON public.prakerin
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (
    public.is_admin(auth.uid())
    OR (
      public.is_kaprog(auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.siswa s
        INNER JOIN public.jurusan j ON j.id = s.jurusan_id
        WHERE s.id = prakerin.siswa_id
        AND public.can_access_jurusan(auth.uid(), j.nama)
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    public.is_admin(auth.uid())
    OR (
      public.is_kaprog(auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.siswa s
        INNER JOIN public.jurusan j ON j.id = s.jurusan_id
        WHERE s.id = siswa_id
        AND public.can_access_jurusan(auth.uid(), j.nama)
      )
    )
  )
);

CREATE POLICY "Admin and kaprog can delete prakerin"
ON public.prakerin
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (
    public.is_admin(auth.uid())
    OR (
      public.is_kaprog(auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.siswa s
        INNER JOIN public.jurusan j ON j.id = s.jurusan_id
        WHERE s.id = prakerin.siswa_id
        AND public.can_access_jurusan(auth.uid(), j.nama)
      )
    )
  )
);