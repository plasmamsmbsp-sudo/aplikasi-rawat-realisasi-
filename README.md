# 🌴 Sistem Input Realisasi Perawatan Kebun — PT Kencana Agri (Kebun Wanggarasi)

Aplikasi web & Android APK untuk pencatatan realisasi kerja perawatan harian kebun pada unit **Plasma BSP** & **Plasma MSM** (Kebun Wanggarasi).

## 📁 Struktur File Proyek
- `index.html` — Antarmuka utama & logo PT Kencana Agri.
- `style.css` — Styling kustom dan navigasi tab.
- `app.js` — Logika master data Afdeling/Blok, satuan unit otomatis, rekapitulasi, tombol **Laporan WhatsApp**, ekspor Excel (`.xlsx` multi-sheet), dan sinkronisasi Google Sheets.
- `package.json` & `capacitor.config.json` — Konfigurasi pembungkusan aplikasi menjadi Android `.apk`.
- `.github/workflows/build-apk.yml` — Workflow otomatis GitHub Actions untuk membangun file `app-debug.apk` setiap kali ada pembaruan kode.

## 📲 Fitur Laporan WhatsApp & Build Android APK
1. **Laporan Ringkasan WhatsApp:** Klik tombol **📲 Laporan WA** untuk mengirim rekap realisasi per tanggal yang dipilih langsung ke grup WhatsApp Afdeling/Kebun.
2. **Download Android `.apk` di GitHub Actions:**
   - Buka tab **Actions** di repositori GitHub Anda.
   - Klik workflow **Build Android APK - Realisasi Perawatan Kencana** yang berstatus centang hijau.
   - Unduh file pada bagian **Artifacts** bernama `Realisasi-Perawatan-Kencana-APK`.