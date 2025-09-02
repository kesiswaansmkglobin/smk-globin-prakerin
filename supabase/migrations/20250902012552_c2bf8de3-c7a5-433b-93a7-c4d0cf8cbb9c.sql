-- Fix function search path security issue
ALTER FUNCTION public.update_updated_at_column() SECURITY DEFINER SET search_path = public;

-- Add database indexes for better performance
CREATE INDEX IF NOT EXISTS idx_siswa_kelas_id ON public.siswa(kelas_id);
CREATE INDEX IF NOT EXISTS idx_siswa_jurusan_id ON public.siswa(jurusan_id);
CREATE INDEX IF NOT EXISTS idx_prakerin_siswa_id ON public.prakerin(siswa_id);
CREATE INDEX IF NOT EXISTS idx_kelas_jurusan_id ON public.kelas(jurusan_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_jurusan ON public.users(jurusan);

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_siswa_kelas_jurusan ON public.siswa(kelas_id, jurusan_id);
CREATE INDEX IF NOT EXISTS idx_prakerin_dates ON public.prakerin(tanggal_mulai, tanggal_selesai);

-- Add partial indexes for active prakerin
CREATE INDEX IF NOT EXISTS idx_prakerin_active ON public.prakerin(status) WHERE status = 'aktif';