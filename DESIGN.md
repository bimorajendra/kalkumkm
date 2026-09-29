# DESIGN.md: Takaran (nama kerja)

> **Arah pemilik (27 September 2026):** palet hangat dari referensi Kindly dipakai di seluruh halaman dan tema dikunci terang. Landing memakai bidang penuh (bukan bingkai bundar): latar putih polos, dengan gradasi hangat lembut (caramel ke peach ke putih) hanya di balik navbar dan hero, memudar sebelum section berikutnya. Judul Plus Jakarta Sans yang sederhana. Layout mengikuti konten Takaran tanpa menyalin elemen finance yang tidak relevan. Perubahan ini menggantikan pengecualian tipografi di `docs/CHANGE-002-visual-identity-flat.md`; ilustrasi data tetap memakai grafik yang sudah berfungsi.
> **Susulan (27 September 2026, lanjutan):** bingkai putih membulat di atas latar aprikot (dipasang lebih dulu untuk meniru bentuk mockup di tangkapan layar referensi) dibatalkan pemilik: bentuk kartu-di-atas-latar itu tidak diperlukan untuk halaman sungguhan (bukan mockup), dan latar aprikot polos di sekitarnya dinilai terlalu sepi. Baris di §9.1 yang menyebut "bingkai" **tidak berlaku lagi**; landing sekarang bidang penuh (latar putih), dengan gradasi hangat lembut hanya di balik navbar dan hero sebagai aksen.
> **Arah dashboard terbaru (29 September 2026):** tangkapan layar desktop Ringkasan, Bahan, Resep, Ubah resep, dan Daftar harga dari pemilik menjadi acuan untuk seluruh halaman aplikasi yang sudah login. Arah ini menggantikan komposisi aplikasi lama di §9.1, §9.2, §10.1–§10.5. Kalkulator dimulai dari pilihan resep, dan popup editor tetap tiga langkah dengan latar putih bersemburat peach. Landing dan halaman marketing tetap mengikuti arahan tersendiri di §10.8.
> Arah visual untuk aplikasi kalkulator HPP dan landing page-nya. File ini adalah **data arah desain** yang dibaca bersama `antislop.md` (filter). `antislop.md` menyaring slop; file ini memberi karakter.
> Kebutuhan fungsional ada di `PRD.md`. Jika keduanya bertentangan, `PRD.md` yang menang untuk fungsi, file ini yang menang untuk tampilan.
> Status: Draf v0.2, 25 September 2026.

---

## 1. Sumber Arah

Dua referensi visual dari pemilik produk. Keduanya dipakai sebagai inspirasi, bukan untuk ditiru utuh (R-30).

| Referensi | Yang diambil | Yang **tidak** diambil, dan alasannya |
|---|---|---|
| **A. Kalkulator "Calculate Your Earnings"** (layar aplikasi) | Tata letak dua kolom: input di kiri, satu kartu hasil berwarna di kanan. Kontrol berupa slider bertitik (segmented track) dengan label nilai di bawah. Angka hasil sangat besar di dalam kartu. Kotak catatan bergaris tipis. Navbar melayang berbentuk kapsul. | Ikon kilat dan bintang (R-04, tidak ada hubungannya dengan kue). Garis sirkuit di kartu (R-07, dekorasi tanpa tujuan; diganti motif isometrik yang berisi data). Palet biru periwinkle (diganti palet hangat agar satu identitas dengan landing page; lihat bagian 4). |
| **B. Landing page keuangan bernuansa oranye** | Latar krem hangat. Judul serif ramping yang terasa "buku resep". Gradasi oranye-peach hanya di satu area fokus. Tombol utama kapsul gelap. Kartu produk yang memperlihatkan UI nyata. | Lencana "#1 AI Finance platform" (R-09, R-16, R-36). "4.9/5 Reviews" dan avatar (R-17, R-18). Deretan logo perusahaan (R-05). Testimoni tanpa orang nyata (R-18, R-38). Proses "Step 01/02/03" (R-05). Footer 4 kolom (R-05). Glow oranye di banyak elemen sekaligus (R-13). Tombol oranye bertulisan putih (kontras 2,8:1, gagal R-25). |

**Keputusan palet:** kedua referensi punya warna berbeda (biru vs oranye). Produk ini memakai **satu palet hangat** (krem, cokelat kakao, karamel oranye) untuk aplikasi dan landing page. Alasan: produk ini untuk dapur kue rumahan, dan warna karamel langsung terbaca "kue", sedangkan biru terbaca "keuangan/kripto". Tata letak tetap mengikuti referensi A.

**Penyempurnaan tampilan (27 September 2026):** warna krem dibuat lebih terang dan panel form lebih peach seperti referensi Kindly; kartu hasil memakai gradasi peach-oranye dan bayangan lembut sebagai fokus. Kalkulator desktop menyeimbangkan kolom input dan hasil (6:5); pada HP, alur dan ringkasan hasil tetap seperti semula. Penyesuaian ini hanya menyentuh presentasi, tidak mengubah input, copy, atau perhitungan.

**Penyempurnaan ornamen landing (27 September 2026, lanjutan):** pemilik minta landing page menyamai layout, dekorasi, dan ornamen referensi Kindly secara lebih menyeluruh. Yang diambil dan alasannya:

| Ornamen referensi | Diterapkan sebagai | Kenapa cocok |
|---|---|---|
| Kartu "Step 01/02/03" dengan ikon dalam lingkaran | Section "Cara pakai" (tiga langkah: masukkan harga bahan, susun resep, lihat harga jual dan untung) | Isinya alur nyata memakai Takaran, bukan teks generik seperti referensi ("Pick a tool") yang tidak berarti apa-apa untuk produk satu-fungsi ini |
| Grid ikon "trust badge" ("No hidden fees", dll.) menjelang penutup | Section "Kenapa penjual pakai Takaran" (privasi data, alarm margin, Pro sekali bayar, gratis 3 resep) | Klaim yang bisa diverifikasi dari kode dan `PRICING`/`FREE_LIMITS`, bukan janji generik |

