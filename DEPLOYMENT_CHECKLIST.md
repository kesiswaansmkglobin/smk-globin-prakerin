# ✅ Deployment Checklist

Gunakan checklist ini untuk memastikan deployment berjalan lancar.

## 📦 Persiapan Build

- [ ] Export project dari Lovable ke GitHub
- [ ] Clone repository ke komputer lokal
- [ ] Jalankan `npm install` berhasil tanpa error
- [ ] Jalankan `npm run build` berhasil
- [ ] Folder `dist` terbuat dengan lengkap

## 🔧 Konfigurasi Supabase

- [ ] Login ke [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Pilih project: **xjnswzidbgxqdxuwpviy**
- [ ] Masuk ke **Authentication** → **URL Configuration**
- [ ] Tambahkan domain hosting ke **Site URL**
- [ ] Tambahkan domain hosting ke **Redirect URLs** (dengan dan tanpa www)
- [ ] Klik **Save**

## 📤 Upload ke Hosting

- [ ] Login ke cPanel Niagahoster
- [ ] Buka File Manager
- [ ] Masuk ke folder `public_html`
- [ ] Backup file lama (jika ada)
- [ ] Hapus semua file default di `public_html`
- [ ] Upload SEMUA file dari folder `dist`
- [ ] Pastikan file `.htaccess` ada di root folder
- [ ] Set permission folder `public_html` ke 755
- [ ] Set permission file ke 644

## 🧪 Testing Aplikasi

### Testing Dasar
- [ ] Buka domain di browser: `https://yourdomain.com`
- [ ] Halaman login muncul dengan benar
- [ ] CSS dan styling tampil sempurna
- [ ] Dark/Light mode bekerja
- [ ] PWA manifest terbaca (cek di DevTools → Application)

### Testing Login & Auth
- [ ] Login dengan akun admin berhasil
- [ ] Login dengan akun kaprog berhasil
- [ ] Logout berhasil dan redirect ke login
- [ ] Refresh halaman tidak logout otomatis

### Testing Fitur CRUD
- [ ] Dashboard menampilkan data statistik
- [ ] Data Siswa: View, Add, Edit, Delete
- [ ] Data Jurusan: View, Add, Edit, Delete
- [ ] Data Kelas: View, Add, Edit, Delete
- [ ] Data Prakerin: View, Add, Edit, Delete
- [ ] Data Pengguna (admin only): View, Add, Edit, Delete

### Testing Filter & Search
- [ ] Search siswa berfungsi
- [ ] Filter data prakerin berfungsi
- [ ] Filter by jurusan berfungsi (untuk kaprog)

### Testing Export
- [ ] Export laporan PDF berfungsi
- [ ] Export data Excel berfungsi
- [ ] Data yang diexport benar dan lengkap

### Testing Mobile
- [ ] Buka di mobile device atau Chrome DevTools mobile view
- [ ] Bottom navigation muncul di mobile
- [ ] Sidebar tersembunyi di mobile
- [ ] Swipe gesture berfungsi
- [ ] Touch controls responsive
- [ ] Install PWA ke home screen berhasil

### Testing Performance
- [ ] First load < 3 detik
- [ ] Subsequent loads < 1 detik (cache)
- [ ] Navigasi antar halaman smooth
- [ ] Tidak ada console error di DevTools
- [ ] Tidak ada 404 error di Network tab

## 🔒 Security Check

- [ ] HTTPS aktif (gembok hijau di browser)
- [ ] Supabase anon key tidak bisa digunakan untuk akses unauthorized
- [ ] RLS policies Supabase aktif dan berfungsi
- [ ] Password hashing berfungsi (tidak bisa login dengan password salah)
- [ ] Session timeout berfungsi
- [ ] File `.htaccess` security headers aktif

## 📱 PWA Check

- [ ] Manifest.json terbaca di DevTools
- [ ] Service Worker registered
- [ ] Install banner muncul di mobile
- [ ] App bisa di-install ke home screen
- [ ] Offline mode berfungsi (cache)
- [ ] App icon muncul di home screen

## 🔄 Post-Deployment

- [ ] Buat backup database Supabase
- [ ] Dokumentasikan URL production
- [ ] Share URL ke stakeholder untuk testing
- [ ] Monitor error logs di Supabase Dashboard
- [ ] Setup monitoring/analytics (opsional)

## ❌ Troubleshooting Quick Fix

| Masalah | Solusi |
|---------|--------|
| Halaman blank/putih | Clear cache browser, periksa console error |
| 404 saat refresh | Periksa `.htaccess` sudah ada dan benar |
| Login tidak berfungsi | Periksa Supabase URL Configuration |
| CSS tidak load | Upload ulang folder `assets`, set permission 755 |
| Data tidak muncul | Periksa Supabase RLS policies dan connection |

## 📞 Support Contact

- **Niagahoster Support**: [niagahoster.co.id](https://www.niagahoster.co.id)
- **Supabase Dashboard**: [supabase.com/dashboard](https://supabase.com/dashboard)
- **Lovable Docs**: [docs.lovable.dev](https://docs.lovable.dev)

---

✅ **Jika semua checklist sudah ✓, deployment Anda berhasil!** 🎉
