# CHANGE-004: Google Analytics untuk halaman publik

> Status: diminta pemilik dan diterapkan, 1 Oktober 2026.
> Mengubah keputusan awal CHANGE-001 yang meniadakan analitik pihak ketiga.

## Keputusan

- Pakai Measurement ID GA4 `G-ZHKNX419F4` pada halaman dalam route group `(marketing)` saja.
- Kirim pageview saat halaman publik dibuka atau navigasi publik berubah. Path tidak menyertakan query string; referrer dibatasi ke origin. Saat meninggalkan halaman publik, lokasi yang tersimpan di tag dinetralkan ke `/`.
- Jangan muat tag sebelum pengunjung memilih Izinkan analitik. Pilihan Tolak mencegah pemasangan tag; pilihan bisa dibuka lagi dari kebijakan privasi.
- Jangan kirim email, nama, ID pengguna, nama/harga/takaran resep, atau halaman aplikasi berakun. Jangan gunakan User-ID, Google Signals, atau personalisasi iklan.
- Script memakai nonce CSP per respons. CSP hanya membuka koneksi/tag Google yang diperlukan untuk GA4 tanpa fitur Ads.
- Measurement ID diatur lewat `NEXT_PUBLIC_GA_ID` dan dimasukkan saat build Docker. Nilainya bukan rahasia.

## Pengaturan properti GA4

Matikan Enhanced Measurement otomatis pada web data stream, terutama pageview saat perubahan browser history. Tag mengirim pageview manual agar rute berakun tidak tercatat. Verifikasi request memakai Tag Assistant dan panel Network browser sebelum rilis.

Google Analytics memakai cookie untuk membedakan sesi serta mengumpulkan informasi browser/perangkat dan lokasi perkiraan. Kebijakan privasi Takaran menjelaskan pengumpulan ini dan membatasi pengukuran pada halaman publik.