Cahaya gradasi blur di belakang kartu hero (ornamen referensi Kindly) sempat dicoba lalu **dibatalkan**: karena kartu demo sudah persegi dengan radius yang sama, blur-nya hanya menjiplak bentuk kotak kartu jadi terlihat seperti garis pinggir/outline ganda di luar kartu, bukan cahaya ambient yang lembut seperti referensi. Kartu demo landing tetap tampil hanya dengan gradasi dan bayangannya sendiri, tanpa cahaya tambahan di baliknya.

**Revisi kartu hasil kalkulator (28 September 2026):** gradasi karamel di kartu hasil kalkulator aplikasi (bukan kartu demo landing) **dibatalkan** pemilik setelah dicoba di halaman sungguhan: sepanjang kartu jadi terlalu penuh warna oranye dan menenggelamkan tumpukan isometrik serta kotak Margin/Untung per jam di dalamnya. Kartu hasil kalkulator sekarang latar `--surface` (putih) dengan garis `--line` dan bayangan tingkat 2, sama seperti kartu lain di aplikasi; gradasi karamel 160° tetap dipakai, tapi hanya di kartu demo kalkulator pada landing page (bagian 3, baris Hero). Detail baru ada di bagian 9.6.

Yang **sengaja tidak diambil** (bertentangan dengan aturan keras "Tanpa data palsu" dan R-05/R-09/R-16/R-17/R-18/R-36/R-38 di `antislop.md`, sudah dibahas juga di tabel bagian 1 untuk referensi B):
- Lencana "#1 AI Finance platform", rating "4,9/5 Reviews", dan avatar pengulas karangan.
- Deretan logo perusahaan (ByteBoost, Hexagon, dll.) — Takaran tidak punya klien perusahaan yang mengizinkan logonya dipakai.
- Kartu testimoni dengan nama dan foto karangan.
- Section "Popular combinations" (Kindly menjual banyak tool sekaligus; Takaran satu alat, tidak ada kombinasi tool untuk dijual).
- Footer 4 kolom dengan tautan ke halaman yang tidak ada (Help Center, Template, System Status, dll.) — melanggar R-24 (setiap tautan navigasi wajib menuju layar yang ada). Footer tetap satu baris (lihat bagian 10.5).

Dua ikon baru masuk daftar di bagian 7 karena dipakai section-section ini: `wallet` (uang, untung, sekali bayar) dan `lock` (privasi data).

---

## 2. Design Read dan Dial

> Reading this as: **alat hitung untung berbasis HP untuk penjual kue dan makanan rumahan** di Indonesia, dengan bahasa visual **buku resep hangat bertemu kalkulator presisi**, dial **ENERGY 2 / RHYTHM 2 / MOTION 2**.

`Dial: ENERGY 2 / RHYTHM 2 / MOTION 2`

| Dial | Nilai | Artinya di produk ini |
|---|---|---|
| ENERGY | 2 | Tenang dan rapi, dengan satu momen yang "berbunyi": angka besar Plus Jakarta Sans tebal dan tumpukan isometrik di kartu hasil (kartu sendiri putih; oranye hanya di kartu demo landing dan aksen teks/lapisan). Bukan halaman eksperimental. |
| RHYTHM | 2 | Layar aplikasi konsisten (pengguna harus cepat terbiasa). Landing page punya beberapa jeda: satu section penuh warna, satu section tabel, satu section angka besar. |
| MOTION | 2 | Gerak hanya untuk menunjukkan sebab-akibat: angka berganti saat slider digeser, lapisan isometrik naik-turun saat harga bahan berubah. Tidak ada animasi masuk berulang. |

---

## 3. Identitas dan Motif

### 3.1 Motif utama: Tumpukan Biaya Isometrik

Satu gambar yang diulang di seluruh produk: **tumpukan lempeng isometrik** yang menggambarkan komposisi harga jual satu porsi.

```
            ╱▔▔▔▔▔▔▔▔╲
           ▕  UNTUNG  ▏   ← oranye (satu-satunya lempeng berwarna aksen)
            ╲________╱
           ▕  Tenaga  ▏   ← tan 300
           ▕ Kemasan  ▏   ← tan 200
           ▕  Energi  ▏   ← tan 100
           ▕          ▏
           ▕  Bahan   ▏   ← tan 400 (biasanya paling tebal)
            ╲________╱
```

- **Berisi data, bukan dekorasi.** Tinggi tiap lempeng sebanding dengan rupiah komponennya (CR-04 di PRD). Jika harga telur naik, lempeng Bahan menebal dan lempeng Untung menipis secara langsung.
- Muncul di: kartu hasil kalkulator, gambar daftar harga yang dibagikan, ikon aplikasi mini (16 px, versi 3 lempeng tanpa label), dan hero landing page.
- **Selalu ada label teks** di samping tiap lempeng (nama + rupiah). Warna tidak pernah menjadi satu-satunya pembeda (aksesibilitas).
- Jika untung negatif, lempeng Untung digambar sebagai **garis putus-putus merah di bawah dasar tumpukan** dengan label "Rugi Rp X per porsi".

### 3.2 Aturan gambar isometrik

| Aspek | Aturan |
|---|---|
| Proyeksi | Isometrik sejati: sumbu 30° dari horizontal, tidak ada perspektif |
| Pencahayaan | Dari kiri atas. Sisi atas paling terang, sisi kiri sedang, sisi kanan paling gelap, dalam satu keluarga warna yang sama |
| Garis | Stroke 1,5 px warna `--ink` dengan opasitas 85% untuk ilustrasi; tanpa stroke untuk grafik data |
| Sudut | Tajam. Tidak ada lempeng membulat, agar beda jelas dengan kartu UI yang membulat |
| Bayangan | Satu bayangan jatuh lembut di dasar, tidak di tiap lempeng |
| Pembuatan | Grafik data digambar dengan SVG dari angka nyata (bukan gambar statis). Ilustrasi (hero, empty state) dibuat sebagai SVG terpisah |

### 3.3 Ilustrasi isometrik (perlu dibuat, lihat bagian 13)

| Tempat | Konsep | Tujuan |
|---|---|---|
| Hero landing page | Meja dapur isometrik: loyang brownies terpotong 16, timbangan digital, struk belanja, HP menampilkan kartu hasil | Memperlihatkan dunia pengguna, bukan karakter 3D generik (R-22) |
| Empty state Bahan | Rak kosong isometrik dengan satu kantong tepung | Mengajak mengisi bahan pertama |
| Empty state Resep | Loyang kosong isometrik | Mengajak membuat resep pertama |
| Error/offline | Loyang dengan tanda seru kecil | Menunjukkan masalah tanpa membuat panik |

