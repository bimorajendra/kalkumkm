# RFC-005: Data Lokal dan Kerangka PWA

## Ringkasan
Menyiapkan database IndexedDB, repository pengaturan, kerangka navigasi aplikasi, dan kemampuan offline serta pembaruan PWA. Setelah RFC ini, aplikasi bisa dipasang dan dibuka offline dengan layar kosong yang siap diisi RFC berikutnya.

**Kompleksitas**: Medium
**Fitur**: F2 (Penyimpanan lokal), F3 (PWA offline dan pembaruan)
**Dibangun di atas**: RFC-001
**Dibutuhkan oleh**: RFC-006, RFC-010, RFC-011, RFC-017

## Pendekatan Teknis

### File
```
apps/app/src/db/db.ts                  # instance Dexie
apps/app/src/db/schema.ts              # tipe baris + versi 1
apps/app/src/db/db.test.ts             # skema dan migrasi (fake-indexeddb)
apps/app/src/lib/ulid.ts
apps/app/src/lib/persist.ts            # navigator.storage.persist()
apps/app/src/lib/analytics.ts          # track() dengan ALLOWED_EVENTS
apps/app/src/features/settings/repository.ts
apps/app/src/routes/root-layout.tsx    # navbar kapsul (≥ 640 px) + tab bar (< 640 px)
apps/app/src/routes/hitung.tsx         # state kosong sementara
apps/app/src/routes/bahan.tsx          # state kosong sementara
apps/app/src/routes/resep.tsx          # state kosong sementara
apps/app/src/routes/lainnya.tsx        # tema, versi app
apps/app/src/pwa/update-prompt.tsx
apps/app/src/pwa/install-button.tsx
apps/app/vite.config.ts                # vite-plugin-pwa
e2e/offline.spec.ts
```

### Skema Dexie v1
Sesuai TECH 7.1 (`ingredients`, `recipes`, `channels`, `quoteOptions`, `priceHistory`, `settings`). Tipe baris mengikuti tipe `packages/calc` ditambah `createdAt` dan `updatedAt`.

### Pengaturan
`settings` berisi pasangan `key`/`value`. Kunci yang dikenal: `businessName`, `roundingStep` (default 500), `defaultMarginBp` (default 4000), `license`, `lastBackupAt`, `firstOpenedAt`, `lastRecipeId`, `marginAlarm`. Repository menyediakan `getSetting`, `setSetting`, dan hook `useSetting`.

### Navigasi
- Desktop: navbar kapsul DESIGN 9.1 dengan Kalkulator (`/`), Bahan, Resep, dan tombol tema. Penawaran belum tampil (ditambahkan RFC-015).
- HP: tab bar DESIGN 9.2 dengan Hitung, Bahan, Resep, Lainnya.
- Setiap route yang ditautkan sudah ada dan menampilkan state kosong DESIGN 11 (placeholder ilustrasi berlabel konsep, sesuai DESIGN 13).

### PWA
- `registerType: 'prompt'`; precache app shell, font, ikon, SVG.
- Manifest: `name` "Takaran", `display: standalone`, `theme_color` dan `background_color` dari `--bg`, ikon placeholder `[LOGO]`.
- `UpdatePrompt`: banner "Versi baru tersedia. Muat ulang" dengan tombol; tidak memuat ulang otomatis.
- `InstallButton`: tampil hanya jika `beforeinstallprompt` terjadi; di Safari iOS, tampil petunjuk teks "Bagikan lalu Tambahkan ke Layar Utama".
- `persist.ts` memanggil `navigator.storage.persist()` sekali saat pertama dibuka dan menyimpan `firstOpenedAt`.
- `app_opened` terkirim saat dibuka dengan `installed` dari `display-mode: standalone`.

## Edge Case
- IndexedDB tidak tersedia (mode privat Firefox lama): layar error "Penyimpanan tidak tersedia di browser ini" dengan saran membuka di browser biasa.
- Dua tab terbuka saat versi skema naik: tab lama menerima event `versionchange`, menutup koneksi, dan meminta muat ulang.

## Aturan Terkait
RU-06 s.d. RU-08, RU-15 s.d. RU-17, RU-25 s.d. RU-27, RU-35, RU-40, RU-57, RU-58.

## Testing
- `db.test.ts`: tabel dan indeks versi 1 terbentuk; data contoh bisa ditulis dan dibaca.
- `offline.spec.ts`: buka app, `context.setOffline(true)`, muat ulang, navigasi ke semua tab tanpa error.

## Acceptance Criteria
- [x] Semua file di bagian Struktur ada
- [x] Skema Dexie v1 berisi 6 tabel dan indeks TECH 7.1, diuji dengan `fake-indexeddb`
- [x] Repository pengaturan menyediakan `getSetting`, `setSetting`, `useSetting` dengan default `roundingStep` 500 dan `defaultMarginBp` 4000
- [x] `navigator.storage.persist()` dipanggil sekali dan `firstOpenedAt` tersimpan
- [x] Navbar tampil di ≥ 640 px dan tab bar di < 640 px; setiap item menuju route yang ada
- [x] Route Hitung, Bahan, Resep menampilkan state kosong DESIGN 11
- [x] Setelah kunjungan pertama, aplikasi termuat dan bisa dinavigasi dengan jaringan mati
- [x] Versi baru memunculkan `UpdatePrompt` dan tidak memuat ulang tanpa tindakan pengguna
- [x] `InstallButton` hanya tampil saat pemasangan tersedia; petunjuk iOS tampil di Safari iOS
- [x] Browser tanpa IndexedDB menampilkan layar error yang jelas
- [x] `apps/app/src/lib/analytics.ts` hanya mengirim event di `ALLOWED_EVENTS`; `app_opened` terkirim dengan `installed`
- [x] `offline.spec.ts` lulus; axe tanpa pelanggaran serius di semua route


