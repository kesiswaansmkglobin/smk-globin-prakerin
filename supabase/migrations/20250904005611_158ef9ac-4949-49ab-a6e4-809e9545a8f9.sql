-- CRITICAL SECURITY FIX: Replace dangerous "Allow all operations on siswa" policy
-- with proper Row Level Security policies that protect student data

-- First, drop the existing dangerous policy
DROP POLICY IF EXISTS "Allow all operations on siswa" ON public.siswa;

-- Create security definer function to check if user is authenticated and authorized
CREATE OR REPLACE FUNCTION public.is_authenticated_school_staff()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is authenticated via Supabase Auth
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Additional check: ensure user exists in our users table with proper role
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'kaprog')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create function to get current user's role and department
CREATE OR REPLACE FUNCTION public.get_current_user_info()
RETURNS TABLE(user_role TEXT, user_jurusan TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT role, jurusan 
  FROM public.users 
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create secure RLS policies for siswa table

-- Policy 1: Only authenticated school staff can SELECT student data
CREATE POLICY "Authenticated staff can view students"
ON public.siswa FOR SELECT
TO authenticated
USING (
  public.is_authenticated_school_staff() AND
  (
    -- Admins can see all students
    (SELECT user_role FROM public.get_current_user_info()) = 'admin' OR
    -- Kaprog can only see students from their department
    (
      (SELECT user_role FROM public.get_current_user_info()) = 'kaprog' AND
      jurusan_id = (SELECT j.id FROM public.jurusan j WHERE j.nama = (SELECT user_jurusan FROM public.get_current_user_info()))
    )
  )
);

-- Policy 2: Only authenticated staff can INSERT student data
CREATE POLICY "Authenticated staff can insert students"
ON public.siswa FOR INSERT
TO authenticated
WITH CHECK (
  public.is_authenticated_school_staff() AND
  (
    -- Admins can insert students in any department
    (SELECT user_role FROM public.get_current_user_info()) = 'admin' OR
    -- Kaprog can only insert students in their department
    (
      (SELECT user_role FROM public.get_current_user_info()) = 'kaprog' AND
      jurusan_id = (SELECT j.id FROM public.jurusan j WHERE j.nama = (SELECT user_jurusan FROM public.get_current_user_info()))
    )
  )
);

-- Policy 3: Only authenticated staff can UPDATE student data
CREATE POLICY "Authenticated staff can update students"
ON public.siswa FOR UPDATE
TO authenticated
USING (
  public.is_authenticated_school_staff() AND
  (
    -- Admins can update any student
    (SELECT user_role FROM public.get_current_user_info()) = 'admin' OR
    -- Kaprog can only update students from their department
    (
      (SELECT user_role FROM public.get_current_user_info()) = 'kaprog' AND
      jurusan_id = (SELECT j.id FROM public.jurusan j WHERE j.nama = (SELECT user_jurusan FROM public.get_current_user_info()))
    )
  )
)
WITH CHECK (
  public.is_authenticated_school_staff() AND
  (
    -- Admins can update any student
    (SELECT user_role FROM public.get_current_user_info()) = 'admin' OR
    -- Kaprog can only update students in their department
    (
      (SELECT user_role FROM public.get_current_user_info()) = 'kaprog' AND
      jurusan_id = (SELECT j.id FROM public.jurusan j WHERE j.nama = (SELECT user_jurusan FROM public.get_current_user_info()))
    )
  )
);

-- Policy 4: Only admins can DELETE student data (too sensitive for kaprog)
CREATE POLICY "Only admins can delete students"
ON public.siswa FOR DELETE
TO authenticated
USING (
  public.is_authenticated_school_staff() AND
  (SELECT user_role FROM public.get_current_user_info()) = 'admin'
);

-- Apply similar security fixes to related tables that might contain sensitive data

-- Fix prakerin table RLS
DROP POLICY IF EXISTS "Allow all operations on prakerin" ON public.prakerin;

CREATE POLICY "Authenticated staff can view prakerin"
ON public.prakerin FOR SELECT
TO authenticated
USING (
  public.is_authenticated_school_staff() AND
  (
    (SELECT user_role FROM public.get_current_user_info()) = 'admin' OR
    (
      (SELECT user_role FROM public.get_current_user_info()) = 'kaprog' AND
      EXISTS (
        SELECT 1 FROM public.siswa s 
        WHERE s.id = prakerin.siswa_id 
        AND s.jurusan_id = (SELECT j.id FROM public.jurusan j WHERE j.nama = (SELECT user_jurusan FROM public.get_current_user_info()))
      )
    )
  )
);

CREATE POLICY "Authenticated staff can manage prakerin"
ON public.prakerin FOR ALL
TO authenticated
USING (
  public.is_authenticated_school_staff() AND
  (
    (SELECT user_role FROM public.get_current_user_info()) = 'admin' OR
    (
      (SELECT user_role FROM public.get_current_user_info()) = 'kaprog' AND
      EXISTS (
        SELECT 1 FROM public.siswa s 
        WHERE s.id = prakerin.siswa_id 
        AND s.jurusan_id = (SELECT j.id FROM public.jurusan j WHERE j.nama = (SELECT user_jurusan FROM public.get_current_user_info()))
      )
    )
  )
)
WITH CHECK (
  public.is_authenticated_school_staff() AND
  (
    (SELECT user_role FROM public.get_current_user_info()) = 'admin' OR
    (
      (SELECT user_role FROM public.get_current_user_info()) = 'kaprog' AND
      EXISTS (
        SELECT 1 FROM public.siswa s 
        WHERE s.id = prakerin.siswa_id 
        AND s.jurusan_id = (SELECT j.id FROM public.jurusan j WHERE j.nama = (SELECT user_jurusan FROM public.get_current_user_info()))
      )
    )
  )
);