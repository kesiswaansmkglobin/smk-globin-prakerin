-- Create jurusan table
CREATE TABLE public.jurusan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create users table for Kepala Program
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'kaprog',
  jurusan TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prakerin table
CREATE TABLE public.prakerin (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nis TEXT NOT NULL,
  nama_siswa TEXT NOT NULL,
  jurusan TEXT NOT NULL,
  kelas TEXT,
  tempat_prakerin TEXT,
  alamat_prakerin TEXT,
  tanggal_mulai DATE,
  tanggal_selesai DATE,
  pembimbing_sekolah TEXT,
  pembimbing_industri TEXT,
  nilai_akhir INTEGER,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.jurusan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prakerin ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is an internal school system)
CREATE POLICY "Allow all operations on jurusan" ON public.jurusan FOR ALL USING (true);
CREATE POLICY "Allow all operations on users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all operations on prakerin" ON public.prakerin FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_jurusan_updated_at
  BEFORE UPDATE ON public.jurusan
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prakerin_updated_at
  BEFORE UPDATE ON public.prakerin
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.jurusan (nama) VALUES 
('Teknik Komputer dan Jaringan'),
('Rekayasa Perangkat Lunak'),
('Multimedia'),
('Akuntansi'),
('Administrasi Perkantoran');

INSERT INTO public.users (name, username, password, role, jurusan) VALUES 
('Budi Santoso', 'budi@smkglobin.sch.id', 'password123', 'kaprog', 'Teknik Komputer dan Jaringan'),
('Siti Nurhaliza', 'siti@smkglobin.sch.id', 'password123', 'kaprog', 'Rekayasa Perangkat Lunak'),
('Ahmad Rahman', 'ahmad@smkglobin.sch.id', 'password123', 'kaprog', 'Multimedia');