Semua ilustrasi memakai palet bagian 4 saja.

---

## 4. Warna

### 4.1 Token (mode terang)

| Token | Hex | Peran |
|---|---|---|
| `--bg` | `#FCF8F5` | Latar halaman (krem terang) |
| `--surface` | `#FFFFFF` | Kartu, input |
| `--surface-soft` | `#F7EEE9` | Panel form peach lembut, baris tabel selang-seling, kotak catatan |
| `--line` | `#EADBD2` | Garis pemisah dekoratif (bukan batas kontrol) |
| `--ink` | `#2B1D14` | Teks utama (cokelat kakao, bukan hitam murni) |
| `--ink-muted` | `#6E5A4B` | Teks sekunder, label satuan |
| `--caramel-300` | `#FFC4A8` | Ujung terang peach pada gradasi kartu demo landing |
| `--caramel-400` | `#FF9C6D` | Isi slider aktif, tengah gradasi |
| `--caramel-500` | `#F07A1F` | Aksen utama: lempeng Untung, ujung gelap gradasi kartu demo |
| `--caramel-600` | `#C85A0C` | Batas kontrol aktif, thumb slider, teks besar (≥ 24 px) |
| `--caramel-700` | `#9E4308` | Teks tautan dan teks oranye ukuran normal |
| `--peach-100` | `#FFE5D9` | Latar chip dan latar alarm margin |
| `--tan-100` … `--tan-400` | `#FFE9D2`, `#FFD3A8`, `#FFB977`, `#F5984A` | Segmen batang biaya selain untung |
| `--danger` | `#B42318` | Rugi, error |
| `--success` | `#1E7A4C` | Margin di atas target |

### 4.2 Palet yang dipakai

Token di bagian 4.1 adalah satu-satunya palet produk. Nilai latar, panel, teks, dan aksen dipakai sama pada landing maupun halaman aplikasi.

### 4.3 Aturan pakai

1. **Palet inti:** kakao (ink), karamel, krem. **Satu aksen:** karamel-500, dan artinya selalu "untung". Jangan pakai karamel untuk hal yang bukan uang atau aksi utama.
2. **Gradasi fokus:** hanya kartu demo kalkulator di landing memakai arah 160° dari `--caramel-300` ke `--caramel-500` untuk menandai hasil. Kartu hasil kalkulator di aplikasi latar `--surface` polos (lihat 9.6). Landing boleh memakai satu gradasi vertikal tipis pada bidang tengah agar perpindahan antarbagian terasa halus seperti referensi. Tombol dan ikon tidak memakai gradasi.
3. **Teks di atas oranye (kartu demo landing) selalu `--ink`,** tidak pernah putih. Putih di atas `#F07A1F` hanya 2,80:1.
4. **Tombol utama:** kapsul `--ink` dengan teks putih (16,3:1), mengikuti referensi B.
5. Hijau dan merah hanya untuk status margin, tidak untuk dekorasi.

### 4.4 Kontras yang sudah dihitung (WCAG 2.2)

| Pasangan | Rasio | Boleh untuk |
|---|---|---|
| ink di surface | 16,30 | Semua teks |
| ink di bg krem | 15,18 | Semua teks |
| ink-muted di surface | 6,51 | Semua teks |
| ink-muted di surface-soft | 5,57 | Semua teks |
| ink di caramel-500 (ujung gelap kartu) | 5,83 | Semua teks |
| ink di caramel-400 | 7,75 | Semua teks |
| ink di peach-100 | 13,28 | Semua teks |
| caramel-700 di surface | 6,44 | Teks tautan ukuran normal |
| caramel-700 di bg krem | 6,00 | Teks tautan ukuran normal |
| caramel-600 di surface | 4,27 | **Hanya** teks ≥ 24 px atau ≥ 18,66 px tebal, dan elemen non-teks |
| caramel-600 di surface-soft | 3,65 | Thumb slider dan batas kontrol (non-teks, minimal 3:1) |
| putih di caramel-500 | 2,80 | **Dilarang** untuk teks |
| danger di surface | 6,57 | Semua teks |
| success di surface | 5,33 | Semua teks |

`--line` (1,38:1) hanya untuk pemisah dekoratif. Batas input dan kontrol wajib memakai `--ink-muted` atau `--caramel-600` agar mencapai 3:1.

### 4.5 Tema

Tema terang dikunci untuk semua halaman agar latar krem, panel putih-peach, dan aksen karamel tetap konsisten dengan referensi visual. Tidak ada toggle tema atau dukungan mode gelap. Uji juga saat perangkat memilih mode gelap untuk memastikan halaman tetap terang.

---

## 5. Tipografi

Semua teks, judul, dan angka besar memakai Plus Jakarta Sans lokal. Bobot semibold dan bold memberi hierarki tanpa serif dekoratif atau font tambahan.

| Peran | Font | Alasan |
|---|---|---|
| Display: judul, angka hasil besar | **Plus Jakarta Sans**, 600/700 | Konsisten dengan landing page dan tetap jelas dibaca tanpa serif dekoratif |
| UI: teks, label, tabel, tombol | **Plus Jakarta Sans** (font lokal), 400/500/600/700 | Dirancang untuk Jakarta, terasa lokal, jelas di ukuran kecil di layar HP. Wajib cek dukungan `tnum`; jika tidak tersedia, kolom angka di tabel memakai `Inter` dengan `tabular-nums` |

### Skala

| Token | Ukuran / tinggi baris | Font | Dipakai untuk |
|---|---|---|---|
| `display-xl` | 64/64 (desktop), 44/46 (HP) | Plus Jakarta Sans, 700 | Judul hero landing |
| `display-num` | 72/72 (desktop), 52/54 (HP) | Plus Jakarta Sans, 700 | Harga jual disarankan di kartu hasil |
| `display-l` | 44/48, HP 34/38 | Plus Jakarta Sans, 600/700 | Judul layar ("Hitung untung brownies") |
| `title` | 20/28, 600 | Plus Jakarta Sans | Judul panel ("Target untung", "Saluran jual") |
| `body` | 16/24, 400 | Plus Jakarta Sans | Teks umum. Minimum 16 px di input agar HP tidak zoom |
| `label` | 14/20, 500 | Plus Jakarta Sans | Label slider, satuan |
| `caption` | 13/18, 400 | Plus Jakarta Sans | Catatan kaki. Tidak lebih kecil dari 13 px |

