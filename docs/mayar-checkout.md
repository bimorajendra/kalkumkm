# Operasional Checkout Mayar

Arsitektur dan aturan verifikasinya ada di `TECH.md` bagian 6. Dokumen ini hanya konfigurasi dan pengujiannya. Langkah pemasangan di server ada di `docs/deploy.md`.

## Lingkungan

- Sandbox: `https://api.mayar.io/hl/v2`
- Produksi: `https://api.mayar.id/hl/v2`
- Pengembangan dan pengujian memakai sandbox atau Mayar palsu (`billing.test.ts`). Jangan taruh kredensial produksi di lingkungan itu.

## Konfigurasi (file `.env` di server)

| Nama | Nilai |
|---|---|
| `MAYAR_API_KEY` | API key dari Mayar. Kosong berarti tombol beli menampilkan "Pembayaran belum dibuka" |
| `MAYAR_BASE_URL` | Sandbox atau produksi. Hanya dua nilai itu yang diterima |
| `MAYAR_WEBHOOK_TOKEN` | Token acak panjang (`openssl rand -hex 24`) untuk URL webhook |

Jangan menulis nilai rahasia ke repo, log, atau contoh konfigurasi. `MAYAR_API_KEY` hanya dipakai server.

## Webhook

Daftarkan `https://<domain>/api/webhooks/mayar?token=<MAYAR_WEBHOOK_TOKEN>` di dashboard Mayar untuk event pembayaran diterima. Dokumentasi Mayar yang diperiksa belum menetapkan tanda tangan atau header resmi, jadi keamanan bertumpu pada dua hal: token di URL, dan **konfirmasi ulang invoice ke API Mayar** sebelum Pro dibuka. Tambahkan validasi tanda tangan bila Mayar menerbitkan kontrak resminya.

Perilaku server:

- Event dicatat di `mayar_events` dengan kunci unik; pengiriman ulang tidak membuka Pro dua kali.
- Konfirmasi gagal (Mayar tidak bisa dihubungi): balas 503 agar Mayar mengirim ulang.
- Pro dibuka hanya bila status invoice `paid`, nominal sama dengan pesanan, id invoice cocok, dan email pelanggan sama dengan email akun.

## Skenario yang harus diuji di sandbox sebelum produksi

1. Invoice dibuat, belum dibayar: akun tetap gratis, halaman beli menawarkan "Lanjutkan pembayaran".
2. Dibayar: akun menjadi Pro otomatis dalam beberapa detik.
3. Invoice kedaluwarsa: pesanan menjadi `cancelled`.
4. Webhook dikirim dua kali: hanya satu pesanan `paid`, tidak ada galat.
5. Webhook terlambat atau hilang: `/beli` atau tombol *Cek Mayar* di `/admin` tetap membuka Pro.
6. Refund manual di dashboard Mayar, lalu *Tandai refund* di `/admin`: Pro tercabut.

Skenario 1 sampai 6 sudah diuji di `apps/site/src/server/billing.test.ts` dengan Mayar palsu; uji sandbox memastikan bentuk respons Mayar yang nyata cocok.

## Biaya

Pada halaman harga resmi Mayar yang dicek 25 September 2026: biaya platform invoicing 1,5% (Starter), 1% (Business), atau 0% (Enterprise); contoh biaya kanal QRIS 0,7%, VA Rp 4.000, e-wallet 1,5%, sebelum pajak kanal. Pengaturan pembebanan biaya ke pelanggan tidak berlaku untuk Invoice, jadi harga pelanggan tetap (`PRICING`) dan biaya ditanggung proyek. Periksa ulang paket dan biaya aktual sebelum penjualan dibuka. [Harga Mayar](https://mayar.id/pricing) · [Create Invoice v2](https://docs.mayar.id/api-reference-v2/invoice/create)

Pembayaran dan refund produksi, pendaftaran webhook, domain, dan pengaturan akun dilakukan pemilik proyek.
