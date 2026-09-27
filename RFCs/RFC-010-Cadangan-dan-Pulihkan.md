# RFC-010: Cadangan dan Pulihkan

> **Diubah oleh `docs/CHANGE-001-online-nextjs.md` (27 September 2026):** produk pindah ke Next.js, Postgres, akun, dan model online. Bagian di dokumen ini yang bertentangan dengan CHANGE-001 tidak berlaku.

## Ringkasan
Ekspor seluruh data ke satu file dan memulihkannya, dengan validasi, ringkasan sebelum menimpa, dan pengingat berkala.

**Kompleksitas**: Medium
**Fitur**: F15 (Cadangan dan pulihkan, dengan pengingat)
**Dibangun di atas**: RFC-005
**Dibutuhkan oleh**: RFC-011 (lisensi ikut tercadang), RFC-017

## Pendekatan Teknis

### File
```
packages/schema/src/backup.ts                         # Zod format TECH 7.4
apps/app/src/features/backup/export.ts
apps/app/src/features/backup/import.ts
apps/app/src/features/backup/checksum.ts              # SHA-256 via crypto.subtle
apps/app/src/features/backup/copy.ts
apps/app/src/features/backup/components/backup-panel.tsx      # di /lainnya
apps/app/src/features/backup/components/restore-dialog.tsx
apps/app/src/features/backup/components/backup-reminder.tsx
apps/app/src/features/backup/backup.test.ts
e2e/backup.spec.ts
```

### Format
Sesuai TECH 7.4, dengan `data` berisi semua tabel: `ingredients`, `recipes`, `channels`, `quoteOptions`, `priceHistory`, `settings`. `sha256` dihitung dari JSON kanonik `data` (kunci diurutkan).

`priceHistory` disertakan agar riwayat harga (F39, v1.2) tidak hilang saat pindah HP.

### Ekspor
- Nama file `takaran-cadangan-YYYY-MM-DD.json`.
- Jika `navigator.canShare({ files })` true, pakai `navigator.share`; jika tidak, unduh lewat tautan `blob:`.
- Setelah berhasil, `lastBackupAt` diisi dan `backup_exported` terkirim.

### Pulihkan
1. Pilih file, baca sebagai teks (maksimal 20 MB; lebih besar ditolak).
2. `JSON.parse` dalam try/catch, validasi Zod, cek `app === "takaran"`, cek `sha256`.
3. `schemaVersion` lebih tinggi dari versi aplikasi: tolak dengan "File ini dari versi Takaran yang lebih baru. Perbarui aplikasi dulu." Lebih rendah: jalankan fungsi upgrade berurutan.
4. Tampilkan ringkasan: "12 bahan, 5 resep, 2 saluran akan menggantikan data sekarang."
5. Setelah konfirmasi, satu transaksi Dexie: kosongkan semua tabel lalu `bulkAdd`. Gagal di tengah berarti tidak ada yang berubah.

### Pengingat
`BackupReminder` tampil di `/lainnya` dan sebagai banner di Hitung jika ada minimal satu resep dan `lastBackupAt` kosong atau lebih dari 14 hari. Bisa ditutup untuk 7 hari.

## Edge Case
- File diubah manual sehingga checksum salah: ditolak dengan "File cadangan rusak atau sudah diubah."
- Pengguna membatalkan dialog share: tidak dianggap berhasil, `lastBackupAt` tidak berubah.

## Aturan Terkait
RU-09, RU-17, RU-25, RU-32, RU-35, RU-58.

## Testing
- `backup.test.ts`: ekspor lalu pulihkan menghasilkan data identik; checksum salah, JSON rusak, `app` salah, versi lebih baru ditolak; kegagalan di tengah transaksi tidak mengubah data.
- `backup.spec.ts`: ekspor lewat unduhan, pulihkan file tersebut di konteks browser baru, ringkasan tampil, data kembali; pengingat muncul setelah 14 hari (jam dimanipulasi).

## Acceptance Criteria
- [ ] Semua file di bagian Struktur ada
- [ ] File ekspor sesuai skema `packages/schema/src/backup.ts`, berisi 6 tabel dan `sha256`
- [ ] Ekspor memakai Web Share jika tersedia dan unduhan jika tidak
- [ ] `lastBackupAt` diisi dan `backup_exported` terkirim hanya setelah ekspor berhasil
- [ ] Pulihkan menolak JSON rusak, skema tidak valid, `app` salah, checksum salah, versi lebih baru, dan file > 20 MB, masing-masing dengan pesan jelas
- [ ] Ringkasan jumlah data tampil dan pulihkan hanya berjalan setelah konfirmasi
- [ ] Pulihkan berjalan dalam satu transaksi; kegagalan tidak mengubah data
- [ ] Ekspor lalu pulihkan menghasilkan data identik, termasuk lisensi di `settings`
- [ ] Pengingat tampil jika ada resep dan cadangan terakhir kosong atau lebih dari 14 hari, dan bisa ditutup 7 hari
- [ ] `backup.test.ts` dan `backup.spec.ts` lulus; axe tanpa pelanggaran serius
