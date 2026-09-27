# CHANGE-001: Pindah ke Next.js, Postgres, dan model online

> Status: disetujui pemilik dan diimplementasikan, 27 September 2026
> Menggantikan bagian yang bertentangan di `PRD.md`, `FEATURES.md`, `RULES.md`, `TECH.md`, dan `RFCs/`. Jika ada pertentangan, dokumen ini yang menang sampai dokumen sumber diperbarui.

## Keputusan

1. **Online penuh.** Bahan, resep, dan pengaturan disimpan di Postgres per akun, bukan di IndexedDB. Aplikasi tidak lagi dirancang untuk offline.
2. **Akun wajib** untuk memakai aplikasi. Landing page tetap punya demo kalkulator tanpa login.
3. **Satu proyek Next.js** menggantikan Astro (landing), Vite (app), dan Hono di Cloudflare Worker (API).
4. **Postgres + Drizzle** menggantikan D1. Berjalan di server sendiri (2 core, 4 GiB) lewat Docker Compose dengan Caddy untuk HTTPS.
5. **Tailwind + shadcn/ui** untuk seluruh UI. Warna, tipografi, dan tumpukan isometrik dari `DESIGN.md` dipertahankan sebagai token dan komponen tambahan di atas shadcn.
6. **Pro = penanda di akun.** Webhook Mayar yang terverifikasi menandai akun Pro secara otomatis. Kode lisensi Ed25519, token klaim, dan verifikasi offline dihapus.
7. **Login Google** lewat library autentikasi (Better Auth), tanpa password dan tanpa layanan email. Admin memakai login yang sama dengan peran admin.

Keputusan 7 (login Google) dikonfirmasi pemilik. Keputusan 5 memakai asumsi "shadcn dengan token DESIGN.md dipertahankan" dan belum dijawab pemilik.

## Yang dicabut atau diganti

| Sumber | Sebelumnya | Sekarang |
|---|---|---|
| AGENTS aturan 1, PRD NFR-05 | Data resep dan harga tidak pernah dikirim ke server | Data usaha disimpan di server per akun, tidak dibagikan, dan hanya bisa dibaca pemiliknya |
| AGENTS aturan 2, PRD NFR-03 | Offline dulu | Tidak berlaku. Aplikasi memerlukan koneksi. |
| PRD FR-23 | Data di IndexedDB | Data di Postgres |
| PRD FR-24, NFR-09 | Cadangan dan pulihkan file, pengingat 14 hari | Diganti "unduh data saya" (JSON) dan "hapus akun" |
| PRD FR-26 | Kode lisensi diverifikasi offline | Status Pro pada akun |
| PRD FR-27, FR-32 | Checkout, klaim kode lisensi, jalur manual | Checkout Mayar, webhook menandai Pro otomatis. Jalur transfer manual ditunda; admin bisa menandai Pro dari halaman admin. |
| PRD NFR-10 | Cloudflare | Server sendiri; biaya server dan domain |
| PRD J-1 | Resep pertama tanpa daftar | Demo tanpa login di landing; menyimpan resep pertama memerlukan login |
| TECH | Cloudflare, Dexie, Ed25519, Access, Turnstile | Lihat bagian Arsitektur |
| RULES | RU-16, RU-17 (Dexie), RU-26, RU-29 sampai RU-30, RU-63 sampai RU-65 sebagian | Diganti aturan keamanan di bawah |
| RFC-005, 010, 011, 012 | Data lokal, cadangan, lisensi, Mayar di Worker | Ditulis ulang sesuai tahap 2 sampai 5 |

Tidak berubah: aturan 3 sampai 10 AGENTS (rumus hanya di `packages/calc`, angka rupiah bulat dan basis poin, brownies sebagai test tetap, anggaran ukuran, teks UI, aksesibilitas, tanpa data palsu). `packages/calc` dan `packages/schema` dipakai ulang tanpa perubahan rumus.

## Arsitektur

```
Caddy (HTTPS otomatis) -> Next.js (Docker) -> Postgres (jaringan internal)
```

- `/` landing dan demo, `/app/*` kalkulator, `/api/*` route handler, `/admin` halaman admin.
- Hasil HPP tetap dihitung di klien memakai `packages/calc` agar tampil instan. Server menyimpan input, bukan hasil hitungan.
- Batas versi gratis (3 resep, 1 saluran) dicek di server.

## Aturan keamanan (baru, keras)

