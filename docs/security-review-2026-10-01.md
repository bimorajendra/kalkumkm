# Pemeriksaan keamanan dan status Pro, 1 Oktober 2026

Paket Pro sekarang ditampilkan sebagai **Segera hadir**. Halaman harga, promosi, pengaturan, editor resep, dan dialog batas paket memakai status tersebut. Formulir serta tautan pembayaran di halaman Pro dihapus. Server action `startCheckout` menolak panggilan langsung tanpa membuka database atau membuat invoice. Akun Pro yang sudah ada dan verifikasi pembayaran lama tetap berjalan.

Audit ini memeriksa kode lokal dan konfigurasi deploy, bukan membuktikan keamanan server produksi. Tidak ada commit, push, deploy, perubahan skema, atau perubahan rumus.

## Temuan yang diperbaiki

### S-01: Berkas rahasia subfolder bisa ikut build Docker (tinggi)

Pola lama `.env` dan `.env.*` di `.dockerignore` hanya mencakup akar konteks. `Dockerfile` menyalin seluruh `apps/site`, sehingga `.env.local` dalam aplikasi dapat ikut ke build context dan lapisan build. Dampaknya bergantung pada isi berkas dan siapa yang bisa mengakses builder/cache; ini bukan bukti bahwa rahasia sudah bocor.

