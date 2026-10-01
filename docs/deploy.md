# Panduan deploy ke server sendiri

Untuk server Linux (Ubuntu 24.04 disarankan) dengan 2 core dan 4 GiB RAM. Semua perintah dijalankan di server, kecuali disebut lain. Waktu yang dibutuhkan: sekitar satu jam kalau domain dan akun Google sudah siap.

Yang berjalan: **Caddy** (HTTPS otomatis), **app** (Next.js), **db** (Postgres 16), dan **backup** (cadangan harian), semuanya lewat Docker Compose. Hanya port 80 dan 443 yang terbuka ke internet.

## 0. Yang perlu disiapkan dulu

| Kebutuhan | Keterangan |
|---|---|
| Domain | Contoh `takaran.contoh.id`. Wajib: HTTPS dibutuhkan untuk login dan webhook Mayar |
| Server | IP publik, akses SSH |
| Akun Google | Untuk membuat kredensial login (langkah 3) |
| Akun Mayar | Boleh menyusul; tanpa itu tombol beli menampilkan "Pembayaran belum dibuka" |

## 1. Arahkan domain ke server

Di penyedia domain, buat record **A** untuk `takaran.contoh.id` ke IP server. Tunggu sampai `ping takaran.contoh.id` menjawab IP server.

## 2. Siapkan server

```sh
# Masuk sebagai root atau pengguna dengan sudo
apt update && apt -y upgrade
apt -y install ca-certificates curl git ufw fail2ban unattended-upgrades openssl

# Docker
curl -fsSL https://get.docker.com | sh

# Firewall: hanya SSH, HTTP, HTTPS
ufw default deny incoming
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

# Pembaruan keamanan otomatis
dpkg-reconfigure -plow unattended-upgrades
```

Pengerasan SSH (lakukan **setelah** memastikan login dengan kunci SSH berhasil dari komputermu): di `/etc/ssh/sshd_config` isi `PasswordAuthentication no` dan `PermitRootLogin prohibit-password`, lalu `systemctl restart ssh`. `fail2ban` sudah aktif dengan pengaturan bawaan.

Catatan Docker: Docker menulis aturannya sendiri ke iptables dan bisa melewati `ufw` untuk port yang dipublikasikan. File `docker-compose.yml` sengaja hanya memublikasikan port 80 dan 443 (Caddy). Jangan menambah `ports:` pada `db` atau `app`.

## 3. Buat login Google

1. Buka https://console.cloud.google.com, buat proyek baru.
2. **APIs & Services** lalu **OAuth consent screen**: pilih External, isi nama aplikasi, email dukungan, dan domain.
3. **Credentials** lalu **Create credentials** lalu **OAuth client ID**, jenis **Web application**.
4. Pada **Authorized redirect URIs** isi persis: `https://takaran.contoh.id/api/auth/callback/google`
5. Salin **Client ID** dan **Client secret** untuk langkah berikut.

Selama consent screen berstatus *Testing*, hanya email yang ditambahkan sebagai *Test users* yang bisa masuk. Ubah ke *In production* saat siap dibuka untuk umum.

## 4. Ambil kode dan isi konfigurasi

```sh
git clone <alamat-repo> takaran && cd takaran
cp deploy/env.example .env
chmod 600 .env
nano .env
```

Isi `.env`. Nilai acak dibuat dengan perintah yang tertulis di komentarnya, misalnya `openssl rand -base64 32`. Isi minimal: `DOMAIN`, `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `IP_SALT`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAILS` (email Google-mu), dan `BACKUP_PASSPHRASE` (`openssl rand -hex 32`). `NEXT_PUBLIC_GA_ID` sudah diisi dengan Measurement ID GA4 Takaran. Nilai ini bersifat publik dan ditanam saat build; perubahan perlu `docker compose up -d --build`. Simpan `.env` dan passphrase backup di password manager. Letakkan passphrase backup terpisah dari berkas cadangannya.

Di GA4, buka **Admin → Data Streams → stream web → Enhanced Measurement**. Matikan pengukuran otomatis, khususnya **Page views on browser history changes**. Aplikasi mengirim pageview sendiri hanya untuk halaman publik dan menghilangkan query string. Jangan aktifkan Google Signals atau personalisasi iklan untuk tag ini.

Pada kunjungan pertama, pengunjung memilih Izinkan atau Tolak analitik. Tag tidak dimuat sebelum pilihan Izinkan. Pilihan ini dapat dibuka lagi di bagian Analitik pada kebijakan privasi.

## 5. Jalankan

```sh
docker compose up -d --build
docker compose ps          # semua harus "running" atau "healthy"
docker compose logs -f app # migrasi database berjalan otomatis saat app menyala
```

