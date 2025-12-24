-- =============================================
-- GURU PEMBIMBING (Supervising Teachers)
-- =============================================
CREATE TABLE public.guru_pembimbing (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nama TEXT NOT NULL,
    nip TEXT,
    email TEXT,
    telepon TEXT,
    jurusan_id UUID REFERENCES public.jurusan(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.guru_pembimbing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage guru_pembimbing"
ON public.guru_pembimbing FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Kaprog can view guru in their department"
ON public.guru_pembimbing FOR SELECT
USING (has_role(auth.uid(), 'kaprog'::app_role) AND can_access_jurusan_data(auth.uid(), jurusan_id));

CREATE POLICY "Kepala sekolah can view all guru"
ON public.guru_pembimbing FOR SELECT
USING (has_role(auth.uid(), 'kepala_sekolah'::app_role));

CREATE POLICY "Guru can view themselves"
ON public.guru_pembimbing FOR SELECT
USING (user_id = auth.uid());

-- Update prakerin table to use guru_pembimbing reference
ALTER TABLE public.prakerin 
ADD COLUMN guru_pembimbing_id UUID REFERENCES public.guru_pembimbing(id) ON DELETE SET NULL;

-- =============================================
-- BIMBINGAN (Guidance/Meeting Records)
-- =============================================
CREATE TABLE public.bimbingan (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    prakerin_id UUID REFERENCES public.prakerin(id) ON DELETE CASCADE NOT NULL,
    guru_pembimbing_id UUID REFERENCES public.guru_pembimbing(id) ON DELETE CASCADE NOT NULL,
    tanggal DATE NOT NULL,
    kegiatan TEXT NOT NULL,
    catatan TEXT,
    paraf BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bimbingan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guru can manage their bimbingan"
ON public.bimbingan FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.guru_pembimbing gp 
    WHERE gp.id = bimbingan.guru_pembimbing_id 
    AND gp.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.guru_pembimbing gp 
    WHERE gp.id = bimbingan.guru_pembimbing_id 
    AND gp.user_id = auth.uid()
));

CREATE POLICY "Admin can manage all bimbingan"
ON public.bimbingan FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Kaprog can view bimbingan in their department"
ON public.bimbingan FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.prakerin p
    JOIN public.siswa s ON s.id = p.siswa_id
    WHERE p.id = bimbingan.prakerin_id
    AND can_access_jurusan_data(auth.uid(), s.jurusan_id)
));

-- =============================================
-- NILAI INDUSTRI (Industry Assessment Items)
-- =============================================
CREATE TABLE public.item_penilaian (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nama TEXT NOT NULL,
    bobot INTEGER DEFAULT 1,
    kategori TEXT DEFAULT 'industri', -- 'industri', 'sidang', 'laporan'
    jurusan_id UUID REFERENCES public.jurusan(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.item_penilaian ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage item_penilaian"
ON public.item_penilaian FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Kaprog can manage item_penilaian in their department"
ON public.item_penilaian FOR ALL
USING (can_access_jurusan_data(auth.uid(), jurusan_id))
WITH CHECK (can_access_jurusan_data(auth.uid(), jurusan_id));

CREATE POLICY "Guru can view item_penilaian"
ON public.item_penilaian FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.guru_pembimbing gp 
    WHERE gp.user_id = auth.uid() AND gp.jurusan_id = item_penilaian.jurusan_id
));

-- =============================================
-- NILAI PRAKERIN (Internship Scores)
-- =============================================
CREATE TABLE public.nilai_prakerin (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    prakerin_id UUID REFERENCES public.prakerin(id) ON DELETE CASCADE NOT NULL,
    item_penilaian_id UUID REFERENCES public.item_penilaian(id) ON DELETE CASCADE NOT NULL,
    nilai NUMERIC(5,2) NOT NULL CHECK (nilai >= 0 AND nilai <= 100),
    keterangan TEXT,
    dinilai_oleh UUID REFERENCES public.guru_pembimbing(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(prakerin_id, item_penilaian_id)
);

ALTER TABLE public.nilai_prakerin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guru can manage nilai for their students"
ON public.nilai_prakerin FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.prakerin p
    JOIN public.guru_pembimbing gp ON gp.id = p.guru_pembimbing_id
    WHERE p.id = nilai_prakerin.prakerin_id
    AND gp.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.prakerin p
    JOIN public.guru_pembimbing gp ON gp.id = p.guru_pembimbing_id
    WHERE p.id = nilai_prakerin.prakerin_id
    AND gp.user_id = auth.uid()
));

