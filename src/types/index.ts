// Common types for the application
export interface User {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'kaprog' | 'kepala_sekolah';
  jurusan: string;
  created_at: string;
  updated_at: string;
}

export interface Jurusan {
  id: string;
  nama: string;
  created_at: string;
  updated_at: string;
}

export interface Sekolah {
  id: string;
  nama: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  kepala_sekolah?: string;
  created_at: string;
  updated_at: string;
}

export interface Kelas {
  id: string;
  nama: string;
  tingkat: number;
  wali_kelas?: string;
  jurusan_id: string;
  jurusan?: Jurusan;
  created_at: string;
  updated_at: string;
}

export interface Siswa {
  id: string;
  nis: string;
  nama: string;
  kelas_id: string;
  jurusan_id: string;
  jenis_kelamin?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  nama_orangtua?: string;
  telepon_orangtua?: string;
  kelas?: Kelas;
  jurusan?: Jurusan;
  created_at: string;
  updated_at: string;
}

export interface Prakerin {
  id: string;
  siswa_id: string;
  tempat_prakerin?: string;
  alamat_prakerin?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  pembimbing_sekolah?: string;
  pembimbing_industri?: string;
  nilai_akhir?: number;
  keterangan?: string;
  status: string;
  siswa?: Siswa;
  created_at: string;
  updated_at: string;
}

export interface FormData<T> {
  [key: string]: T;
}

export interface LoadingState {
  loading: boolean;
  error: string | null;
}