Aturan:
- Tidak ada label huruf kapital dengan jarak huruf lebar (R-06). Label "DETAILS:" di referensi A diganti kalimat biasa ("Rincian biaya per potong").
- Angka rupiah selalu format Indonesia: `Rp 5.000`, `41,5%`. Simbol `Rp` di angka besar memakai ukuran 50% dari angka.
- Judul memakai Plus Jakarta Sans semibold atau bold dengan `letter-spacing: -0.01em`; teks UI tanpa pengaturan jarak huruf.

---

## 6. Ruang, Grid, Radius, Elevasi

| Aspek | Nilai | Alasan |
|---|---|---|
| Satuan ruang | Kelipatan 4 px: 4, 8, 12, 16, 24, 32, 48, 72, 112 | Konsisten dan mudah diterapkan di Tailwind |
| Grid aplikasi desktop (≥ 1024 px) | Sidebar tetap 248 px pada layar lebar; konten memakai grid 12 kolom dan lebar baca maks 1120 px. Ringkasan membagi grafik dan komposisi 7:5; form harga memakai 5:7 | Menjaga navigasi tetap terlihat dan memberi ruang lebih untuk pratinjau yang sedang diatur |
| Grid tablet (640 sampai 1023 px) | Satu kolom, kartu hasil menempel di atas panel input (sticky ringkas) | Hasil tetap terlihat saat slider digeser |
| HP (< 640 px) | Satu kolom, gutter 16 px, kartu hasil ringkas menempel di bawah layar di atas tab bar | Jempol mengatur slider, mata melihat hasil |
| Radius | Kontrol dan chip 10 px; kartu 20 px; kartu hasil 28 px; navbar kapsul penuh | Variasi radius menandai hierarki (R-11). Hanya navbar dan tombol yang berbentuk kapsul |
| Elevasi | Hanya dua tingkat: navbar melayang dan kartu hasil (`0 12px 32px rgb(43 29 20 / 0.10)`). Kartu lain datar dengan garis | Bayangan menandai elemen yang melayang di atas konten (R-12) |
| Jarak antar section landing | Bervariasi: 112, 72, 112, 48 | Ritme tidak seragam, sesuai RHYTHM 2 |

---

## 7. Ikon

- Set: **Lucide**, stroke 1,75 px, ukuran 20 px (24 px di tab bar).
- Hanya ikon yang maknanya langsung: `wheat` (bahan), `cookie` atau `cake` (resep), `receipt` (penawaran), `store` (saluran), `hard-drive-download` (cadangan), `triangle-alert` (alarm margin), `wallet` (uang, untung, sekali bayar), `lock` (privasi data).
- Chip "✦ Calculator" di referensi A diganti chip berisi **mini tumpukan isometrik 16 px** + teks nama resep, karena ikon bintang tidak berhubungan dengan konten (R-04).
- Tidak ada panah dekoratif di tombol. Chevron `>` hanya di tombol yang **membuka layar lain** (R-08).

---

## 8. Motion

| Gerak | Durasi / easing | Tujuan |
|---|---|---|
| Angka hasil berubah saat slider digeser | Tween angka 180 ms, `ease-out` | Menunjukkan sebab-akibat secara langsung |
| Lempeng isometrik berubah tinggi | 240 ms, `cubic-bezier(.2,.8,.2,1)` | Memperlihatkan bagian mana yang membengkak |
| Alarm margin muncul | Geser turun 8 px + fade 160 ms, sekali | Menarik perhatian tanpa berkedip |
| Thumb slider | Membesar 1,15× saat ditekan | Umpan balik sentuhan |
| Transisi antar layar | Tidak ada selain crossfade 120 ms | Aplikasi alat kerja harus terasa cepat |

- `prefers-reduced-motion: reduce` mematikan semua tween; angka dan lempeng langsung berganti.
- Tidak ada animasi saat scroll di aplikasi. Di landing page, hanya demo hero yang bergerak saat pengunjung memakainya.

---

## 9. Komponen

### 9.1 Kerangka aplikasi desktop
- Sidebar putih selebar 248 px menempel di kiri. Logo berada di atas; menu dikelompokkan menjadi Ringkasan, Dapur (Hitung HPP, Bahan, Resep), dan Jualan (Penawaran, Daftar harga). Pengaturan berada dekat bawah, sesudah meter paket.
- Item aktif memakai latar `--surface-soft`, teks `--ink` tebal, dan radius 12 px. Jumlah bahan, alarm resep, dan label Pro berasal dari data akun/paket.
- Bilah atas setinggi 64 px memakai latar `--bg`: pencarian resep/bahan di kiri dan menu akun berbentuk chip di kanan. Chip menampilkan inisial nama, nama depan, dan chevron; menu tetap memuat pengaturan, paket, dan keluar.
- Sidebar dapat diciutkan di desktop lebar. Pada keadaan ciut, logo, ikon, dan kontrol tetap memiliki nama aksesibel.
- Isi halaman memakai latar `--bg`; kartu data memakai `--surface` dengan garis `--line`. Konten mengikuti lebar layar, dengan batas 1120 px untuk layar ringkasan dan form.
- Alasan: menu kerja selalu terlihat, sedangkan latar kartu putih menjaga angka dan input mudah dipindai.

### 9.2 Navigasi HP dan tablet
- Sidebar diganti tab bawah untuk Ringkasan, Hitung, Bahan, Resep, dan Lainnya. Tab Lainnya membuka sheet untuk Penawaran, Daftar harga, Pengaturan, dan Pro.
- Bilah atas mempertahankan logo dan chip akun; pencarian desktop disembunyikan pada HP, bukan diperkecil menjadi input yang sulit dipakai.
- Tinggi tab bar 64 px, target sentuh minimal 48 px, label selalu tampil. Konten mendapat ruang bawah agar tab bar tidak menutupi tombol atau hasil.
- Alasan: empat pekerjaan yang paling sering dipakai dapat dijangkau ibu jari; alat tambahan tetap mudah ditemukan.

