# RFC-012: Pembayaran Mayar

## Ringkasan
Checkout Pro melalui Mayar Invoice API v2 saat aplikasi dirilis. Daftar tunggu saat validasi tetap gratis. Transfer/QRIS statis tetap jadi jalur cadangan manual. Pembayaran terkonfirmasi hanya di server; lisensi yang diterbitkan tetap kode Ed25519 dan diverifikasi offline.

**Kompleksitas**: High
**Fitur**: F41 (Checkout otomatis lewat Mayar)
**Dibangun di atas**: RFC-004 (orders, admin, Turnstile), RFC-011 (PRICING dan penerbitan lisensi)
**Dibutuhkan oleh**: RFC-017

## Pendekatan Teknis

### File
```
docs/mayar-checkout.md                   # konfigurasi sandbox dan operasional
apps/api/src/mayar.ts                    # fetch API v2 dan skema respons
apps/api/src/routes/checkout.ts
apps/api/src/routes/webhooks-mayar.ts
apps/api/src/routes/license-claim.ts
apps/api/src/routes/admin-orders.ts      # status Mayar, refund, kirim ulang aktivasi
apps/api/migrations/0003_mayar_checkout.sql
apps/api/test/checkout.test.ts
apps/api/test/webhooks-mayar.test.ts
apps/api/test/license-claim.test.ts
apps/app/src/features/checkout/repository.ts
apps/app/src/features/checkout/copy.ts
apps/app/src/features/checkout/components/checkout-form.tsx
apps/app/src/routes/aktivasi.tsx        # state ?order=<id>
apps/app/src/db/schema.ts               # settings.pendingCheckout
```

### Kontrak API Mayar
- Gunakan API v2: base produksi `https://api.mayar.id/hl/v2`, sandbox `https://api.mayar.io/hl/v2`; create `POST /invoices/create`, detail `GET /invoices/:id`.
- Worker memanggil Mayar dengan `fetch` dan `Authorization: Bearer <MAYAR_API_KEY>`. Jangan menambah SDK atau mengirim API key ke browser.
- Respons API v2 dibaca dari envelope `{ statusCode, messages, data }`; `data.expiredAt` dari create berupa timestamp milidetik.
- Create invoice mengirim nama, email, mobile, deskripsi, `expiredAt` UTC +24 jam, item dengan `rate` dari `PRICING`, dan `extraData.orderId`. Periksa envelope v2 sebelum menyimpan `data.id`, `data.link`, dan waktu kedaluwarsa.
- `MAYAR_BASE_URL` menentukan sandbox atau produksi. Development, preview, dan seluruh test hanya memakai sandbox atau mock.
- Harga Rp 79.000/Rp 49.000 tetap harga pelanggan; biaya platform/kanal ditanggung proyek. Besaran bersih diperiksa sebelum rilis.

### Buat checkout
`POST /v1/checkout` memvalidasi Zod, Turnstile, persetujuan, dan batas 5 permintaan per IP per jam. Body berisi nama, email, WhatsApp, nama usaha, dan token Turnstile, tanpa data usaha. Server memilih harga dari `PRICING`, membuat pesanan `checkout`, menghasilkan `claimToken` acak 32 byte, menyimpan hanya SHA-256 di D1, lalu membuat invoice. Respons `{ orderId, paymentUrl, claimToken }` hanya dikirim sekali dan tidak dicatat di log.

Aplikasi menyimpan `{ orderId, claimToken }` di `settings.pendingCheckout`, lalu membuka `paymentUrl` dengan navigasi browser biasa. Mayar tidak ditampilkan di iframe. Jalur manual hanya tampil bila `VITE_PAYMENT_BANK_NAME`, `VITE_PAYMENT_ACCOUNT_NAME`, `VITE_PAYMENT_ACCOUNT_NUMBER`, `VITE_PAYMENT_QRIS_IMAGE`, dan `VITE_SELLER_WA` semuanya tersedia; jika tidak, jalur itu tidak ditampilkan.

### Webhook dan verifikasi
- Terima event `payment.received`; abaikan event pengingat. Endpoint `POST /v1/webhooks/mayar?token=…` membandingkan token dengan `MAYAR_WEBHOOK_TOKEN` secara constant-time dan tidak pernah mencatat query token. Dokumentasi API yang diperiksa belum menetapkan kontrak signature/header, jadi verifikasi invoice lewat API tetap wajib; tambahkan validasi signature hanya setelah Mayar mendokumentasikan format yang dapat diuji.
- Simpan payload dan kunci event unik ke `webhook_events` sebelum membalas `200`. Jika penyimpanan gagal, balas error agar event bisa dicoba ulang. Duplikat tidak diproses dua kali.
- Setelah event tersimpan, gunakan `ctx.waitUntil` untuk menemukan pesanan dan selalu memanggil `GET /invoices/:id`. Terbitkan lisensi hanya jika respons Mayar menyatakan `paid` dan nominal sama dengan `orders.price_idr`. Jangan percaya redirect browser atau status dari webhook saja.
- Cocokkan `data.id` ke `mayar_invoice_id`. Jika id tidak ada, cocokkan email ke tepat satu pesanan `checkout` dalam 48 jam terakhir, lalu verifikasi bahwa detail invoice menunjukkan email pelanggan yang sama, status `paid`, dan nominal yang cocok. Tidak ada atau lebih dari satu hasil berarti tidak menerbitkan otomatis dan perlu cek admin.
- Saat pembayaran valid, ubah `checkout` menjadi `paid` dengan `pay_method = mayar`, terbitkan lisensi memakai fungsi penanda tangan RFC-011, lalu ubah menjadi `licensed`. Transaksi/idempotensi mencegah penerbitan ganda.
- Admin dapat melihat invoice ID/status, **Cek ulang status di Mayar**, dan tombol `wa.me` untuk mengirim ulang tautan aktivasi. Jika pelanggan kehilangan `claimToken` karena data browser terhapus, dukungan memverifikasi pesanan dan status invoice di Mayar lalu admin mengirim tautan aktivasi kembali lewat WhatsApp. Tidak ada pemulihan mandiri lewat email atau akun. Refund dilakukan manual di Mayar lalu admin menandai `refunded`; lisensi tidak dicabut otomatis karena F36 belum dijadwalkan.