## Delivery Gate (2026-09-26)

### Hard Gate

- R-02 PASS: teks UI tidak memakai em dash; pemindaian pada source app tidak menemukannya.
- R-03 PASS: e2e/offline.spec.ts membandingkan scrollWidth dengan lebar viewport pada 320, 390, 768, dan 1280 px dalam kedua tema.
- R-17 PASS: tidak ada statistik atau angka klaim di layar aplikasi.
- R-18 PASS: tidak ada testimoni atau profil pelanggan di aplikasi.
- R-23 PASS: ikon SVG diberi judul ikon sementara dan motif loyang diberi label ilustrasi konsep.
- R-24 PASS: tautan navbar, tab, dan CTA menuju route yang terdaftar.
- R-25 PASS: axe tidak melaporkan pelanggaran serious/critical pada route yang diuji dalam kedua tema.
- R-26 PASS: E2E menjalankan tautan CTA, navigasi, toggle tema, install prompt, dan tombol update.
- R-27 PASS: aplikasi punya state loading, kosong, dan error penyimpanan.
- R-28 PASS: tidak ada FAQ di aplikasi.
- R-32 PASS: E2E mengaktifkan route dan tema dengan fokus keyboard serta Enter.
- R-33 PASS: perilaku aplikasi berada di source lokal; Umami hanya untuk analytics yang dikonfigurasi.
- R-34 PASS: delapan kombinasi viewport dan tema lulus E2E serta axe.
- R-35 PASS: build production dibuat, screenshot 320 px dan desktop diperiksa, dan 40 skenario E2E lulus.
- R-36 PASS: tidak ada klaim keamanan, kepatuhan, performa, atau pelanggan di UI.
- R-37 PASS: arah berasal dari Design Read dan dial DESIGN.md ENERGY 2 / RHYTHM 2 / MOTION 2.
- R-38 PASS: tidak ada konten realistis yang direka sebagai bukti sosial atau statistik.

### Purpose-Gate

- R-01 PASS: tidak ada gradien atau glow di kerangka aplikasi.
- R-04 PASS: tab memakai inisial label yang sama; komentar menjelaskan tujuannya.
- R-06 PASS: Instrument Serif dan Plus Jakarta Sans mengikuti karakter buku resep dan alat presisi di DESIGN.md bagian 2.
- R-07 PASS: tidak ada grid atau pola latar.
- R-08 PASS: CTA tidak memakai panah dekoratif.
- R-09 PASS: tidak ada badge kapsul tanpa fungsi.
- R-10 PASS: tidak ada glassmorphism.
- R-12 PASS: bayangan hanya pada notice mengambang agar prompt tetap terbaca di atas layar.
- R-13 PASS: tidak ada efek glow.
- R-14 PASS: kerangka tidak menampilkan kumpulan kartu fitur.
- R-19 PASS: tidak ada animasi; gerak shell tetap sesuai cakupan MOTION 2.
- R-22 PASS: motif loyang dan rak bahan mengacu pada empty state DESIGN.md bagian 3.3.

### Liveliness

- Dials PASS: ENERGY 2 / RHYTHM 2 / MOTION 2 dinyatakan di DESIGN.md bagian 2.
- Konsistensi PASS: route aplikasi memakai shell dan struktur layar yang konsisten.
- Focal point PASS: tiap route menonjolkan satu judul empty state.
- Whitespace PASS: ruang layar menyisakan fokus untuk route kosong yang akan diisi RFC berikutnya.
- Accent PASS: caramel menjadi aksen utama pada CTA, motif, dan route aktif.
- Identity motif PASS: monogram Takaran dan motif alat memanggang mengikat layar aplikasi.
- Design Read PASS: kerangka mengikuti pembacaan produk dan dial yang sudah ada di DESIGN.md.

### Craftsmanship & Quality Locks

- C-1 PASS: keputusan visual mengacu pada DESIGN.md dan konteks usaha kue rumahan.
- C-2 PASS: E2E mengaktifkan CTA, route, tema, install, dan update; tidak ada kontrol mati.
- C-3 PASS: layar hanya memuat navigasi, empty state, dan pengaturan yang diperlukan RFC-005.
- C-4 PASS: E2E mencakup delapan kombinasi ukuran/tema, keyboard, overflow, offline, dan axe.
- C-5 PASS: aplikasi tidak memuat testimoni, rating, atau klaim pelanggan.
- R-05 PASS: layar kosong aplikasi tidak memakai susunan hero dan kartu template.
- R-11 PASS: radius kontrol dan kartu berbeda sesuai token DESIGN.md.
- R-15 PASS: label CTA menyebut tujuan route seperti “Lihat resep” dan “Tambah bahan”.
- R-16 PASS: copy tidak memakai buzzword pemasaran.
- R-20 PASS: motif baking, tipografi serif, dan kosa kata Indonesia memberi konteks produk.
- R-21 PASS: tema sistem, terang, dan gelap dapat dipilih lewat ThemeToggle.
- R-29 PASS: warna memakai palet token Takaran.
- R-30 PASS: layout mengikuti DESIGN.md Takaran, bukan tiruan produk lain.
- R-31 PASS: warna, tipe, motif, dan ritme merujuk pada DESIGN.md bagian 2, 3.3, 4, dan 9.