### 9.3 Chip konteks
- Latar `--peach-100`, teks `--caramel-700`, radius 10 px, mini tumpukan isometrik di kiri. Isi: nama resep aktif ("Brownies · 16 potong"). Mengetuknya membuka pemilih resep.

### 9.4 Kotak catatan
- Seperti referensi A: garis 1 px `--ink-muted` pada opasitas 40% di atas `--surface`, radius 12 px, padding 16 px.
- Dipakai untuk penjelasan margin vs markup: "Markup 70,9% artinya harga jual 70,9% di atas modal. Margin 41,5% artinya dari setiap Rp 5.000 yang kamu terima, Rp 2.075 adalah untung."

### 9.5 Slider bertitik (segmented slider)
Diadaptasi dari "Rental Duration" dan "Node amount" di referensi A.

- Panel `--surface-soft`, radius 20 px, padding 24 px, berisi satu atau lebih slider.
- Track tinggi 44 px, radius 10 px, dibagi garis tipis pada titik berhenti. Bagian terisi `--caramel-400` pada opasitas 55%; sisa track `--surface`.
- **Thumb:** garis vertikal 2 px `--caramel-600` setinggi track + bulatan 12 px di bawahnya (seperti referensi). Area sentuh 44×44 px.
- Label titik di bawah track: `--ink-muted`; label nilai aktif `--ink` tebal.
- Slider yang dipakai:
  - **Target untung:** 10%, 20%, 30%, 40%, 50%, 60%, 70% (default 40%)
  - **Saluran jual:** Langsung, Reseller, Ojol (titik berlabel, bukan angka)
  - **Jam kerja per adonan:** 0,5 / 1 / 1,5 / 2 / 3 / 4 jam
- Keyboard: `role="slider"`, panah kiri/kanan pindah satu titik, `Home`/`End` ke ujung, `aria-valuetext` dalam kalimat ("40 persen, harga jual Rp 5.000").
- Setiap slider punya tombol kecil "Ketik angka" untuk nilai di luar titik (misal margin 35%).

### 9.6 Kartu hasil (titik fokus)
Diadaptasi dari kartu biru referensi A; gradasi oranye referensi B dipakai di kartu demo landing (bagian 3), bukan di sini — dicoba di kartu hasil kalkulator lalu **dibatalkan** (28 September 2026, lihat catatan di bagian 1) karena warna penuh oranye menenggelamkan tumpukan isometrik dan kotak Margin/Untung per jam di dalamnya.

```
┌───────────────────────────────────────┐
│ [chip] Brownies · 16 potong            │  ← tab kecil menempel di atas kartu
│                                        │
│  Rp 5.000                              │  ← display-num, Plus Jakarta Sans
│  harga jual per potong · Langsung      │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │            ╱▔▔▔╲  Untung Rp 2.075 │  │  ← panel latar --bg,
│  │           ▕    ▏  Kemasan Rp 1.000│  │     tumpukan isometrik + label
│  │           ▕    ▏  Energi  Rp 188  │  │
│  │           ▕    ▏  Bahan   Rp 1.738│  │
│  └──────────────────────────────────┘  │
│  ┌───────────────┐ ┌─────────────────┐ │
│  │ Margin        │ │ untungmu setelah│ │  ← dua kotak --surface-soft
│  │ 41,5%         │ │ 1,5 jam kerja   │ │     bersebelahan
│  │               │ │ Rp 22.133       │ │
│  └───────────────┘ └─────────────────┘ │
│                                        │
│ [ Simpan harga ini ] [ Buat gambar > ] │
└───────────────────────────────────────┘
```

- Latar `--surface` (putih), garis 1 px `--line`, radius 28 px, bayangan tingkat 2. Semua teks `--ink`; label tab "Harga saran" `--caramel-700`.
- Tumpukan isometrik menggantikan garis sirkuit referensi A, duduk di panel `--bg` radius 16 px sebagai jendela terang di dalam kartu.
- Margin dan untung per jam masing-masing kotak radius 16 px `--surface-soft`, bersebelahan (grid 2 kolom) di bawah panel isometrik. Markup hanya muncul di kartu ringkas HP (kalimat singkat, bukan kotak terpisah), untuk menghemat ruang.
- Dua tombol: "Simpan harga ini" (kapsul `--ink`, aksi) dan "Buat gambar daftar harga" (kapsul sekunder bergaris `--ink-muted`, membuka layar lain sehingga boleh memakai chevron).
- Jika margin di bawah target: tab berubah menjadi teks `--danger` "Di bawah target 40%". Jika rugi: angka harga tetap, dan baris kedua berubah menjadi "Rugi Rp 350 per potong".

### 9.7 Baris bahan
- Tinggi minimum 56 px. Kiri: nama bahan (body) dan "1 kg · Rp 14/gram" (label, muted). Kanan: harga beli dalam input angka yang bisa diubah langsung.
- Setelah harga diubah, baris menampilkan "Dipakai di 3 resep" sebagai tautan.

### 9.8 Alarm margin
- Banner di atas daftar, latar `--peach-100`, ikon `triangle-alert` `--caramel-700`, teks: "3 menu untungnya turun di bawah target. Lihat menu."
- Bisa ditutup dengan tombol dan `Escape`; muncul lagi hanya jika ada perubahan harga baru.

### 9.9 Tombol
| Jenis | Tampilan | Contoh label |
|---|---|---|
| Utama | Kapsul `--ink`, teks putih, tinggi 48 px | "Hitung resep pertamamu", "Simpan harga ini" |
| Sekunder | Kapsul `--surface`, garis `--ink-muted`, teks `--ink` | "Tambah bahan", "Buat gambar daftar harga" (di kartu hasil, sama seperti sekunder biasa) |
| Tautan | Teks `--caramel-700`, garis bawah 1 px | "Lihat cara hitungnya" |

Fokus keyboard semua tombol: cincin 2 px `--caramel-600` dengan jarak 2 px. `outline: none` tanpa pengganti dilarang (R-32).

### 9.10 Gambar daftar harga (untuk dibagikan)
- Ukuran 1080×1920 dan 1080×1080. Latar `--bg`, judul Plus Jakarta Sans nama usaha pengguna, daftar menu dengan harga, satu tumpukan isometrik kecil sebagai motif sudut.
- Versi gratis: baris kecil di bawah "dihitung dengan Takaran" (13 px setara, `--ink-muted`). Versi Pro: tanpa baris itu.
- Tidak menampilkan HPP atau margin (data internal penjual).