Perbaikan: gunakan `**/.env`, `**/.env.*`, dan `**/.dev.vars`, dengan pengecualian hanya untuk contoh konfigurasi. Folder backup juga dikecualikan dari Docker dan Git. Pola rekursif mengikuti [dokumentasi Docker](https://docs.docker.com/build/concepts/context/). Pemindaian nama berkas terlacak hanya menemukan contoh env, bukan berkas env aktual; pencarian terbatas pola private key dan token umum tidak menemukan kecocokan.

### S-02: Kegagalan dump dianggap backup sukses (sedang)

Pada `deploy/backup.sh`, `pg_dump | gzip` sebelumnya mengambil status proses terakhir. Ketika `pg_dump` gagal tetapi `gzip` sukses, berkas kosong dapat dipromosikan menjadi backup sukses. Retensi tetap menghapus backup lama walaupun backup baru gagal.

Perbaikan: aktifkan `pipefail` untuk shell pada image Alpine, jalankan retensi hanya setelah backup berhasil, dan tambahkan `umask 077` untuk izin berkas pada Linux.

Bukti reproduksi: sebelum perbaikan, mock `pg_dump` yang keluar dengan kode 1 menghasilkan `backup_reported_success_despite_dump_failure`. Setelah perbaikan, simulasi pada salinan skrip mencetak `cadangan GAGAL`, tidak meninggalkan berkas backup, dan tidak menjalankan retensi. Jalur sukses menghasilkan gzip valid berisi fixture dan menjalankan retensi. Pengujian memakai Git Bash Windows; izin POSIX dan image Alpine belum diuji langsung.

## Perbaikan temuan lanjutan

### S-03: Server action login tidak dibatasi (sedang), diperbaiki

Lokasi: apps/site/src/app/masuk/page.tsx dan apps/site/src/server/auth.ts.

Tombol login memanggil auth.api.signInSocial langsung dari server action sehingga limiter HTTP Better Auth tidak berlaku. Perbaikan: server action mengambil IP dari header yang ditimpa Caddy, melakukan hash dengan IP_SALT, lalu memakai consumeRateLimit pada tabel yang sudah ada untuk membatasi inisiasi OAuth hingga 30 kali per menit. Kunci disimpan dalam bentuk hash, bukan alamat IP mentah. Percobaan ke-31 ditolak dengan pesan yang dapat dibaca pengguna. Tes memverifikasi batas, pergantian jendela waktu, pemisahan antar-IP, dan tidak disimpannya IP mentah.

### S-04: Enkripsi backup belum wajib (sedang), diperbaiki dengan tindak lanjut operasional

BACKUP_PASSPHRASE sebelumnya boleh kosong; dump tanpa enkripsi berisiko memuat data akun dan autentikasi yang sensitif.

Perbaikan: Compose sekarang gagal jika passphrase tidak disediakan. Skrip backup juga menolak berjalan tanpa passphrase, mengenkripsi dump sebelum mempromosikannya sebagai cadangan, menghapus berkas sementara saat gagal, dan hanya menjalankan retensi setelah sukses. Passphrase hanya diteruskan ke container backup, bukan container aplikasi. Contoh konfigurasi meminta passphrase acak yang disimpan di password manager.

Langkah operasional sebelum rilis: salin backup terenkripsi ke luar server dan uji pemulihan ke database kosong. Simulasi lokal menolak passphrase kosong, lalu membuat backup terenkripsi yang berhasil didekripsi kembali ke fixture tanpa meninggalkan berkas plaintext. Penyalinan masih manual; Docker daemon tidak tersedia, sehingga pemulihan dan ketersediaan OpenSSL pada image deploy belum diuji langsung.

### S-05: Advisory dependensi (kontekstual), diperbaiki

Audit awal melaporkan 3 high dan 3 moderate pada lockfile. Perbaikan: Next.js diperbarui ke 16.3.8, Vite rentan diarahkan ke 7.3.5, dan esbuild rentan diarahkan ke versi yang sudah ditambal. Audit akhir pnpm audit --prod --json bersih: 0 info, 0 low, 0 moderate, 0 high, 0 critical. Beberapa temuan awal berada pada jalur server pengembangan transitif, bukan bukti eksploitasi di produksi.

Rilis keamanan resmi Next.js 30 September mencakup perbaikan kebocoran informasi endpoint MCP pada next dev; proyek kini memakai 16.3.8. Prasyarat beberapa temuan lain pada rilis itu, seperti images.remotePatterns, Pages Router, dan Cache Components, tidak ditemukan dalam konfigurasi proyek ini.
## Perlindungan yang diperiksa

- Akses bahan, resep, saluran, pengaturan, dan ekspor memakai ID akun dari sesi; tes lintas akun menolak pembacaan, perubahan, penghapusan, dan referensi bahan akun lain.
- Halaman, action, dan ekspor admin memeriksa admin di server. Pengunjung biasa mendapat penolakan.
- Webhook menggunakan perbandingan token constant-time. Penerbitan Pro memeriksa invoice Mayar, nominal, ID invoice, email, dan status pesanan; tes mencakup nominal/email salah, webhook berulang, percobaan ulang setelah gagal, serta refund.
- Perintah domain divalidasi Zod, memiliki batas koleksi, dan dieksekusi dalam transaksi dengan kunci per akun. Body route publik dibaca dengan batas byte.
- Rute login E2E memeriksa `NODE_ENV` dan `E2E_TEST_AUTH` sebelum memproses body. Ini ditinjau di kode; tidak diuji pada deploy produksi.
- Compose hanya memublikasikan port Caddy. Caddy menimpa `X-Forwarded-For`. Tidak dilakukan pemindaian jaringan server produksi.
- Tidak ditemukan interpolasi SQL mentah pada alur yang diperiksa. JSON-LD meng-escape karakter `<`. Pemeriksaan ini tidak menggantikan pengujian penetrasi menyeluruh.

## Verifikasi

| Pemeriksaan | Hasil |
|---|---|
| `pnpm typecheck` | Lulus |
| `pnpm lint` | Lulus, 231 berkas |
| `pnpm test` | 92 tes lulus, 17 berkas, termasuk batas percobaan login dan penolakan checkout langsung |
| E2E isolasi, landing, Pro | Putaran awal: 126 lulus, 2 dilewati untuk navigasi desktop pada layar HP, 4 gagal akibat selector judul `Pro` ambigu |
| E2E ulang setelah selector diperbaiki | 12/12 lulus pada 320/1280 px, preferensi terang/gelap; mencakup semua 4 kegagalan sebelumnya |
| Axe dan keyboard | Halaman publik serta halaman Pro lolos; FAQ dibuka dengan Enter, tautan kembali ke resep diuji Tab/Shift+Tab/Enter |
| Build produksi | Lulus |
| `pnpm audit --prod --json` | Bersih: 0 advisory pada semua tingkat |
| `pnpm size` | Gagal: kalkulator 220,7 KB JS, batas 220 KB; total 295,4 KB masih di bawah 300 KB. Halaman lain yang diperiksa lulus |
| Simulasi backup | Dump gagal dan sukses diuji; passphrase kosong ditolak; backup terenkripsi berhasil didekripsi ke fixture tanpa berkas plaintext |
| `git diff --check` | Lulus |

Log E2E ulang memuat satu `ECONNRESET` saat koneksi ditutup; seluruh 12 assertion tetap lulus. E2E memakai server pengembangan dan akun/database uji, bukan Google OAuth atau Mayar produksi. Tidak ada klaim bahwa semua risiko sudah tertutup.

## Delivery Gate perubahan UI Pro

Arah: halaman paket untuk penjual makanan rumahan, mempertahankan palet hangat, Plus Jakarta Sans, dan dials ENERGY 2 / RHYTHM 2 / MOTION 2. Status Pro menjadi fokus agar pengguna memahami bahwa pembelian belum tersedia; aksi aktif mengembalikan pengguna ke resep.

- Hard Gate PASS untuk perubahan Pro: tidak menambah aset, statistik, testimoni, tautan fiktif, atau klaim keamanan. Form pembayaran dihapus. Tautan kembali dan FAQ diuji dengan keyboard. Axe lulus, tidak ada overflow pada 320/1280 px, dan screenshot preferensi gelap tetap terang.
- Purpose-Gate PASS: komponen dan token yang sudah ada dipakai ulang. Status menggantikan harga; panel tetap menjelaskan isi paket. Tidak menambah efek, ikon, animasi, atau dekorasi.
- Liveliness PASS: heading status menjadi fokus, spasi memisahkan penjelasan dan isi paket, tipografi serta aksen kakao/karamel tetap konsisten dengan desain yang ada.
- Craftsmanship PASS untuk alur yang diubah: checkout ditolak di server, akun Pro lama tetap aktif, pemeriksaan pembayaran lama dipertahankan, dan tes browser memeriksa kedua keadaan akun. Screenshot harga dan Pro ditinjau pada 320 dan 1280 px. Lebar 390/768 px belum diperiksa terpisah.

Screenshot lokal tersedia di `test-results/pro-final/` dan tidak dimasukkan ke Git. Pemeriksaan kode dan audit dependency kini lulus; sisa pekerjaan sebelum rilis adalah uji pemulihan backup Docker dan penyalinan cadangan terenkripsi ke luar server. Anggaran ukuran kalkulator juga masih melampaui batas 0,7 KB.
