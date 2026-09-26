# Operasional Checkout Mayar

## Lingkungan

- Sandbox: `https://api.mayar.io/hl/v2`
- Produksi: `https://api.mayar.id/hl/v2`
- Development, preview, dan pengujian memakai sandbox atau mock. Jangan masukkan kredensial produksi di lingkungan tersebut.

## Konfigurasi Worker

| Nama | Jenis | Nilai |
|---|---|---|
| `MAYAR_BASE_URL` | Worker var | Base URL sandbox atau produksi sesuai lingkungan |
| `MAYAR_API_KEY` | Worker secret | API key dari Mayar |
| `MAYAR_WEBHOOK_TOKEN` | Worker secret | Token acak panjang untuk URL webhook |

Sebelum menguji checkout lokal, terapkan migrasi D1:

```sh
pnpm --filter @takaran/api exec wrangler d1 migrations apply takaran-orders --local
```

Sebelum rilis, pemilik proyek mengganti `database_id` contoh di `wrangler.toml`, meninjau migrasi, lalu menerapkannya ke database produksi. Jangan jalankan migrasi produksi dari lingkungan preview.

## Cadangan pembayaran manual

Jalur ini opsional. Atur semua nilai berikut pada build `apps/app` agar transfer/QRIS statis dan tombol WhatsApp tampil:

- `VITE_PAYMENT_BANK_NAME`
- `VITE_PAYMENT_ACCOUNT_NAME`
- `VITE_PAYMENT_ACCOUNT_NUMBER`
- `VITE_PAYMENT_QRIS_IMAGE` (path aset QRIS lokal)
- `VITE_SELLER_WA`

Jika salah satu kosong, sembunyikan seluruh jalur manual. Jangan menyimpan nomor rekening atau gambar QRIS contoh di aplikasi.

Jangan menulis nilai secret ke repo, contoh konfigurasi, log, atau browser. `MAYAR_API_KEY` hanya dipakai Worker.

## Checkout dan webhook

1. Buat dan uji invoice di sandbox lebih dulu. Aplikasi memakai `POST /v1/checkout` dan menyimpan token klaim hanya di perangkat.
2. Daftarkan `https://<domain-api>/v1/webhooks/mayar?token=<MAYAR_WEBHOOK_TOKEN>` di Mayar dengan event pembayaran diterima. Dokumentasi API yang diperiksa belum menetapkan kontrak signature/header; gunakan token webhook dan konfirmasi invoice lewat API. Tambahkan validasi signature jika Mayar menerbitkan kontrak resmi yang dapat diuji.
3. Pastikan domain redirect, URL webhook, dan kanal pembayaran sudah terverifikasi sebelum membuka pembayaran produksi.
4. Uji invoice belum dibayar, dibayar, kedaluwarsa, nominal tidak cocok, webhook berulang, serta pengecekan ulang admin.
5. Harga pelanggan tetap mengikuti `PRICING`. Biaya platform dan kanal ditanggung proyek dan perlu diperiksa terhadap paket/kanal aktif.

## Biaya yang dicatat

Pada halaman harga resmi yang dicek 25 September 2026, biaya platform invoicing tercantum 1,5% untuk Starter, 1% untuk Business, dan 0% untuk Enterprise. Contoh biaya kanal: QRIS 0,7%, VA Rp 4.000, dan e-wallet 1,5%, sebelum pajak kanal. Dokumentasi Create Invoice menyatakan pengaturan agar biaya dibayar pelanggan tidak berlaku untuk Invoice. Maka harga Pro yang tampil tetap Rp 79.000/Rp 49.000 dan biaya ditanggung proyek. Periksa ulang paket, kanal, dan biaya aktual sebelum membuka pembayaran. [Harga Mayar](https://mayar.id/pricing) · [Create Invoice v2](https://docs.mayar.id/api-reference-v2/invoice/create)

Pembayaran/refund produksi, pendaftaran webhook, domain, DNS, dan pengaturan akun dilakukan pemilik proyek. Dokumen ini tidak menyimpan kredensial atau mengubah akun layanan.
