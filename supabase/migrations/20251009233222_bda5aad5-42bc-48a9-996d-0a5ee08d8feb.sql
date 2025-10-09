-- ==========================================
-- CRITICAL SECURITY FIX: Separate User Roles Table
-- ==========================================

-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'kaprog', 'kepala_sekolah');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  jurusan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function for role checking (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 4. Create function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role_secure(_user_id UUID)
RETURNS TABLE(role TEXT, jurusan TEXT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT, jurusan 
  FROM public.user_roles 
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- 5. Migrate existing roles from users table to user_roles table
INSERT INTO public.user_roles (user_id, role, jurusan)
SELECT id, role::app_role, jurusan
FROM public.users
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 7. Update RLS policies to use new role system
-- Update siswa table policies
DROP POLICY IF EXISTS "Require authentication for siswa access" ON public.siswa;

CREATE POLICY "Authenticated users can view siswa"
ON public.siswa
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'kaprog')
  OR has_role(auth.uid(), 'kepala_sekolah')
);

CREATE POLICY "Admin can manage siswa"
ON public.siswa
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Update prakerin table policies
DROP POLICY IF EXISTS "Require authentication for prakerin access" ON public.prakerin;

CREATE POLICY "Authenticated users can view prakerin"
ON public.prakerin
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'kaprog')
  OR has_role(auth.uid(), 'kepala_sekolah')
);

CREATE POLICY "Admin and Kaprog can manage prakerin"
ON public.prakerin
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'kaprog')
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'kaprog')
);

-- Update other tables similarly
DROP POLICY IF EXISTS "Require authentication for kelas access" ON public.kelas;

CREATE POLICY "Authenticated users can view kelas"
ON public.kelas
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'kaprog')
  OR has_role(auth.uid(), 'kepala_sekolah')
);

CREATE POLICY "Admin can manage kelas"
ON public.kelas
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Require authentication for jurusan access" ON public.jurusan;

CREATE POLICY "Authenticated users can view jurusan"
ON public.jurusan
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'kaprog')
  OR has_role(auth.uid(), 'kepala_sekolah')
);

CREATE POLICY "Admin can manage jurusan"
ON public.jurusan
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Require authentication for sekolah access" ON public.sekolah;

CREATE POLICY "Authenticated users can view sekolah"
ON public.sekolah
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'kaprog')
  OR has_role(auth.uid(), 'kepala_sekolah')
);

CREATE POLICY "Admin can manage sekolah"
ON public.sekolah
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 8. Create trigger for updated_at
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Comment for future reference
COMMENT ON TABLE public.user_roles IS 'Stores user roles separately from user data to prevent privilege escalation attacks. Uses security definer functions to prevent RLS recursion.';