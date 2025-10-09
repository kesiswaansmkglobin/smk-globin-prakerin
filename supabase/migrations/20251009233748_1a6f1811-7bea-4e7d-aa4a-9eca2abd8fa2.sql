-- Seed admin role into user_roles so RLS grants access immediately
INSERT INTO public.user_roles (user_id, role, jurusan)
SELECT au.id, 'admin'::app_role, NULL
FROM auth.users au
WHERE au.email = 'admin@smkglobin.sch.id'
ON CONFLICT (user_id, role) DO NOTHING;

-- Optional: ensure kepala_sekolah mapped if exists in auth
INSERT INTO public.user_roles (user_id, role, jurusan)
SELECT au.id, 'kepala_sekolah'::app_role, NULL
FROM auth.users au
WHERE au.email = 'kepalasekolah@smkglobin.sch.id'
ON CONFLICT (user_id, role) DO NOTHING;