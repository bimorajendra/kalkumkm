# RFC-011: Monetisasi dan Lisensi

> **Diubah oleh `docs/CHANGE-001-online-nextjs.md` (27 September 2026):** produk pindah ke Next.js, Postgres, akun, dan model online. Bagian di dokumen ini yang bertentangan dengan CHANGE-001 tidak berlaku.

## Ringkasan
Batas versi gratis, layar paywall, halaman beli, aktivasi Pro offline, dan penerbitan kode lisensi manual dari admin. Halaman beli disiapkan untuk CTA Mayar yang akan dihubungkan RFC-012; transfer/QRIS manual tetap tersedia sebagai cadangan bila dikonfigurasi.

**Kompleksitas**: Medium
**Fitur**: F16 (Batas gratis dan paywall), F17 (Aktivasi Pro offline), F18 (Halaman beli dan cadangan manual), F22 (Penerbitan kode manual)
**Dibangun di atas**: RFC-004 (admin dan PRICING), RFC-005, RFC-007 (resep untuk batas), RFC-010 (lisensi ikut tercadang)
**Dibutuhkan oleh**: RFC-012, RFC-013, RFC-014, RFC-015, RFC-016, RFC-017

## Pendekatan Teknis

### File
```
packages/schema/src/license.ts
packages/schema/src/pricing.ts             # dibuat di RFC-004; RFC ini menambah FREE_LIMITS
scripts/gen-keys.ts
scripts/issue-license.ts
apps/api/src/license.ts
apps/api/migrations/0002_licenses.sql
apps/api/test/license.test.ts
apps/app/src/features/license/keys.ts
apps/app/src/features/license/verify.ts
apps/app/src/features/license/repository.ts
apps/app/src/features/license/limits.ts
apps/app/src/features/license/copy.ts
apps/app/src/features/license/components/paywall-sheet.tsx
apps/app/src/routes/beli.tsx
apps/app/src/routes/aktivasi.tsx
apps/web/src/styles/*                      # tombol dan panel harga mengikuti DESIGN
```

### Format kode (TECH 8.1)
```
payload = { v: 1, id: "lic_<ULID>", n: <nama usaha>, p: "pro", t: <unix detik> }
code    = base64url(JSON kanonik payload) + "." + base64url(signature)
link    = https://app.<domain>/aktivasi#<code>
```
`packages/schema/src/license.ts` menjadi sumber skema dan encode/decode. Tanda tangan/verifikasi memakai `@noble/ed25519`.

### Batas gratis (F16)
- `FREE_LIMITS = { recipes: 3, channels: 1 }`.
- `assertCanCreate` dipanggil di repository resep dan saluran sebelum menulis.
- Sub-resep adalah fitur Pro (RFC-013).
- Paywall menjelaskan manfaat dan harga dari `PRICING`, lalu membuka `/beli`. Data yang sudah ada tidak pernah dihapus atau dikunci.

### Halaman beli dan cadangan manual (F18)
- Harga berasal dari `PRICING`; harga pendiri hanya tampil bila `founderActive` aktif.
- CTA utama berlabel "Bayar dengan Mayar" dan alur checkout dikerjakan di RFC-012.
- Transfer/QRIS statis dan tombol `wa.me` hanya tampil jika `VITE_PAYMENT_BANK_NAME`, `VITE_PAYMENT_ACCOUNT_NAME`, `VITE_PAYMENT_ACCOUNT_NUMBER`, `VITE_PAYMENT_QRIS_IMAGE`, dan `VITE_SELLER_WA` semuanya tersedia. `VITE_PAYMENT_QRIS_IMAGE` menunjuk aset lokal. Nilai kosong berarti jalur manual disembunyikan.
- Kode bisa ditempel manual di halaman beli. Tidak ada rekening atau bukti pembayaran contoh.

### Aktivasi (F17)
- `/aktivasi` menerima kode dari fragmen URL atau input tempel, segera menghapus fragmen dari URL, lalu memverifikasi tanpa jaringan.
- Berhasil: simpan `{ code, payload, activatedAt }` di `settings.license`, tampilkan "Takaran Pro aktif. Terima kasih, <nama>", dan catat `license_activated` sekali.
- Gagal: tampilkan pesan umum "Kode tidak cocok. Periksa lagi atau hubungi kami lewat WhatsApp.".

### Penerbitan manual (F22)
- `POST /admin/orders/:id/license` hanya menerima pesanan `paid` yang ditandai admin setelah memeriksa transfer/QRIS.
- Worker menandatangani payload dengan `LICENSE_PRIVATE_KEY`, menyimpan baris `licenses`, mengubah status menjadi `licensed`, lalu menampilkan tautan aktivasi dan `wa.me` untuk dikirim manual.
- Penerbitan ulang dicatat. Kode lama tetap sah karena pencabutan F36 belum dijadwalkan.
- Skrip `gen-keys` dan `issue-license` tetap tersedia untuk operasional darurat.

## Edge Case
- Kode ditempel dengan spasi atau baris baru: rapikan sebelum verifikasi.
- Lisensi Pro hilang saat memulihkan cadangan: peringatkan pengguna dan minta kode ditempel lagi.
- Jalur manual tidak dikonfigurasi: jangan tampilkan tombol atau instruksi pembayaran manual.

## Aturan Terkait
RU-09, RU-18, RU-22, RU-26, RU-29, RU-30, RU-32, RU-38, RU-48, RU-63, RU-67.

## Testing
- Kode valid, karakter diubah, versi kunci tidak dikenal, dan payload tidak valid.
- API menolak penerbitan manual untuk status selain `paid`; tanpa JWT mendapat `401`; kunci privat tidak muncul di respons atau log.
- J-4 aktivasi kode tetap berhasil offline.

## Acceptance Criteria
- [ ] Batas resep keempat dan saluran kedua diperiksa di repository dan memunculkan paywall tanpa menghapus data.
- [ ] Paywall dan `/beli` memakai harga `PRICING`.
- [ ] CTA Mayar tampil; jalur transfer/QRIS dan WhatsApp hanya tampil jika konfigurasi manual lengkap.
- [ ] Aktivasi kode manual memverifikasi tanda tangan offline dan tidak menyimpan kode di query URL.
- [ ] `POST /admin/orders/:id/license` hanya menerima pesanan `paid`, menyimpan lisensi, mengubah status menjadi `licensed`, dan menghasilkan tautan aktivasi.
- [ ] Kunci privat hanya ada di secret atau `.env.local` yang diabaikan Git.
- [ ] Pemulihan cadangan memperingatkan jika lisensi Pro tergantikan.
