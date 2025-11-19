# 📦 Panduan Deployment ke Niagahoster

Panduan lengkap untuk upload aplikasi SIM Prakerin SMK GLOBIN ke hosting Niagahoster.

## 📋 Prasyarat

1. **Akun Niagahoster** dengan paket hosting yang sudah aktif
2. **Node.js** terinstal di komputer lokal (untuk build)
3. **Git** untuk export project dari Lovable
4. Akses **cPanel** atau **FTP** ke hosting Niagahoster

## 🚀 Langkah-Langkah Deployment

### 1️⃣ Export Project dari Lovable

1. Klik tombol **GitHub** di pojok kanan atas Lovable
2. Pilih **"Export to GitHub"** atau **"Transfer to GitHub"**
3. Pilih repository tujuan atau buat repository baru
4. Tunggu proses export selesai

### 2️⃣ Clone Project ke Komputer Lokal

```bash
# Clone repository dari GitHub
git clone https://github.com/username/repository-name.git

# Masuk ke folder project
cd repository-name

# Install dependencies
npm install
```

### 3️⃣ Build Project untuk Production

```bash
# Jalankan perintah build
npm run build
```

Perintah ini akan membuat folder **`dist`** yang berisi file-file production-ready.

### 4️⃣ Konfigurasi Supabase URL (Opsional)

File `src/integrations/supabase/client.ts` sudah dikonfigurasi dengan URL Supabase Anda:
- **URL**: `https://xjnswzidbgxqdxuwpviy.supabase.co`
- **Anon Key**: Sudah terkonfigurasi di kode

⚠️ **PENTING**: Pastikan URL hosting Anda sudah ditambahkan ke **Supabase Dashboard**:

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Masuk ke **Authentication** → **URL Configuration**
4. Tambahkan domain hosting Anda ke **Redirect URLs**, contoh:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`
5. Klik **Save**

### 5️⃣ Upload ke Niagahoster

#### **Metode A: Menggunakan File Manager cPanel**

1. Login ke **cPanel Niagahoster**
2. Buka **File Manager**
3. Masuk ke folder `public_html` (atau folder domain Anda)
4. **Hapus** semua file default di folder tersebut
5. Buka folder **`dist`** di komputer lokal Anda
6. **Upload SEMUA file dan folder** dari dalam folder `dist` ke `public_html`
7. Pastikan struktur seperti ini di hosting:
   ```
   public_html/
   ├── .htaccess         ← File routing (penting!)
   ├── index.html
   ├── robots.txt
   ├── manifest.json
   ├── sw.js
   ├── assets/           ← Folder dengan file JS dan CSS
   └── ...
   ```

#### **Metode B: Menggunakan FTP/SFTP**

1. Gunakan FileZilla atau FTP client lainnya
2. Koneksi ke hosting Niagahoster dengan kredensial FTP Anda
3. Masuk ke folder `public_html`
4. Hapus semua file default
5. Upload semua file dari folder **`dist`** ke `public_html`

### 6️⃣ Verifikasi File `.htaccess`

File `.htaccess` sudah disertakan di dalam build dan sangat penting untuk routing aplikasi React.

Pastikan file `.htaccess` ada di `public_html` dengan konten berikut:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Handle Authorization Header
  RewriteCond %{HTTP:Authorization} .
  RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
  
  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Rewrite everything else to index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Gzip Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

⚠️ **Jika file `.htaccess` tidak muncul:**
- Di cPanel File Manager, klik **Settings** dan centang **Show Hidden Files**
- Atau buat manual file `.htaccess` di `public_html` dengan konten di atas

### 7️⃣ Testing Aplikasi

1. Buka browser dan akses domain Anda: `https://yourdomain.com`
2. Test fitur-fitur utama:
   - ✅ Login dengan akun admin/kaprog
   - ✅ Navigasi antar menu
   - ✅ Tambah/Edit/Hapus data
   - ✅ Filter dan search data
   - ✅ Export laporan
   - ✅ Dark/Light mode toggle
   - ✅ Responsive di mobile