### Klaim lisensi
`GET /v1/checkout/:orderId/license` memerlukan header `X-Claim-Token`. Token yang salah atau pesanan tidak cocok mendapat `404`. Hash token yang diterima dibandingkan secara constant-time. Jika kode sudah terbit, kembalikan kode; bila pembayaran belum terkonfirmasi, balas `202`. Endpoint boleh meminta detail invoice paling sering satu kali setiap 30 detik per pesanan untuk menutup webhook yang hilang.

Halaman `/aktivasi?order=<orderId>` melakukan polling setiap 3 detik maksimal 2 menit. Setelah menerima kode, aplikasi menjalankan verifikasi Ed25519 lokal. Setelah Pro aktif, hapus `settings.pendingCheckout`. Jika belum dibayar atau waktu polling habis, tampilkan bahwa pembayaran belum terkonfirmasi dan pengecekan berlanjut saat aplikasi dibuka lagi.

## Edge Case
- Invoice gagal dibuat: pesanan tidak menjadi `paid`; tampilkan pesan coba lagi dan pertahankan daftar tunggu gratis.
- Invoice kedaluwarsa atau nominal berbeda: jangan menerbitkan lisensi; admin memeriksa dan menyelesaikan manual.
- Webhook terlambat, hilang, atau berulang: klaim dan admin dapat memeriksa ulang invoice; event duplikat idempoten.
- Email cocok ke beberapa pesanan: jangan menebak pesanan; minta admin mencocokkan invoice.
- Refund setelah kode terbit: tandai `refunded`, jelaskan bahwa pencabutan kode tidak tersedia pada v1.
- Mayar tidak tersedia: jalur manual hanya ditampilkan bila sudah dikonfigurasi.

### Referensi resmi
- [Pengantar API Mayar v2](https://docs.mayar.id/api-reference-v2/introduction)
- [Create Invoice v2](https://docs.mayar.id/api-reference-v2/invoice/create)
- [Detail Invoice v2](https://docs.mayar.id/api-reference-v2/invoice/detail)
- [Webhook Mayar v2](https://docs.mayar.id/api-reference-v2/webhook/registerurlhook)
- [Harga Mayar](https://mayar.id/pricing)

## Aturan Terkait
RU-19 s.d. RU-29, RU-31, RU-48, RU-63 s.d. RU-67.

## Testing
- Semua test membuat request ke sandbox atau mock; tidak ada request produksi.
- Uji harga server mengalahkan harga kiriman klien, validasi persetujuan/Turnstile, dan batas IP.
- Uji invoice `paid` dengan nominal benar menerbitkan satu lisensi; status belum dibayar, nominal berbeda, respons gagal, atau event duplikat tidak menerbitkan lisensi tambahan.
- Uji token webhook salah, token klaim salah, status webhook hilang/terlambat, pencocokan email unik/ambigu, dan interval cek 30 detik.
- Uji polling halaman aktivasi, aktivasi offline, dan hapus `pendingCheckout` setelah Pro aktif.

## Acceptance Criteria
- [ ] Checkout server-side membuat invoice API v2 dengan harga yang diambil dari `PRICING`.
- [ ] D1 menyimpan `email`, `mayar_invoice_id`, dan `claim_token_hash`; status yang berlaku meliputi `checkout`, `paid`, `licensed`, `refunded`, dan status daftar tunggu yang sudah ada.
- [ ] Token klaim acak 32 byte hanya disimpan mentah di perangkat dan hanya hash tersimpan di server.
- [ ] Webhook bertoken disimpan secara idempoten, cepat merespons, dan tidak menerbitkan lisensi sebelum `GET invoice` mengonfirmasi status serta nominal.
- [ ] Klaim lisensi tidak membocorkan keberadaan pesanan ke token yang salah dan membatasi pengecekan invoice ke sekali per 30 detik.
- [ ] Aplikasi membuka URL pembayaran dengan navigasi biasa, memeriksa pesanan, mengaktifkan kode secara offline, dan membersihkan checkout tertunda setelah berhasil.
- [ ] Admin dapat cek ulang Mayar, menandai pembayaran manual, melihat status refund, dan mengirim ulang tautan aktivasi.
- [ ] Jalur manual hanya tampil bila semua variabel manual yang disebutkan di atas lengkap; daftar tunggu gratis tetap aktif selama validasi.
- [ ] Tidak ada data resep atau harga usaha yang dikirim; analytics hanya mencatat `checkout_started` dan `checkout_paid` tanpa PII.
- [ ] Seluruh pengujian menggunakan sandbox atau mock; tidak ada kode atau konfigurasi produksi yang dibuat.