---

## 10. Layar

### 10.1 Kalkulator (layar utama, mengikuti referensi A)

**Desktop (≥ 1024 px)**
```
            ( Takaran  Kalkulator  Bahan  Resep  Penawaran  ◐ )

  [chip] Brownies · 16 potong                ┌──────────────────────┐
                                             │  KARTU HASIL (9.6)   │
  Hitung untung brownies                     │                      │
                                             │                      │
  Rincian biaya                              │                      │
  (Bahan Rp 27.800 + energi Rp 3.000)        │                      │
  ÷ 16 potong + kemasan Rp 1.000             │                      │
  = HPP Rp 2.925 per potong                  │                      │
                                             │                      │
  ┌ kotak catatan: margin vs markup ┐        │                      │
  └─────────────────────────────────┘        │                      │
                                             │                      │
  ┌ panel slider ───────────────────┐        │                      │
  │ Target untung  ▮▮▮▮|             │        │                      │
  │ Saluran jual   ▮▮|                │        │                      │
  │ Jam kerja      ▮▮▮|               │        └──────────────────────┘
  └─────────────────────────────────┘
  Ubah resep >
```

**HP (< 640 px)**: urutan dari atas: chip, judul (display-l), rincian biaya (bisa dilipat), panel slider, kotak catatan. Kartu hasil ringkas (harga jual + margin + tombol "Detail") menempel di bawah di atas tab bar; mengetuk "Detail" membuka kartu penuh sebagai sheet yang bisa ditutup dengan `Escape`/geser turun.

### 10.2 Ringkasan usaha
- Judul menyapa pengguna dengan nama depan dan tanggal lokal Jakarta. CTA utama "Hitung resep baru" berada di kanan pada desktop dan turun di bawah judul pada layar sempit.
- Empat kartu menampilkan rata-rata margin, jumlah menu di bawah target, bahan yang benar-benar naik harga dalam 30 hari, dan untung per jam terbaik. Perubahan margin hanya dibandingkan bila histori memuat titik pembanding; perubahan harga diambil dari riwayat milik akun. Nilai tanpa sumber ditampilkan sebagai belum tersedia.
- Bagian analitik menampilkan grafik margin bulanan selebar konten. Filter resep memperbarui grafik.
- Tabel "Menu kamu" menampilkan hasil per adonan, HPP, harga jual, margin beserta penanda target, dan status teks. Kanvas dan kartu dashboard memakai latar putih seperti sidebar; aksen peach hanya digunakan pada elemen penanda yang relevan. Di kolom kanan tabel, "Isi harga jual" berdiri sendiri dan "Perlu kamu cek" berada sebagai kartu terpisah di bawahnya. Panel ini hanya berisi resep yang gagal dihitung atau berada di bawah target, disertai aksi harga saran yang menyimpan nilai lewat perintah yang sudah ada.
- Untuk akun tanpa data, pertahankan kartu ringkasan nol/keadaan belum tersedia dan CTA membuat resep; jangan mengisi angka contoh dari mockup.
- Alasan: pemilik usaha dapat melihat kesehatan harga dan tindakan berikutnya dalam satu layar tanpa laporan yang mengarang tren.

### 10.3 Bahan
- Judul dan jumlah bahan sejajar dengan tombol "Tambah bahan". Banner alarm berada setelah judul, pencarian memenuhi lebar konten, lalu tabel berkolom Bahan, Harga beli, Per satuan, dan Perubahan.
- Baris menampilkan nama, jumlah resep yang memakai bahan, input harga dengan satuan beli, harga per satuan pakai, serta perubahan harga nyata. Di HP, kolom berubah menjadi baris bertumpuk dengan label yang tetap terbaca.
- Penyuntingan harga, validasi, simpan, batal, dan tautan ke resep tetap memakai handler yang ada. Alarm margin (9.8) tidak menutup pencarian atau baris.
- Alasan: kolom sejajar memudahkan membandingkan harga beli dengan dampaknya tanpa membuka tiap resep.

### 10.4 Resep dan editor
- Header menampilkan jumlah resep dibanding batas paket (misalnya "3 dari 3 resep gratis") dan tombol "Buat resep". Filter Semua, Di bawah target, dan Di atas target memakai nilai margin aktual.
- Resep ditampilkan sebagai baris tabel: ikon yang sama dengan favicon Takaran, nama dan hasil per adonan, modal, harga jual atau saran, margin dengan garis target, status teks, dan chevron menuju detail. Pada HP, angka penting diringkas dalam baris tanpa overflow horizontal.
- Editor tetap tiga langkah agar banyak field tidak muncul sekaligus: Detail resep, Bahan, lalu Biaya tambahan. Gunakan kartu putih, garis tipis, input beradius 10 px, progres karamel, dan tombol kapsul; validasi langkah, data formulir, batas Pro, hapus, dan simpan tidak berubah.
- Detail resep menampilkan tombol Hitung harga, Ubah, dan Duplikat; kartu ringkasan HPP/harga/margin, rincian komponen, serta modal editor yang sama.
- Alasan: tabel mempertahankan kepadatan data desktop, sedangkan langkah editor mengurangi beban saat menambahkan resep.

### 10.5 Alur Hitung HPP
- Menu Hitung HPP membuka halaman pemilih resep. Memilih resep membuka layar hitung detail untuk resep tersebut. Tombol "Hitung harga" pada detail resep membuka layar hitung detail secara langsung.
- Layar kalkulator menampilkan nama resep yang sedang dibuka tanpa dropdown untuk berpindah resep. Tautan kembali menuju pemilih resep bila kalkulator dibuka dari menu Hitung HPP, atau menuju detail resep bila dibuka dari halaman Resep.
- Akun tanpa resep diarahkan untuk membuat resep atau menambahkan bahan terlebih dahulu.
- Alasan: jalur dari menu membantu pengguna memilih resep lebih dulu, sementara jalur dari detail resep mempertahankan konteks pilihan mereka.

