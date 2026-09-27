# Checklist rilis v1.0

Jangan buat tag `v1.0.0` sebelum semua item wajib dicentang. Tidak ada nilai rahasia di dokumen ini. Langkah pemasangan server ada di `docs/deploy.md`.

## Pemilik: konfigurasi produksi

- [ ] Domain final mengarah ke server, HTTPS aktif (Caddy)
- [ ] `.env` di server lengkap dan berizin `600`; `.env` dan `BACKUP_PASSPHRASE` ada di password manager
- [ ] Login Google: redirect URI benar, consent screen *In production*
- [ ] `ADMIN_EMAILS` berisi email pemilik saja
- [ ] Mayar: akun dan kanal terverifikasi, webhook terdaftar, `MAYAR_BASE_URL` produksi, uji sandbox lengkap (lihat `docs/mayar-checkout.md`)
- [ ] Port database tidak terbuka dari luar; `ufw` hanya 22, 80, 443; SSH hanya dengan kunci
- [ ] Cadangan harian berjalan, disalin ke luar server, dan **pemulihan sudah diuji**
- [ ] Email kontak dan kebijakan privasi sesuai kenyataan

## Pemeriksaan kode

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm size` lulus
- [ ] `pnpm test:e2e` lulus (lebar 320 dan 1280, tema terang dan gelap); idealnya juga dengan `E2E_DATABASE_URL` ke Postgres sungguhan
- [ ] `docker build` berhasil dan `docker compose up` menyalakan semua layanan
- [ ] Contoh brownies PRD bagian 7 menghasilkan angka yang sama di kartu hasil
- [ ] Delivery Gate antislop punya bukti untuk semua blok tanpa FAIL
- [ ] Uji TalkBack Android dicatat
- [ ] Uji lima penjual nyata di `docs/field-test-notes.md`; bug ditangani atau ditunda dengan alasan
- [ ] Akun A tidak bisa melihat data akun B (`e2e/isolation.spec.ts` lulus)

## Rilis

- [ ] Buat tag `v1.0.0` setelah semua di atas selesai
- [ ] Di server: `git pull && docker compose up -d --build`, lalu buka landing, masuk, dan hitung satu resep
- [ ] Catat commit atau tag, waktu rilis, dan hasil pemeriksaan pascarilis
