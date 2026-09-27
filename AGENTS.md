# AGENTS.md: Takaran (nama kerja)

Instruksi untuk AI coding agent (Claude Code, Codex, Cursor, dan lainnya) yang bekerja di repo ini.
Claude Code: buat `CLAUDE.md` berisi satu baris `@AGENTS.md` agar file ini ikut terbaca.

## Proyek

PWA kalkulator HPP untuk penjual kue dan makanan rumahan. Pengguna memasukkan harga bahan, menyusun resep, lalu melihat HPP per porsi, harga jual yang disarankan, dan untung per jam. Data resep dan harga disimpan di server per akun (Next.js + Postgres); lihat `docs/CHANGE-001-online-nextjs.md`.

## Dokumen (baca sebelum mengerjakan)

| File | Isi | Baca saat |
|---|---|---|
| `PRD.md` | Kebutuhan, ID fitur (FR/NFR/CR), rumus, contoh hitungan | Selalu, untuk fitur apa pun |
| `TECH.md` | Arsitektur, stack, data, pembayaran, keamanan, testing | Kode apa pun |
| `DESIGN.md` | Arah visual, token, komponen, state | Kerja UI |
| `antislop.md` + `skills/antislop-*` | Filter anti-slop dan Delivery Gate | Kerja UI, copy, komentar kode |
| `FEATURES.md`, `RULES.md`, `RFCs/` | Hasil pipeline ai-prd-workflow | Jika sudah ada |
| `docs/CHANGE-001-online-nextjs.md` | Keputusan pindah ke Next.js, Postgres, model online; menang atas dokumen lain yang bertentangan | Selalu |

Urutan otoritas jika bertentangan: `PRD.md` > `FEATURES.md` > `TECH.md` > `RULES.md` > `RFCs/` > `DESIGN.md` (untuk tampilan, `DESIGN.md` yang menang). Jika dokumen bertentangan dengan permintaan di chat, tanyakan dulu.

## Peta repo

```
apps/site       Satu aplikasi Next.js: landing, kalkulator, API, admin (Tailwind, shadcn/ui, Drizzle)
packages/calc   Semua rumus HPP. Satu-satunya tempat rumus boleh ditulis
packages/ui     Token warna, tumpukan isometrik, slider, kartu hasil
packages/schema Harga dan batas paket
deploy/         Caddyfile, backup.sh, env.example
scripts/        size.mjs (cek anggaran ukuran)
docs/           Panduan deploy, catatan operasional, dan CHANGE-001
```

## Perintah

```bash
pnpm install
pnpm dev            # aplikasi (DATABASE_URL=pglite:./.data/dev untuk lokal tanpa Postgres)
pnpm test           # Vitest semua paket (Postgres di dalam proses)
pnpm test:e2e       # Playwright + axe
pnpm typecheck      # tsc --noEmit
pnpm lint           # Biome
pnpm build && pnpm size   # build + cek anggaran ukuran
```

Jika script belum ada, buat dengan nama di atas saat scaffolding. Jangan menebak nama perintah lain.

## Cara kerja

Bekerja seperti senior developer yang **malas soal solusi, tidak pernah malas membaca.**

### 1. Pikir dulu
- Baca kode yang akan disentuh dan telusuri alurnya sebelum menulis.
- Sebutkan asumsi. Jika permintaan bisa dibaca lebih dari satu cara, sebutkan pilihannya dan **tanya**, jangan memilih diam-diam.
- Jangan mulai menulis sebelum bisa menyebutkan kriteria selesai. Untuk fitur, kriterianya adalah acceptance criteria di RFC atau ID FR di PRD.

### 2. Tangga kesederhanaan
Untuk setiap hal yang akan ditulis, berhenti di anak tangga pertama yang berhasil:
1. Apakah memang perlu ada? Jika tidak, lewati (YAGNI).
2. Sudah ada di repo? Pakai ulang.
3. Ada di standard library? Pakai.
4. Fitur bawaan platform? Pakai (CSS daripada JS, constraint DB daripada logika app, primitif framework).
5. Dependensi yang sudah terpasang? Pakai sebelum menambah yang baru.
6. Cukup satu baris? Tulis satu baris.
7. Baru setelah itu: kode paling sedikit yang berfungsi.

Tanpa abstraksi, fitur, atau scaffolding yang tidak diminta. Menghapus lebih baik daripada menambah. Membosankan lebih baik daripada pintar. Perbaiki akar masalah, bukan gejalanya.

### 3. Perubahan presisi
- Sentuh hanya yang dibutuhkan tugas. Jangan merapikan kode, komentar, atau format di sekitarnya.
- Ikuti gaya kode di sekitarnya.
- Hapus hanya kode yang menjadi usang karena perubahanmu. Kode mati lama cukup dilaporkan.