### 10.6 Penawaran pesanan custom
Kiri: resep dasar + daftar opsi (checkbox) dengan harga tambahan. Kanan: pratinjau gambar penawaran dengan nama usaha, rincian, dan total. Tombol "Unduh gambar penawaran".

### 10.7 Daftar harga
- Panel kiri berisi nama usaha, pilihan menu beserta harga, dan pilihan Story 9:16/Feed 1:1 sebagai kontrol tersegmentasi. Tombol Bagikan dan Unduh berada di bawah form bila kedua aksi didukung browser.
- Panel kanan berwarna `--surface-soft` menjadi bidang pratinjau; kanvas Story berukuran hingga 432 px agar tetap terbaca tanpa menutupi form. Gambar memakai desain §9.10 dan selalu memakai data resep serta nama usaha aktual.
- Alasan: form dan hasil terlihat bersamaan sehingga perubahan pilihan cepat diperiksa sebelum dibagikan.

### 10.8 Landing page (mengikuti referensi B, disaring)

Urutan mengikuti cerita masalah pengguna, bukan template (R-05, C-3). Semua tautan navbar menuju section yang ada di bawah.

| # | Section | Isi | Komposisi |
|---|---|---|---|
| 1 | Navbar kapsul | `[LOGO]` Takaran · Cara hitung · Harga bahan naik · Pesanan custom · Harga · tombol utama "Coba hitung resepmu" | Kapsul melayang di atas krem |
| 2 | Hero | Judul Plus Jakarta Sans: "Laris, tapi uangnya nggak kelihatan?" Sub: "Masukkan harga bahan dari struk belanja. Dalam 5 menit kamu tahu HPP per potong dan harga jual yang benar-benar untung." Tombol utama "Hitung HPP brownies-mu" (scroll ke demo), tautan "Lihat harga Pro". **Kanan: demo kalkulator yang benar-benar bisa dipakai** (kartu hasil + satu slider), bukan gambar kerangka abu-abu. Ilustrasi meja dapur isometrik di belakang demo | Dua kolom, gradasi karamel hanya di kartu demo |
| 3 | Harga bahan naik | Judul Plus Jakarta Sans "Telur naik Rp 600. Brownies-mu masih untung?" Tabel sebelum-sesudah dari contoh PRD bagian 7, diberi label "Contoh hitungan" | Latar `--surface`, tabel lebar penuh, tanpa kartu |
| 4 | Untungmu per jam | Angka Plus Jakarta Sans sangat besar "Rp 22.133 / jam" dengan penjelasan satu paragraf dan label "Contoh: brownies, 1,5 jam per loyang" | Satu kolom tengah, jarak atas-bawah 112 px |
| 5 | Pesanan custom | Kiri teks, kanan pratinjau gambar penawaran kue ulang tahun (data contoh diberi label) | Dua kolom terbalik dari hero |
| 6 | Harga | Dua kolom Gratis dan Pro dengan daftar isi sesuai PRD bagian 12. Tidak ada lencana "Paling populer". Sisa kuota harga pendiri hanya ditampilkan jika angkanya nyata (`[REAL DATA]`) | Latar `--surface-soft` |
| 7 | Daftar tunggu gratis | Formulir: nama usaha, nomor WA, jenis jualan, dan persetujuan. Tombol "Daftar gratis". State berhasil, gagal, dan sedang mengirim wajib ada | Kartu tunggal |
| 8 | FAQ | **Dibuat (27 September 2026, atas permintaan pemilik)**, tapi hanya 4 pertanyaan yang jawabannya adalah fakta produk yang sudah pasti benar (bukan tebakan keresahan pengguna): "Data resepku disimpan di mana?", "Kalau ganti HP, datanya hilang?", "Takaran gratis atau bayar?" (angka dari `FREE_LIMITS`/`PRICING`, bukan dikarang), "Harus punya akun Google?". Tidak menambah pertanyaan andaian di luar fakta yang sudah ada di dokumen ini | Accordion (`components/ui/accordion.tsx`, Radix), bisa dibuka dengan keyboard |
| 9 | Footer | Satu baris: nama produk, email kontak `[REAL DATA]`, kalimat "Data resep kamu tersimpan di HP kamu, bukan di server kami." | Satu baris, bukan 4 kolom |

Yang sengaja tidak ada: deretan logo, rating bintang, testimoni, statistik jumlah pengguna, section "3 langkah" generik ala "Trusted by 10.000+ businesses". Diminta pemilik (27 September 2026) meniru pola itu dari referensi baru, tapi ditolak: Takaran tidak punya 10.000 klien perusahaan atau logo yang boleh dipakai, jadi angka dan logonya pasti karangan (melanggar aturan keras "Tanpa data palsu"). Testimoni hanya ditambahkan setelah ada penjual nyata yang setuju nama dan kutipannya dipakai.

**Aksen pemisah titik (27 September 2026):** satu baris titik dekoratif tipis (`.landing-dot-divider`) di bawah kartu hero, diadaptasi dari aksen bintik bergelombang dua-baris di bawah kartu gelap pada referensi. Dibuat satu baris tipis saja (bukan dua baris tebal bergelombang) supaya tetap tenang sesuai dial ENERGY 2, dipakai di satu tempat saja (bukan di setiap transisi) supaya tidak jadi dekorasi berulang tanpa arti.

### 10.9 Beli dan aktivasi Pro

- `/beli` memakai palet hangat dan form yang sudah ada. Tampilkan harga dari `PRICING` dan satu CTA utama: **"Bayar dengan Mayar"**.
- Form checkout berisi nama, email, nomor WhatsApp, nama usaha, persetujuan pemakaian data, dan Turnstile. Jelaskan singkat bahwa kontak dipakai untuk pesanan dan aktivasi lisensi.
- Transfer manual/QRIS statis hanya menjadi cadangan saat `VITE_PAYMENT_BANK_NAME`, `VITE_PAYMENT_ACCOUNT_NAME`, `VITE_PAYMENT_ACCOUNT_NUMBER`, `VITE_PAYMENT_QRIS_IMAGE`, dan `VITE_SELLER_WA` semuanya tersedia. Jika tidak, sembunyikan jalur manual; jangan tampilkan rekening atau instruksi contoh.
- Setelah checkout, simpan token klaim di pengaturan lokal lalu buka `paymentUrl` lewat navigasi biasa. Jangan tampilkan halaman pembayaran di iframe.
- `/aktivasi?order=<id>` menampilkan status pembayaran. Status berhasil menampilkan konfirmasi aktivasi; status menunggu memberi tahu bahwa aplikasi akan mengecek lagi saat dibuka; gagal atau kedaluwarsa memberi jalan kembali ke `/beli`.
- Gunakan state memuat, berhasil, gagal, dan kedaluwarsa yang ringkas. Tidak perlu ilustrasi atau komponen baru khusus pembayaran.

