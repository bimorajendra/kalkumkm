# CHANGE-005: Event kalkulator publik

Status: disetujui pemilik melalui chat, 2 Oktober 2026. Memperluas CHANGE-004.

## Keputusan dan dampak

- GA4 tetap hanya di halaman publik dan setelah pengunjung mengizinkan analitik.
- Event yang diizinkan: `calculator_complete`, `calculator_share`, `calculator_signup_click`.
- Properti produk hanya `calculator`: `hpp`, `margin`, `bep`, `price`, atau `ojol`.
- Tidak mengirim input, hasil, nama resep, identitas akun, query string, atau fragmen URL. Event berbagi hanya dikirim setelah aksi berhasil; pembatalan bukan keberhasilan.
- Klik menuju masuk adalah ukuran minat membuat akun, bukan bukti signup berhasil. Tidak menambahkan pelacakan pada alur autentikasi.
- Consent dan kebijakan privasi menjelaskan perluasan ini. Penolakan atau pencabutan consent menghentikan event berikutnya.
- Persetujuan memakai versi v2. Persetujuan v1 hanya untuk pageview sehingga diminta ulang; penolakan v1 tetap dihormati. Event HPP juga berlaku pada enam URL usaha yang diizinkan secara eksplisit.
- Enhanced Measurement tetap harus dimatikan di properti GA4 agar pelacakan otomatis tidak melewati batas ini. Lihat [panduan pageview GA4](https://developers.google.com/analytics/devguides/collection/ga4/views).

## Pengelolaan perubahan

Permintaan awal audit meminta metrik penggunaan dan berbagi. Karena CHANGE-004 hanya mengizinkan pageview, lingkup event dan batas privasinya diajukan sebelum implementasi dan disetujui pemilik. Perintah `/manage-changes` tidak tersedia di sesi ini; keputusan, dampak, dan kriteria verifikasi dicatat di sini. Tidak ada perubahan skema, dependensi, layanan pihak ketiga, atau rumus.

## Kriteria verifikasi

Test browser dengan tag Google dimock: tidak ada event sebelum consent atau setelah penolakan; hitungan gagal tidak dihitung; payload hanya membawa enum dan URL bersih; halaman berakun tidak dilacak.