### 4. Selesai berarti terverifikasi
- Jalankan `pnpm typecheck`, `pnpm lint`, dan test yang relevan sampai lulus. Untuk UI, jalankan aplikasinya dan cek di lebar 320 px dan 1280 px, kedua tema, dan hanya keyboard.
- Jangan menyatakan selesai hanya dari membaca kode.
- Laporkan hasil apa adanya. Jika ada cek yang gagal atau dilewati, katakan beserta buktinya.

### Tidak pernah disederhanakan
Validasi input di batas kepercayaan (form, body API, webhook, perintah data), penanganan error yang mencegah data hilang, keamanan, aksesibilitas, dan apa pun yang diminta secara eksplisit.

## Aturan proyek (keras)

1. **Data resep dan harga hanya milik pemilik akun.** Setiap kueri difilter `user_id` dari sesi, tidak ada endpoint yang menerima `user_id` dari klien, dan tidak ada analitik atau log yang membawa nama bahan, resep, atau harga.
2. **Keamanan dulu.** Ikuti aturan keamanan di `docs/CHANGE-001-online-nextjs.md` (autentikasi lewat library, validasi Zod, webhook Mayar diverifikasi ke API Mayar, rahasia hanya di env server).
3. **Rumus hanya di `packages/calc`.** UI, landing, dan API tidak boleh menghitung HPP sendiri.
4. **Angka:** uang input dalam rupiah bulat, persen dalam basis poin (40% = `4000`), hasil antara pakai big.js, pembulatan hanya saat ditampilkan. Tidak ada `parseFloat` pada uang.
5. **Contoh brownies di PRD bagian 7 adalah test tetap.** Jika test itu gagal, perubahanmu yang salah, bukan test-nya.
6. **Anggaran ukuran:** JS awal per halaman ≤ 220 KB gzip, total muatan awal ≤ 300 KB (diubah dari 170/250 KB oleh CHANGE-001 karena runtime Next.js). `pnpm size` harus lulus.
7. **Rahasia:** `.env`, secret Google, API key dan token webhook Mayar tidak pernah di-commit, dicetak ke log, atau ditulis ke file contoh.
8. **Teks UI** berbahasa Indonesia sehari-hari, tanpa tanda pisah panjang, dengan CTA spesifik sesuai `DESIGN.md` bagian 12.
9. **Aksesibilitas:** WCAG 2.2 AA, target sentuh 44 px, fokus terlihat, bisa dipakai penuh dengan keyboard.
10. **Tanpa data palsu:** tidak ada testimoni, statistik, rating, atau logo klien karangan. Pakai `[REAL DATA]` atau jangan tampilkan.

## Tanya dulu sebelum

- Menambah dependensi baru (sebutkan ukuran gzip dan alasannya).
- Mengubah rumus atau hasil di `packages/calc`.
- Mengubah skema Postgres (butuh migrasi di `apps/site/drizzle`).
- Menyentuh alur login atau penerbitan status Pro.
- Menghapus data pengguna atau mengubah format unduhan data.
- Menambah layanan pihak ketiga atau panggilan jaringan baru.
- Mengubah alur pembayaran atau harga.
- Mengerjakan fitur di luar scope v1.0 PRD bagian 4.

## Alur kerja fitur (ai-prd-workflow)

1. Kerjakan satu RFC dalam satu waktu, sesuai urutan di `RFCs/`.
2. Tulis rencana singkat dulu (file yang disentuh, kriteria selesai), tunggu persetujuan, baru menulis kode.
3. Selesaikan dengan menjalankan semua cek dan menunjukkan buktinya per acceptance criterion.
4. Review dilakukan di sesi baru dengan `/review-rfc`.
5. Jika kebutuhan berubah di tengah jalan, jalankan `/manage-changes` sebelum mengubah dokumen.

## Git

- Satu branch per RFC: `rfc-003-alarm-margin`.
- Pesan commit Conventional Commits dalam bahasa Inggris: `feat(calc): add profit per hour`.
- Jangan commit, push, atau membuat PR kecuali diminta.

## Format laporan

Perubahan dulu. Lalu maksimal tiga baris: apa yang sengaja dilewati dan kapan layak ditambahkan. Jika menyederhanakan dengan sengaja, beri komentar singkat di kode berisi trade-off dan jalur upgrade, misalnya `// hitung ulang semua resep; tambah memo jika > 500 resep`.
Balas pemilik proyek dalam Bahasa Indonesia.

## Cek diri sebelum selesai

Sudah baca kode yang disentuh? Bisa pakai anak tangga lebih rendah? Diff minimal dan sesuai gaya? Aturan keras dan hal yang tidak pernah disederhanakan tetap terjaga? Sudah diverifikasi dengan menjalankan cek, bukan hanya dibaca? Untuk UI: Delivery Gate antislop sudah lulus?

<!-- antislop:start -->
## antislop
For UI, copy, accessibility, responsive layout, or code-comment work, read `antislop.md` before starting and apply it during the work.
The optional antislop skill folders are not installed; the core file is the project reference.
<!-- antislop:end -->
