# 🚀 Quick Deployment Guide - Niagahoster

Panduan singkat deployment aplikasi SIM Prakerin ke Niagahoster.

## 📋 TL;DR (Too Long; Didn't Read)

```bash
# 1. Export dari Lovable → GitHub
# 2. Clone dan Build
git clone <your-repo-url>
cd <project-folder>
npm install
npm run build

# 3. Upload semua file dari folder 'dist' ke public_html di hosting
# 4. Tambahkan domain Anda ke Supabase Dashboard → Authentication → URL Configuration
# 5. Test aplikasi di browser
```

## ⚡ Build Commands

```bash
# Development build (dengan source maps)
npm run build:dev

# Production build (optimized)
npm run build
```

## 📁 Struktur File Setelah Upload

```
public_html/
├── .htaccess              ← WAJIB! File routing
├── index.html             ← Entry point
├── robots.txt             ← SEO
├── manifest.json          ← PWA config
├── sw.js                  ← Service Worker
├── assets/
│   ├── index-[hash].js    ← Main JS bundle
│   ├── index-[hash].css   ← Main CSS
│   └── vendor-*.js        ← Split chunks
└── lovable-uploads/       ← Images & assets
```

## 🔗 Supabase Configuration

**WAJIB dilakukan setelah upload:**

1. Buka: https://supabase.com/dashboard
2. Pilih project: `xjnswzidbgxqdxuwpviy`
3. Menu: **Authentication** → **URL Configuration**
4. **Site URL**: `https://yourdomain.com`
5. **Redirect URLs**: Tambahkan:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`
   - `https://yourdomain.com/**`

## 🧪 Quick Test

Setelah upload, test ini:

1. ✅ Buka `https://yourdomain.com` → Halaman login muncul
2. ✅ Login dengan akun admin → Dashboard muncul
3. ✅ Refresh halaman → Tidak error 404
4. ✅ Buka di mobile → Bottom nav muncul
5. ✅ Toggle dark/light mode → Bekerja

## ⚠️ Common Issues

### Halaman Blank
```bash
# Solusi:
1. Clear cache browser (Ctrl+Shift+Delete)
2. Periksa Console (F12) untuk error
3. Pastikan semua file terupload
```

### Error 404 saat Refresh
```bash
# Solusi:
1. Pastikan file .htaccess ada di public_html
2. Periksa isi file .htaccess (lihat PANDUAN_DEPLOYMENT.md)
3. Hubungi support jika mod_rewrite tidak aktif
```

### Login Tidak Berfungsi
```bash
# Solusi:
1. Periksa Supabase URL Configuration sudah benar
2. Tambahkan domain Anda ke Redirect URLs
3. Clear cookies dan session browser
```

## 📊 Build Optimization

Aplikasi sudah dioptimasi dengan:

- ✅ **Code Splitting**: Vendor chunks terpisah
- ✅ **Tree Shaking**: Remove unused code
- ✅ **Minification**: Terser untuk JS
- ✅ **Gzip**: Compression aktif
- ✅ **Lazy Loading**: Components on-demand
- ✅ **Caching**: Browser cache 1 tahun untuk assets
- ✅ **PWA**: Service Worker untuk offline

## 📦 Build Size

Setelah build, size approximation:

- **Total**: ~800 KB - 1.2 MB (compressed)
- **Main JS**: ~200-300 KB (gzipped)
- **Main CSS**: ~50-80 KB (gzipped)
- **Vendor chunks**: Split ke beberapa file kecil
- **First Load**: ~500 KB

## 🔄 Update Process

Untuk update aplikasi di masa depan:

```bash
# 1. Pull changes
git pull origin main

# 2. Install new dependencies (if any)
npm install

# 3. Rebuild
npm run build

# 4. Upload semua file dari 'dist' ke hosting
#    (replace existing files)
```

## 📞 Need Help?

- 📖 **Panduan Lengkap**: Lihat `PANDUAN_DEPLOYMENT.md`
- ✅ **Checklist**: Lihat `DEPLOYMENT_CHECKLIST.md`
- 🆘 **Support**: hubungi support Niagahoster

---

💡 **Pro Tip**: Selalu test di localhost (`npm run dev`) sebelum build production!