CREATE POLICY "Admin can manage all nilai"
ON public.nilai_prakerin FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Kaprog can manage nilai in their department"
ON public.nilai_prakerin FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.prakerin p
    JOIN public.siswa s ON s.id = p.siswa_id
    WHERE p.id = nilai_prakerin.prakerin_id
    AND can_access_jurusan_data(auth.uid(), s.jurusan_id)
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.prakerin p
    JOIN public.siswa s ON s.id = p.siswa_id
    WHERE p.id = nilai_prakerin.prakerin_id
    AND can_access_jurusan_data(auth.uid(), s.jurusan_id)
));

-- =============================================
-- LAPORAN PRAKERIN (Report Submission Lists)
-- =============================================
CREATE TABLE public.laporan_prakerin (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    jurusan_id UUID REFERENCES public.jurusan(id) ON DELETE CASCADE NOT NULL,
    judul TEXT NOT NULL,
    deskripsi TEXT,
    tenggat_waktu TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.laporan_prakerin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kaprog can manage laporan in their department"
ON public.laporan_prakerin FOR ALL
USING (can_access_jurusan_data(auth.uid(), jurusan_id))
WITH CHECK (can_access_jurusan_data(auth.uid(), jurusan_id));

CREATE POLICY "Admin can manage all laporan"
ON public.laporan_prakerin FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Guru can view laporan in their department"
ON public.laporan_prakerin FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.guru_pembimbing gp 
    WHERE gp.user_id = auth.uid() AND gp.jurusan_id = laporan_prakerin.jurusan_id
));

-- =============================================
-- PENGUMPULAN LAPORAN (Report Submissions)
-- =============================================
CREATE TABLE public.pengumpulan_laporan (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    laporan_id UUID REFERENCES public.laporan_prakerin(id) ON DELETE CASCADE NOT NULL,
    siswa_id UUID REFERENCES public.siswa(id) ON DELETE CASCADE NOT NULL,
    prakerin_id UUID REFERENCES public.prakerin(id) ON DELETE CASCADE,
    tanggal_pengumpulan TIMESTAMP WITH TIME ZONE,
    nilai NUMERIC(5,2) CHECK (nilai >= 0 AND nilai <= 100),
    status TEXT DEFAULT 'belum' CHECK (status IN ('belum', 'terlambat', 'tepat_waktu')),
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(laporan_id, siswa_id)
);

ALTER TABLE public.pengumpulan_laporan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kaprog can manage pengumpulan in their department"
ON public.pengumpulan_laporan FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.siswa s 
    WHERE s.id = pengumpulan_laporan.siswa_id 
    AND can_access_jurusan_data(auth.uid(), s.jurusan_id)
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.siswa s 
    WHERE s.id = pengumpulan_laporan.siswa_id 
    AND can_access_jurusan_data(auth.uid(), s.jurusan_id)
));

CREATE POLICY "Admin can manage all pengumpulan"
ON public.pengumpulan_laporan FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- JADWAL SIDANG (Defense Schedule)
-- =============================================
CREATE TABLE public.jadwal_sidang (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    jurusan_id UUID REFERENCES public.jurusan(id) ON DELETE CASCADE NOT NULL,
    nama TEXT NOT NULL,
    tanggal DATE NOT NULL,
    waktu_mulai TIME NOT NULL,
    waktu_selesai TIME NOT NULL,
    ruangan TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.jadwal_sidang ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kaprog can manage jadwal_sidang in their department"
ON public.jadwal_sidang FOR ALL
USING (can_access_jurusan_data(auth.uid(), jurusan_id))
WITH CHECK (can_access_jurusan_data(auth.uid(), jurusan_id));

CREATE POLICY "Admin can manage all jadwal_sidang"
ON public.jadwal_sidang FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Guru can view jadwal_sidang in their department"
ON public.jadwal_sidang FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.guru_pembimbing gp 
    WHERE gp.user_id = auth.uid() AND gp.jurusan_id = jadwal_sidang.jurusan_id
));