3. **Jika halaman refresh menampilkan 404:**
   - Periksa file `.htaccess` sudah ada dan benar
   - Pastikan `mod_rewrite` aktif di hosting (hubungi support Niagahoster jika perlu)

## 🔧 Troubleshooting

### ❌ Masalah: Halaman Putih / Blank

**Solusi:**
1. Periksa Console Browser (F12 → Console) untuk error
2. Pastikan semua file di folder `dist` sudah terupload
3. Periksa path di `index.html` sudah benar
4. Clear cache browser (Ctrl+Shift+Delete)

### ❌ Masalah: CSS/JS Tidak Load

**Solusi:**
1. Periksa folder `assets` sudah terupload dengan lengkap
2. Pastikan file permission folder `assets` adalah 755
3. Periksa apakah ada file yang corrupt saat upload
4. Upload ulang folder `assets`

### ❌ Masalah: Routing Tidak Berfungsi (404 saat refresh)

**Solusi:**
1. Pastikan file `.htaccess` ada di root folder (`public_html`)
2. Periksa content file `.htaccess` sesuai panduan di atas
3. Hubungi support Niagahoster untuk memastikan `mod_rewrite` aktif

### ❌ Masalah: Error Koneksi Supabase

**Solusi:**
1. Periksa Supabase Dashboard → Authentication → URL Configuration
2. Tambahkan domain hosting Anda ke Redirect URLs
3. Pastikan tidak ada typo di URL domain
4. Test koneksi dengan cek Network tab di browser (F12 → Network)

### ❌ Masalah: Login Tidak Berfungsi

**Solusi:**
1. Periksa Supabase Dashboard → Authentication → URL Configuration
2. Pastikan **Site URL** diisi dengan domain hosting Anda
3. Pastikan domain Anda ada di **Redirect URLs**
4. Clear cookies dan session browser, coba login lagi

## 🔄 Update Aplikasi di Masa Depan

Jika ada perubahan kode/fitur baru:

1. Pull update dari GitHub ke komputer lokal:
   ```bash
   git pull origin main
   ```

2. Install dependencies baru (jika ada):
   ```bash
   npm install
   ```

3. Build ulang project:
   ```bash
   npm run build
   ```

4. Upload ulang semua file dari folder `dist` ke hosting
   - Bisa replace semua file
   - Atau hanya upload file yang berubah (di folder `assets`)

## 📱 PWA (Progressive Web App)

Aplikasi ini sudah support PWA, artinya:
- ✅ Bisa diinstall di home screen mobile
- ✅ Bekerja offline (cache)
- ✅ Fast loading dengan service worker

Setelah deploy, user bisa install aplikasi dengan:
- **Android**: Chrome → Menu (⋮) → "Add to Home screen"
- **iOS**: Safari → Share → "Add to Home Screen"

## 📊 Optimasi Performance

Aplikasi sudah dioptimasi dengan:
- ✅ Code splitting otomatis
- ✅ Lazy loading komponen
- ✅ Gzip compression
- ✅ Browser caching
- ✅ Minified assets
- ✅ Tree shaking

## 🔒 Keamanan

- ✅ Password di-hash dengan bcrypt (PostgreSQL pgcrypto)
- ✅ Row Level Security (RLS) aktif di Supabase
- ✅ Supabase Anon Key sudah terkonfigurasi (aman untuk client-side)
- ✅ HTTPS otomatis di Niagahoster (via SSL)
- ✅ Security headers di `.htaccess`

## 📞 Bantuan

Jika mengalami kendala:

1. **Support Niagahoster**: 
   - Live Chat: [niagahoster.co.id](https://www.niagahoster.co.id)
   - Telepon: (021) 3970 - 1408

2. **Supabase Issues**:
   - [Supabase Dashboard](https://supabase.com/dashboard)
   - [Supabase Docs](https://supabase.com/docs)

3. **Lovable Community**:
   - [Lovable Discord](https://discord.com/channels/1119885301872070706)
   - [Lovable Docs](https://docs.lovable.dev)

---

✅ **Selamat! Aplikasi SIM Prakerin SMK GLOBIN sudah siap digunakan di hosting pribadi Anda!** 🎉
