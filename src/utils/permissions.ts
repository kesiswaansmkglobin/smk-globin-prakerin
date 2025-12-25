import type { User } from '@/types';

/**
 * Check if user can edit data sekolah
 * Only admin can edit
 */
export const canEditSekolah = (user: User | null): boolean => {
  return user?.role === 'admin';
};

/**
 * Check if user can edit data jurusan
 * Only admin can edit
 */
export const canEditJurusan = (user: User | null): boolean => {
  return user?.role === 'admin';
};

/**
 * Check if user can edit data kelas
 * Only admin can edit
 */
export const canEditKelas = (user: User | null): boolean => {
  return user?.role === 'admin';
};

/**
 * Check if user can edit data siswa
 * Only admin can edit (kaprog and kepala_sekolah are view-only)
 */
export const canEditSiswa = (user: User | null): boolean => {
  return user?.role === 'admin';
};

/**
 * Check if user can edit data prakerin
 * Admin and kaprog can edit
 */
export const canEditPrakerin = (user: User | null): boolean => {
  return user?.role === 'admin' || user?.role === 'kaprog';
};

/**
 * Check if user can edit guru pembimbing
 * Admin and kaprog can edit
 */
export const canEditGuruPembimbing = (user: User | null): boolean => {
  return user?.role === 'admin' || user?.role === 'kaprog';
};

/**
 * Check if user can edit bimbingan
 * Admin, kaprog, and guru pembimbing can edit
 */
export const canEditBimbingan = (user: User | null): boolean => {
  return user?.role === 'admin' || user?.role === 'kaprog';
};

/**
 * Check if user can edit nilai prakerin
 * Admin, kaprog can edit
 */
export const canEditNilai = (user: User | null): boolean => {
  return user?.role === 'admin' || user?.role === 'kaprog';
};

/**
 * Check if user can edit laporan prakerin
 * Admin, kaprog can edit
 */
export const canEditLaporanPrakerin = (user: User | null): boolean => {
  return user?.role === 'admin' || user?.role === 'kaprog';
};

/**
 * Check if user can edit jadwal sidang
 * Admin, kaprog can edit
 */
export const canEditJadwalSidang = (user: User | null): boolean => {
  return user?.role === 'admin' || user?.role === 'kaprog';
};

/**
 * Check if user can download reports
 * All authenticated users can download
 */
export const canDownloadReports = (user: User | null): boolean => {
  return !!user;
};

/**
 * Check if user should see filtered data by jurusan
 * Kaprog can only see their own jurusan
 */
export const shouldFilterByJurusan = (user: User | null): boolean => {
  return user?.role === 'kaprog';
};

/**
 * Get filtered jurusan for kaprog
 */
export const getFilteredJurusan = (user: User | null, allJurusan: any[]): any[] => {
  if (!shouldFilterByJurusan(user)) {
    return allJurusan;
  }
  return allJurusan.filter(j => j.nama === user?.jurusan);
};