-- =============================================
-- PESERTA SIDANG (Defense Participants)
-- =============================================
CREATE TABLE public.peserta_sidang (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    jadwal_sidang_id UUID REFERENCES public.jadwal_sidang(id) ON DELETE CASCADE NOT NULL,
    siswa_id UUID REFERENCES public.siswa(id) ON DELETE CASCADE NOT NULL,
    prakerin_id UUID REFERENCES public.prakerin(id) ON DELETE CASCADE,
    urutan INTEGER DEFAULT 1,
    nilai_sidang NUMERIC(5,2) CHECK (nilai_sidang >= 0 AND nilai_sidang <= 100),
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(jadwal_sidang_id, siswa_id)
);

ALTER TABLE public.peserta_sidang ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kaprog can manage peserta_sidang in their department"
ON public.peserta_sidang FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.siswa s 
    WHERE s.id = peserta_sidang.siswa_id 
    AND can_access_jurusan_data(auth.uid(), s.jurusan_id)
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.siswa s 
    WHERE s.id = peserta_sidang.siswa_id 
    AND can_access_jurusan_data(auth.uid(), s.jurusan_id)
));

CREATE POLICY "Admin can manage all peserta_sidang"
ON public.peserta_sidang FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- PENGUJI SIDANG (Defense Examiners)
-- =============================================
CREATE TABLE public.penguji_sidang (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    jadwal_sidang_id UUID REFERENCES public.jadwal_sidang(id) ON DELETE CASCADE NOT NULL,
    guru_pembimbing_id UUID REFERENCES public.guru_pembimbing(id) ON DELETE CASCADE NOT NULL,
    peran TEXT DEFAULT 'penguji', -- 'penguji', 'ketua', 'sekretaris'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(jadwal_sidang_id, guru_pembimbing_id)
);

ALTER TABLE public.penguji_sidang ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kaprog can manage penguji_sidang in their department"
ON public.penguji_sidang FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.jadwal_sidang js 
    WHERE js.id = penguji_sidang.jadwal_sidang_id 
    AND can_access_jurusan_data(auth.uid(), js.jurusan_id)
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.jadwal_sidang js 
    WHERE js.id = penguji_sidang.jadwal_sidang_id 
    AND can_access_jurusan_data(auth.uid(), js.jurusan_id)
));

CREATE POLICY "Admin can manage all penguji_sidang"
ON public.penguji_sidang FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- FUNCTION: Calculate Final Score
-- =============================================
CREATE OR REPLACE FUNCTION public.calculate_nilai_akhir(p_prakerin_id UUID)
RETURNS NUMERIC(5,2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    avg_nilai NUMERIC(5,2);
BEGIN
    SELECT ROUND(AVG(nilai), 2) INTO avg_nilai
    FROM (
        -- Nilai dari industri/pembimbing
        SELECT nilai FROM public.nilai_prakerin WHERE prakerin_id = p_prakerin_id
        UNION ALL
        -- Nilai sidang
        SELECT nilai_sidang as nilai FROM public.peserta_sidang ps
        JOIN public.prakerin p ON p.siswa_id = ps.siswa_id
        WHERE p.id = p_prakerin_id AND ps.nilai_sidang IS NOT NULL
        UNION ALL
        -- Nilai laporan
        SELECT pl.nilai FROM public.pengumpulan_laporan pl
        WHERE pl.prakerin_id = p_prakerin_id AND pl.nilai IS NOT NULL
    ) all_nilai
    WHERE nilai IS NOT NULL;
    
    RETURN COALESCE(avg_nilai, 0);
END;
$$;

-- =============================================
-- TRIGGERS for updated_at
-- =============================================
CREATE TRIGGER update_guru_pembimbing_updated_at
BEFORE UPDATE ON public.guru_pembimbing
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bimbingan_updated_at
BEFORE UPDATE ON public.bimbingan
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_item_penilaian_updated_at
BEFORE UPDATE ON public.item_penilaian
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nilai_prakerin_updated_at
BEFORE UPDATE ON public.nilai_prakerin
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_laporan_prakerin_updated_at
BEFORE UPDATE ON public.laporan_prakerin
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pengumpulan_laporan_updated_at
BEFORE UPDATE ON public.pengumpulan_laporan
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jadwal_sidang_updated_at
BEFORE UPDATE ON public.jadwal_sidang
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_peserta_sidang_updated_at
BEFORE UPDATE ON public.peserta_sidang
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_penguji_sidang_updated_at
BEFORE UPDATE ON public.penguji_sidang
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Enable Realtime for key tables
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.bimbingan;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nilai_prakerin;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pengumpulan_laporan;
ALTER PUBLICATION supabase_realtime ADD TABLE public.peserta_sidang;