1. Autentikasi lewat library (Better Auth), bukan buatan sendiri. Cookie sesi `HttpOnly`, `Secure`, `SameSite=Lax`.
2. Setiap kueri data pengguna difilter `user_id` dari sesi. Tidak ada endpoint yang menerima `user_id` dari klien. Wajib ada test yang membuktikan pengguna A tidak bisa membaca atau mengubah data pengguna B.
3. Semua input server divalidasi dengan Zod di batas kepercayaan (body, query, webhook).
4. Batas percobaan login dan pendaftaran per IP.
5. Webhook Mayar tidak dipercaya sebagai bukti bayar. Invoice dikonfirmasi ke API Mayar dan nominal dicocokkan dengan `PRICING` di server. Event disimpan idempoten.
6. Postgres tidak dibuka ke internet; hanya aplikasi yang bisa mengaksesnya lewat jaringan Docker internal.
7. Rahasia hanya di file env di server, tidak di repo, log, atau contoh konfigurasi. Log tidak memuat nama bahan, resep, atau harga.
8. HSTS, CSP, dan header keamanan standar dari Caddy dan Next.js.
9. Server: SSH hanya dengan kunci, firewall (ufw), fail2ban, pembaruan OS berkala.
10. Cadangan Postgres harian, dienkripsi, disimpan di luar server, dan pemulihan pernah diuji.
11. Pengguna bisa mengunduh dan menghapus seluruh datanya. Kebijakan privasi diperbarui.

## Tahapan

| Tahap | Isi | Bukti selesai |
|---|---|---|
| 1 | Next.js, Tailwind, shadcn/ui, Postgres, Docker; pindahkan `calc` dan `schema` | Test `calc` lulus, termasuk brownies |
| 2 | Autentikasi dan tes isolasi data | Tes lintas pengguna lulus |
| 3 | Bahan, resep, HPP | Test dan uji tangan |
| 4 | Harga, alarm margin, saluran jual | Test dan uji tangan |
| 5 | Mayar dan status Pro otomatis | Uji sandbox: belum bayar, sukses, kedaluwarsa, nominal salah, webhook ganda |
| 6 | Landing dan admin | Uji tangan, axe |
| 7 | Deploy, backup, pengerasan server; hapus Astro, Hono, Worker, D1, Dexie, lisensi Ed25519, dan prototipe di root | Panduan deploy dan `pnpm lint`, `typecheck`, `test` lulus |

## Dependensi baru (lihat AGENTS "Tanya dulu")

Next.js, Drizzle dan `pg`, Better Auth, shadcn/ui (Radix). Ukuran gzip dilaporkan pada tahap 1. Anggaran JS awal 170 KB berlaku untuk halaman `/app`; jika tidak tercapai, angkanya diputuskan ulang bersama pemilik.

## Keputusan saat implementasi

| Keputusan | Alasan |
|---|---|
| Anggaran ukuran diubah dari 170/250 KB menjadi 220/300 KB gzip (`pnpm size`) | Runtime Next.js dan React saja sekitar 135 KB gzip. Angka lama tidak mungkin dengan Next.js. Perlu konfirmasi pemilik |
| Tanpa PWA, service worker, dan offline | Model online per akun (keputusan 1) |
| Tanpa Umami/analitik pihak ketiga | Kurangi layanan luar; metrik aktivasi bisa dihitung dari database |
| Tanpa Turnstile; waitlist memakai kolom jebakan bot dan batas per IP | Kurangi layanan luar; checkout sudah di belakang login |
| Transfer/QRIS manual tidak dibangun; admin bisa memberi Pro manual | Ditunda di keputusan awal; jalur cadangan cukup dari admin |
| Perubahan resep dari formulir kini mempertahankan target untung dan harga jual yang sudah ada | Versi lama menimpa keduanya dengan bawaan saat resep diubah |
| Sub-resep, saluran, penawaran, dan gambar daftar harga ikut dipindahkan | Sudah ada di aplikasi lama; batas gratis dan Pro dijaga di server |
| Kode lisensi Ed25519, token klaim, cadangan file, dan `scripts/gen-keys`/`issue-license` dihapus | Diganti status Pro pada akun |
| Berkas `apps/api/.wrangler` (cache lokal, di-gitignore) tidak terhapus karena masih dikunci proses `wrangler dev` lama di komputer pemilik | Hapus manual setelah menghentikan proses itu |

## Belum diputuskan

- Domain dan penyedia cadangan Postgres di luar server.
- Nama produk final dan logo.
- Apakah harga pendiri dan Rp 79.000 sudah tepat (Open Question 2 di PRD).
