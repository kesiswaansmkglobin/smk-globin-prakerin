-- First, create admin user in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '45591e06-f2f3-4352-b188-6de198502652',
  'authenticated',
  'authenticated',
  'admin@smkglobin.sch.id',
  crypt('Smkglobin1@', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Administrator","role":"admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Update existing tables structure for better relationships
-- Add new tables for sekolah, kelas, siswa

-- Create sekolah table
CREATE TABLE public.sekolah (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  alamat TEXT,
  telepon TEXT,
  email TEXT,
  kepala_sekolah TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kelas table (linked to jurusan)
CREATE TABLE public.kelas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  jurusan_id UUID NOT NULL REFERENCES public.jurusan(id) ON DELETE CASCADE,
  tingkat INTEGER NOT NULL DEFAULT 10, -- 10, 11, 12
  wali_kelas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create siswa table (linked to kelas and jurusan)
CREATE TABLE public.siswa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nis TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  kelas_id UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  jurusan_id UUID NOT NULL REFERENCES public.jurusan(id) ON DELETE CASCADE,
  jenis_kelamin TEXT CHECK (jenis_kelamin IN ('L', 'P')),
  tempat_lahir TEXT,
  tanggal_lahir DATE,
  alamat TEXT,
  telepon TEXT,
  email TEXT,
  nama_orangtua TEXT,
  telepon_orangtua TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update prakerin table to reference siswa instead of storing redundant data
ALTER TABLE public.prakerin 
  DROP COLUMN IF EXISTS nis,
  DROP COLUMN IF EXISTS nama_siswa,
  DROP COLUMN IF EXISTS jurusan,
  DROP COLUMN IF EXISTS kelas,
  ADD COLUMN siswa_id UUID REFERENCES public.siswa(id) ON DELETE CASCADE,
  ADD COLUMN status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'selesai', 'dibatalkan'));

-- Enable RLS on new tables
ALTER TABLE public.sekolah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Allow all operations on sekolah" ON public.sekolah FOR ALL USING (true);
CREATE POLICY "Allow all operations on kelas" ON public.kelas FOR ALL USING (true);
CREATE POLICY "Allow all operations on siswa" ON public.siswa FOR ALL USING (true);

-- Create triggers for timestamps
CREATE TRIGGER update_sekolah_updated_at
  BEFORE UPDATE ON public.sekolah
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kelas_updated_at
  BEFORE UPDATE ON public.kelas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_siswa_updated_at
  BEFORE UPDATE ON public.siswa
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.sekolah (nama, alamat, telepon, kepala_sekolah) VALUES 
('SMK GLOBIN', 'Jl. Contoh Alamat No. 123', '021-1234567', 'Drs. Kepala Sekolah, M.Pd');

-- Insert sample kelas data (assuming we have some jurusan already)
DO $$
DECLARE
    jurusan_record RECORD;
BEGIN
    FOR jurusan_record IN SELECT id, nama FROM public.jurusan LIMIT 3
    LOOP
        INSERT INTO public.kelas (nama, jurusan_id, tingkat, wali_kelas) VALUES 
        (jurusan_record.nama || ' X-1', jurusan_record.id, 10, 'Wali Kelas X-1'),
        (jurusan_record.nama || ' XI-1', jurusan_record.id, 11, 'Wali Kelas XI-1'),
        (jurusan_record.nama || ' XII-1', jurusan_record.id, 12, 'Wali Kelas XII-1');
    END LOOP;
END $$;