---

## 11. State Wajib (R-27)

| Layar | Kosong | Memuat | Error |
|---|---|---|---|
| Kalkulator | Ilustrasi loyang kosong + "Mulai dari satu resep. Pakai contoh brownies atau buat sendiri." + dua tombol | Kerangka kartu hasil 300 ms maksimal (data lokal, jarang terlihat) | "Data tidak terbaca. Pulihkan dari file cadangan?" + tombol |
| Bahan | Rak kosong isometrik + "Tambah bahan dari struk belanja terakhirmu" | Tidak diperlukan (lokal) | Nilai tidak valid di input: pesan di bawah field, misal "Isi kemasan harus lebih dari 0" |
| Resep | Loyang kosong + "Belum ada resep" | Tidak diperlukan | Referensi melingkar: "Adonan dasar tidak bisa memakai dirinya sendiri" |
| Aktivasi Pro | Field kosong + contoh format kode | Tombol berputar "Memeriksa kode" | "Kode tidak cocok. Periksa lagi atau hubungi kami lewat WhatsApp." |
| Form daftar tunggu / checkout | Field kosong | Tombol nonaktif + "Mengirim" | "Belum terkirim. Periksa sinyal lalu coba lagi." Isian tidak hilang |
| Checkout Mayar | Belum ada checkout | Tombol "Membuka pembayaran" | "Pembayaran belum terkonfirmasi. Kami cek lagi otomatis saat kamu membuka aplikasi." |
| Offline | Tidak ada banner; aplikasi berfungsi normal | Tidak ada | Hanya formulir landing yang menampilkan "Kamu sedang offline" |

---

## 12. Copy dan Suara

- Bahasa Indonesia sehari-hari, sapaan "kamu", kalimat pendek. Seperti teman yang jago hitung, bukan akuntan.
- Pakai kata pengguna: "modal", "untung", "rugi", "harga jual", "satu loyang". Istilah "HPP" boleh, selalu dengan penjelasan pertama kali: "HPP (modal per potong)".
- Dilarang: "revolusioner", "canggih", "berbasis AI", "solusi terbaik", "seamless" (R-16). Tidak ada tanda pisah panjang di teks UI (R-02).
- CTA spesifik (R-15): "Hitung resep pertamamu", "Hitung HPP brownies-mu", "Simpan harga ini", "Buat gambar daftar harga", "Pesan harga pendiri". Tidak ada "Get started", "Mulai sekarang", "Pelajari lebih lanjut".
- Angka contoh di landing page selalu diberi label "Contoh hitungan" agar tidak dibaca sebagai klaim.

---

## 13. Placeholder yang Belum Dikonfirmasi (R-23, R-38)

| Aset | Placeholder sementara | Perlu keputusan dari |
|---|---|---|
| Nama produk | "Takaran" (nama kerja) | Pemilik produk |
| Logo | Wordmark teks "Takaran" dalam serif sistem, ditandai `[LOGO]` di kode | Pemilik produk |
| Ilustrasi isometrik (hero, empty state) | Kotak garis putus-putus berlabel konsep ilustrasi | Pemilik produk / ilustrator |
| Email kontak, nomor WA pembayaran | `[REAL DATA]` | Pemilik produk |
| Sisa kuota harga pendiri | Tidak ditampilkan | Data pre-order nyata |
| Testimoni | Tidak ada section | Penjual nyata yang memberi izin |

---

## 14. Keputusan dan Alasan (R-31)

| Keputusan | Alasan satu baris |
|---|---|
| Palet krem, kakao, karamel | Warna dapur kue; langsung terbaca "untuk penjual kue", bukan aplikasi bank |
| Satu aksen karamel yang berarti "untung" | Mata pengguna belajar bahwa oranye selalu menunjukkan uang yang mereka dapat |
| Gradasi hanya di kartu demo landing | Menandai satu titik fokus di halaman landing; kartu hasil di aplikasi tetap putih supaya tumpukan isometrik dan kotak Margin/Untung per jam tidak tenggelam oleh warna |
| Tata letak dua kolom input/hasil | Sebab (slider) dan akibat (harga) terlihat bersamaan |
| Slider bertitik, bukan input angka | Penjual rumahan lebih cepat memilih "40%" daripada mengetik; tetap ada opsi ketik |
| Satu keluarga Plus Jakarta Sans untuk judul, angka, dan UI | Konsisten dengan landing page dan terasa sederhana |
| Plus Jakarta Sans untuk UI | Terbaca jelas di HP dan terasa lokal |
| Tumpukan isometrik sebagai motif | Mengubah rumus HPP menjadi gambar yang bisa dipahami dalam sekali lihat, dan menjadi ciri khas saat dibagikan |
| Sudut tajam di isometrik, membulat di UI | Memisahkan "data" dari "kontrol" secara visual |
| Bayangan hanya di navbar dan kartu hasil | Hanya dua elemen yang benar-benar melayang di atas konten |
| Tombol utama kapsul kakao | Kontras 16:1 dan tidak bersaing dengan oranye yang berarti untung |
| Tab bar di HP | Pengguna utama memakai HP dengan satu tangan |
| Satu tema terang | Konsisten dengan referensi visual dan mudah dikenali di semua halaman |
| Landing tanpa testimoni, logo, rating | Belum ada data nyata; bagian kosong lebih baik daripada palsu |

---

## 15. Sebelum Dikirim

Setiap layar yang dibangun dari file ini wajib lolos **Delivery Gate** di `antislop.md` (4 blok, laporan PASS/FAIL dengan bukti), termasuk: diuji di lebar 320, 390, 768, dan 1280 px; tetap terang saat preferensi sistem gelap; navigasi keyboard penuh; dan contoh hitungan PRD bagian 7 menghasilkan angka yang sama persis di kartu hasil.