Buka `https://takaran.contoh.id`. Caddy meminta sertifikat HTTPS otomatis pada permintaan pertama (butuh beberapa detik). Coba masuk dengan Google, lalu buka `/admin` dengan email yang ada di `ADMIN_EMAILS`.

## 6. Mayar (pembayaran)

1. Buat akun di https://mayar.id dan ambil API key **sandbox** dulu. Isi `MAYAR_API_KEY` dan biarkan `MAYAR_BASE_URL=https://api.mayar.io/hl/v2`.
2. Buat token webhook: `openssl rand -hex 24`, isi `MAYAR_WEBHOOK_TOKEN`.
3. Di dashboard Mayar daftarkan webhook `https://takaran.contoh.id/api/webhooks/mayar?token=<MAYAR_WEBHOOK_TOKEN>` untuk event pembayaran diterima.
4. `docker compose up -d` lagi agar konfigurasi terbaca.
5. Uji dengan akun biasa: beli Pro di sandbox, bayar, dan pastikan akun jadi Pro sendiri. Uji juga invoice belum dibayar dan kedaluwarsa. `/admin` punya tombol *Cek Mayar* bila webhook terlambat.
6. Setelah akun dan kanal pembayaran Mayar terverifikasi, ganti ke `MAYAR_BASE_URL=https://api.mayar.id/hl/v2` dan API key produksi.

Biaya Mayar ditanggung proyek (harga ke pembeli tetap). Cek biaya per kanal di halaman harga Mayar sebelum membuka penjualan.

## 7. Cadangan

Layanan `backup` menulis `pg_dump` terkompresi dan terenkripsi dengan AES-256-CBC tiap 24 jam ke folder `./backups` (14 hari terakhir). Layanan gagal mulai bila `BACKUP_PASSPHRASE` kosong; dump tidak disimpan tanpa enkripsi. Hanya container backup yang menerima passphrase. Simpan passphrase di password manager yang tidak berada di server atau direktori cadangan. **Cadangan di server yang sama tidak melindungi dari server yang rusak**, jadi salin berkas `.enc` ke tempat lain secara berkala. Contoh dari komputermu, tiap hari lewat cron atau Task Scheduler:

```sh
rsync -av user@takaran.contoh.id:~/takaran/backups/ ~/cadangan-takaran/
```

Pulihkan (uji ini sekali sebelum kamu benar-benar membutuhkannya):

```sh
# Buka berkas terenkripsi; simpan passphrase dari password manager, bukan dari server.
openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_PASSPHRASE \
  -in backups/takaran-XXXX.sql.gz.enc -out /tmp/pulih.sql.gz
gunzip -c /tmp/pulih.sql.gz | docker compose exec -T db psql -U takaran -d takaran
```

Lakukan pemulihan ke database kosong (`docker compose exec db psql -U takaran -c "drop database takaran; create database takaran;"` setelah `docker compose stop app`).

## 8. Memperbarui aplikasi

```sh
cd takaran
git pull
docker compose up -d --build
```

Migrasi database yang baru dijalankan otomatis saat `app` menyala. Sebelum pembaruan besar, ambil cadangan manual: `docker compose exec backup sh -c 'pg_dump | gzip > /backups/manual.sql.gz'`.

## 9. Pemantauan sederhana

- `docker compose ps` dan `docker compose logs --tail=100 app` bila ada keluhan.
- Pasang pemantau gratis (misalnya UptimeRobot) pada `https://takaran.contoh.id/kebijakan-privasi` dan kabari dirimu saat mati. Bila server mati, pembeli yang baru membayar baru bisa Pro setelah server hidup lagi: Mayar mengirim ulang webhook, dan `/beli` mengecek ulang.
- Disk: `df -h` sesekali. Log Docker dan folder `backups` adalah yang paling cepat membesar.

## 10. Checklist sebelum dibuka untuk umum

- [ ] Login Google berhasil dari HP, dan consent screen sudah *In production*
- [ ] `/admin` hanya terbuka untuk email admin (coba dengan akun lain: harus 404)
- [ ] Port 5432 tidak terbuka dari luar: dari komputermu `nc -zv IP-server 5432` harus gagal
- [ ] Cadangan pertama muncul di `./backups`, sudah disalin ke luar server, dan pemulihan pernah diuji
- [ ] SSH hanya dengan kunci, `ufw status` menunjukkan hanya 22, 80, 443
- [ ] Uji pembayaran sandbox lengkap: belum bayar, sukses, kedaluwarsa, webhook ganda
- [ ] Kebijakan privasi sudah sesuai kenyataan (email kontak, siapa yang memegang data)
- [ ] Uji lima penjual nyata (catat di `docs/field-test-notes.md`)
