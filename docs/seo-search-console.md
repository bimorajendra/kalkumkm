# Menyiapkan mesin pencari untuk Takaran

Lakukan langkah ini setelah domain produksi aktif dengan HTTPS. Sitemap memakai `APP_URL`, yang saat deploy Docker Compose dibentuk dari `DOMAIN` di `.env`.

## Google Search Console

1. Buka [Google Search Console](https://search.google.com/search-console) dan tambahkan properti **Domain** untuk domain Takaran.
2. Ikuti instruksi verifikasi DNS. Tambahkan TXT record yang diberikan ke pengelola DNS, lalu tunggu sampai Google mengonfirmasi verifikasi.
3. Buka **Sitemaps**, masukkan `sitemap.xml`, lalu kirim.
4. Di **Inspeksi URL**, periksa beranda, `/artikel`, dan artikel utama. Setelah URL bisa diakses, pilih **Minta pengindeksan**.
5. Pantau laporan **Performa** untuk impresi, klik, CTR, posisi, dan kueri. Pantau **Pengindeksan halaman** untuk URL yang tidak masuk indeks.

## Bing Webmaster Tools

1. Buka [Bing Webmaster Tools](https://www.bing.com/webmasters/) dan tambahkan domain. Impor properti dari Search Console jika tersedia, atau verifikasi kepemilikan lewat DNS.
2. Kirim `https://DOMAIN/sitemap.xml` melalui menu **Sitemaps**.
3. Gunakan **URL Inspection** untuk memeriksa halaman publik, dan pantau performa pencarian serta status indeks.

## Sebelum meminta indeks

- Pastikan `DOMAIN` pada `.env` adalah domain final tanpa skema, jalur, atau garis miring.
- Buka `https://DOMAIN/robots.txt` dan `https://DOMAIN/sitemap.xml` dari jendela privat. Sitemap harus memakai domain produksi, bukan `localhost` atau domain contoh.
- Pastikan halaman publik tidak meminta login dan artikel mengembalikan status sukses. Halaman dashboard, login, admin, dan API memang dikecualikan.
- Ulangi inspeksi URL setelah konten utama berubah. Pengindeksan dan peringkat tetap ditentukan mesin pencari.

Takaran mendukung GA4 opsional setelah consent. Lihat `CHANGE-004-google-analytics.md` dan perluasan event kalkulator di `CHANGE-005-public-calculator-events.md`. Gunakan Search Console dan Bing Webmaster Tools untuk kueri serta pengindeksan; event kalkulator mengukur penggunaan dan klik menuju masuk, bukan keberhasilan membuat akun.
