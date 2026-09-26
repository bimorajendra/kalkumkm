# DESIGN.md: Takaran (nama kerja)

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

---

## 2. Design Read dan Dial

> Reading this as: **alat hitung untung berbasis HP untuk penjual kue dan makanan rumahan** di Indonesia, dengan bahasa visual **buku resep hangat bertemu kalkulator presisi**, dial **ENERGY 2 / RHYTHM 2 / MOTION 2**.

`Dial: ENERGY 2 / RHYTHM 2 / MOTION 2`

| Dial | Nilai | Artinya di produk ini |
|---|---|---|
| ENERGY | 2 | Tenang dan rapi, dengan satu momen yang "berbunyi": kartu hasil oranye dan angka serif besar. Bukan halaman eksperimental. |
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
| `--bg` | `#FBF6F1` | Latar halaman (krem) |
| `--surface` | `#FFFFFF` | Kartu, input |
| `--surface-soft` | `#F5ECE3` | Panel slider, baris tabel selang-seling, kotak catatan |
| `--line` | `#E7D9CB` | Garis pemisah dekoratif (bukan batas kontrol) |
| `--ink` | `#2B1D14` | Teks utama (cokelat kakao, bukan hitam murni) |
| `--ink-muted` | `#6E5A4B` | Teks sekunder, label satuan |
| `--caramel-300` | `#FFC08A` | Ujung terang gradasi kartu hasil |
| `--caramel-400` | `#FF9A4D` | Isi slider aktif, tengah gradasi |
| `--caramel-500` | `#F07A1F` | Aksen utama: lempeng Untung, ujung gelap gradasi |
| `--caramel-600` | `#C85A0C` | Batas kontrol aktif, thumb slider, teks besar (≥ 24 px) |
| `--caramel-700` | `#9E4308` | Teks tautan dan teks oranye ukuran normal |
| `--peach-100` | `#FFE3CC` | Latar chip dan latar alarm margin |
| `--tan-100` … `--tan-400` | `#F3E6D8`, `#E8D2BC`, `#D9B99A`, `#C49A74` | Lempeng isometrik non-untung saja |
| `--danger` | `#B42318` | Rugi, error |
| `--success` | `#1E7A4C` | Margin di atas target |

### 4.2 Token (mode gelap)

| Token | Hex |
|---|---|
| `--bg` | `#17110D` |
| `--surface` | `#221913` |
| `--surface-soft` | `#2C211A` |
| `--line` | `#3A2C22` |
| `--ink` | `#F6EDE4` |
| `--ink-muted` | `#C4B2A3` |
| `--caramel-400` | `#FF9A4D` (teks dan aksen) |
| `--caramel-300` | `#FFC08A` (tautan) |
| `--danger` | `#F97066` |
| `--success` | `#4ADE8A` |

Kartu hasil di mode gelap tetap bergradasi karamel dengan teks `#2B1D14`, karena itu titik fokusnya.

### 4.3 Aturan pakai

1. **Palet inti:** kakao (ink), karamel, krem. **Satu aksen:** karamel-500, dan artinya selalu "untung". Jangan pakai karamel untuk hal yang bukan uang atau aksi utama.
2. **Gradasi hanya satu tempat:** kartu hasil kalkulator dan kartu demo di hero landing page, arah 160°, `--caramel-300` ke `--caramel-500`. Alasan (R-01): menandai satu titik fokus per layar. Tidak ada gradasi di latar halaman, tombol, atau ikon.
3. **Teks di atas oranye selalu `--ink`,** tidak pernah putih. Putih di atas `#F07A1F` hanya 2,80:1.
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
| Gelap: ink di surface | 14,92 | Semua teks |
| Gelap: ink-muted di surface | 8,42 | Semua teks |
| Gelap: caramel-400 di surface | 8,21 | Teks dan aksen |
| Gelap: danger di surface | 6,20 | Semua teks |
| Gelap: success di surface | 9,95 | Semua teks |

`--line` (1,38:1) hanya untuk pemisah dekoratif. Batas input dan kontrol wajib memakai `--ink-muted` atau `--caramel-600` agar mencapai 3:1.

### 4.5 Tema

Tidak ada alasan kuat untuk memaksa satu tema, jadi **toggle terang/gelap dibangun sejak MVP** dan default mengikuti pengaturan sistem (R-21, R-34). Kedua mode wajib diuji.

---

## 5. Tipografi

| Peran | Font | Alasan |
|---|---|---|
| Display: judul, angka hasil besar | **Instrument Serif** (Google Fonts) | Serif ramping seperti referensi B; terasa seperti buku resep, bukan dasbor bank. Membuat angka hasil terasa "istimewa" |
| UI: teks, label, tabel, tombol | **Plus Jakarta Sans** (Google Fonts), 400/500/600/700 | Dirancang untuk Jakarta, terasa lokal, jelas di ukuran kecil di layar HP. Wajib cek dukungan `tnum`; jika tidak tersedia, kolom angka di tabel memakai `Inter` dengan `tabular-nums` |

### Skala

| Token | Ukuran / tinggi baris | Font | Dipakai untuk |
|---|---|---|---|
| `display-xl` | 64/64 (desktop), 44/46 (HP) | Instrument Serif | Judul hero landing |
| `display-num` | 72/72 (desktop), 52/54 (HP) | Instrument Serif | Harga jual disarankan di kartu hasil |
| `display-l` | 44/48, HP 34/38 | Instrument Serif | Judul layar ("Hitung untung brownies") |
| `title` | 20/28, 600 | Plus Jakarta Sans | Judul panel ("Target untung", "Saluran jual") |
| `body` | 16/24, 400 | Plus Jakarta Sans | Teks umum. Minimum 16 px di input agar HP tidak zoom |
| `label` | 14/20, 500 | Plus Jakarta Sans | Label slider, satuan |
| `caption` | 13/18, 400 | Plus Jakarta Sans | Catatan kaki. Tidak lebih kecil dari 13 px |

Aturan:
- Tidak ada label huruf kapital dengan jarak huruf lebar (R-06). Label "DETAILS:" di referensi A diganti kalimat biasa ("Rincian biaya per potong").
- Angka rupiah selalu format Indonesia: `Rp 5.000`, `41,5%`. Simbol `Rp` di angka besar memakai ukuran 50% dari angka.
- Judul serif memakai `letter-spacing: -0.01em`; teks UI tanpa pengaturan jarak huruf.

---

## 6. Ruang, Grid, Radius, Elevasi

| Aspek | Nilai | Alasan |
|---|---|---|
| Satuan ruang | Kelipatan 4 px: 4, 8, 12, 16, 24, 32, 48, 72, 112 | Konsisten dan mudah diterapkan di Tailwind |
| Grid aplikasi desktop (≥ 1024 px) | 12 kolom, lebar maks 1120 px, input 6 kolom, jarak 1 kolom, kartu hasil 5 kolom | Meniru proporsi referensi A |
| Grid tablet (640 sampai 1023 px) | Satu kolom, kartu hasil menempel di atas panel input (sticky ringkas) | Hasil tetap terlihat saat slider digeser |
| HP (< 640 px) | Satu kolom, gutter 16 px, kartu hasil ringkas menempel di bawah layar di atas tab bar | Jempol mengatur slider, mata melihat hasil |
| Radius | Kontrol dan chip 10 px; kartu 20 px; kartu hasil 28 px; navbar kapsul penuh | Variasi radius menandai hierarki (R-11). Hanya navbar dan tombol yang berbentuk kapsul |
| Elevasi | Hanya dua tingkat: navbar melayang dan kartu hasil (`0 12px 32px rgb(43 29 20 / 0.10)`). Kartu lain datar dengan garis | Bayangan menandai elemen yang melayang di atas konten (R-12) |
| Jarak antar section landing | Bervariasi: 112, 72, 112, 48 | Ritme tidak seragam, sesuai RHYTHM 2 |

---

## 7. Ikon

- Set: **Lucide**, stroke 1,75 px, ukuran 20 px (24 px di tab bar).
- Hanya ikon yang maknanya langsung: `wheat` (bahan), `cookie` atau `cake` (resep), `receipt` (penawaran), `store` (saluran), `hard-drive-download` (cadangan), `triangle-alert` (alarm margin).
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

### 9.1 Navbar kapsul (desktop dan landing)
- Kapsul putih melayang, radius penuh, bayangan tingkat 1, lebar menyesuaikan isi, di tengah.
- Isi aplikasi: wordmark `[LOGO]` teks "Takaran", lalu Kalkulator, Bahan, Resep, Penawaran, lalu tombol ikon tema. Item aktif memakai latar `--surface-soft` dan teks `--ink` tebal.
- Semua item wajib menuju layar yang ada (R-24). Penawaran tampil hanya jika fitur FR-19 sudah dibangun; sebelum itu disembunyikan.

### 9.2 Tab bar (HP, < 640 px)
- Menggantikan navbar. 4 tab: Hitung, Bahan, Resep, Lainnya. Tinggi 64 px, target sentuh 48 px, label teks selalu tampil di bawah ikon.

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
Diadaptasi dari kartu biru referensi A dan kartu oranye referensi B.

```
┌───────────────────────────────────────┐
│ [chip] Brownies · 16 potong            │  ← tab kecil menempel di atas kartu
│                                        │
│  Rp 5.000                              │  ← display-num, serif
│  harga jual per potong                 │
│                                        │
│  Rp 22.133 / jam                       │  ← display-l, serif
│  untungmu setelah 1,5 jam kerja        │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Margin 41,5% · markup 70,9%      │  │  ← pita ringkas, latar putih 55%
│  └──────────────────────────────────┘  │
│                        ╱▔▔▔╲  Untung    │
│                       ▕    ▏ Rp 2.075   │  ← tumpukan isometrik + label
│                       ▕    ▏ Kemasan    │
│                       ▕    ▏ Bahan      │
│                                        │
│ [ Simpan harga ini ] [ Buat gambar > ] │
└───────────────────────────────────────┘
```

- Latar gradasi 160° `--caramel-300` ke `--caramel-500`, radius 28 px, bayangan tingkat 2. Semua teks `--ink`.
- Tumpukan isometrik menggantikan garis sirkuit referensi A dan berada di kanan bawah.
- Dua tombol putih seperti referensi A: "Simpan harga ini" (aksi) dan "Buat gambar daftar harga" (membuka layar lain, jadi boleh memakai chevron).
- Jika margin di bawah target: pita berubah menjadi latar `--surface` dengan teks `--danger` "Di bawah target 40%". Jika rugi: angka harga tetap, dan baris kedua berubah menjadi "Rugi Rp 350 per potong".

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
| Sekunder | Kapsul `--surface`, garis `--ink-muted`, teks `--ink` | "Tambah bahan" |
| Di kartu hasil | Kotak radius 12 px `--surface`, teks `--ink` | "Buat gambar daftar harga" |
| Tautan | Teks `--caramel-700`, garis bawah 1 px | "Lihat cara hitungnya" |

Fokus keyboard semua tombol: cincin 2 px `--caramel-600` dengan jarak 2 px (mode gelap `--caramel-300`). `outline: none` tanpa pengganti dilarang (R-32).

### 9.10 Gambar daftar harga (untuk dibagikan)
- Ukuran 1080×1920 dan 1080×1080. Latar `--bg`, judul serif nama usaha pengguna, daftar menu dengan harga, satu tumpukan isometrik kecil sebagai motif sudut.
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

### 10.2 Bahan
Daftar baris bahan (9.7), kotak pencarian di atas, tombol "Tambah bahan" menempel di bawah pada HP. Alarm margin (9.8) di atas daftar setelah ada perubahan harga.

### 10.3 Resep
Daftar resep sebagai baris (bukan grid kartu identik): nama, HPP, harga jual, dan titik status margin (hijau/merah + teks "Di atas target" / "Di bawah target"). Editor resep: daftar bahan dengan takaran, hasil per adonan, kemasan, energi.

### 10.4 Penawaran pesanan custom
Kiri: resep dasar + daftar opsi (checkbox) dengan harga tambahan. Kanan: pratinjau gambar penawaran dengan nama usaha, rincian, dan total. Tombol "Unduh gambar penawaran".

### 10.5 Landing page (mengikuti referensi B, disaring)

Urutan mengikuti cerita masalah pengguna, bukan template (R-05, C-3). Semua tautan navbar menuju section yang ada di bawah.

| # | Section | Isi | Komposisi |
|---|---|---|---|
| 1 | Navbar kapsul | `[LOGO]` Takaran · Cara hitung · Harga bahan naik · Pesanan custom · Harga · tombol utama "Coba hitung resepmu" | Kapsul melayang di atas krem |
| 2 | Hero | Judul serif: "Laris, tapi uangnya nggak kelihatan?" Sub: "Masukkan harga bahan dari struk belanja. Dalam 5 menit kamu tahu HPP per potong dan harga jual yang benar-benar untung." Tombol utama "Hitung HPP brownies-mu" (scroll ke demo), tautan "Lihat harga Pro". **Kanan: demo kalkulator yang benar-benar bisa dipakai** (kartu hasil + satu slider), bukan gambar kerangka abu-abu. Ilustrasi meja dapur isometrik di belakang demo | Dua kolom, gradasi karamel hanya di kartu demo |
| 3 | Harga bahan naik | Judul serif "Telur naik Rp 600. Brownies-mu masih untung?" Tabel sebelum-sesudah dari contoh PRD bagian 7, diberi label "Contoh hitungan" | Latar `--surface`, tabel lebar penuh, tanpa kartu |
| 4 | Untungmu per jam | Angka serif sangat besar "Rp 22.133 / jam" dengan penjelasan satu paragraf dan label "Contoh: brownies, 1,5 jam per loyang" | Satu kolom tengah, jarak atas-bawah 112 px |
| 5 | Pesanan custom | Kiri teks, kanan pratinjau gambar penawaran kue ulang tahun (data contoh diberi label) | Dua kolom terbalik dari hero |
| 6 | Harga | Dua kolom Gratis dan Pro dengan daftar isi sesuai PRD bagian 12. Tidak ada lencana "Paling populer". Sisa kuota harga pendiri hanya ditampilkan jika angkanya nyata (`[REAL DATA]`) | Latar `--surface-soft` |
| 7 | Daftar tunggu gratis | Formulir: nama usaha, nomor WA, jenis jualan, dan persetujuan. Tombol "Daftar gratis". State berhasil, gagal, dan sedang mengirim wajib ada | Kartu tunggal |
| 8 | FAQ | **Tidak dibuat sampai ada pertanyaan nyata** dari wawancara/pre-order (R-28). Kandidat yang sudah pasti relevan: "Data resep saya disimpan di mana?" dan "Kalau ganti HP, datanya hilang?" | Accordion, bisa dibuka dengan keyboard |
| 9 | Footer | Satu baris: nama produk, email kontak `[REAL DATA]`, kalimat "Data resep kamu tersimpan di HP kamu, bukan di server kami." | Satu baris, bukan 4 kolom |

Yang sengaja tidak ada: deretan logo, rating bintang, testimoni, statistik jumlah pengguna, section "3 langkah". Testimoni hanya ditambahkan setelah ada penjual nyata yang setuju nama dan kutipannya dipakai.

### 10.6 Beli dan aktivasi Pro

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
| Logo | Wordmark teks "Takaran" dalam Instrument Serif, ditandai `[LOGO]` di kode | Pemilik produk |
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
| Gradasi hanya di kartu hasil | Menandai satu titik fokus per layar, tempat jawaban berada |
| Tata letak dua kolom input/hasil | Sebab (slider) dan akibat (harga) terlihat bersamaan |
| Slider bertitik, bukan input angka | Penjual rumahan lebih cepat memilih "40%" daripada mengetik; tetap ada opsi ketik |
| Instrument Serif untuk judul dan angka | Nuansa buku resep dan membuat angka jawaban terasa penting |
| Plus Jakarta Sans untuk UI | Terbaca jelas di HP dan terasa lokal |
| Tumpukan isometrik sebagai motif | Mengubah rumus HPP menjadi gambar yang bisa dipahami dalam sekali lihat, dan menjadi ciri khas saat dibagikan |
| Sudut tajam di isometrik, membulat di UI | Memisahkan "data" dari "kontrol" secara visual |
| Bayangan hanya di navbar dan kartu hasil | Hanya dua elemen yang benar-benar melayang di atas konten |
| Tombol utama kapsul kakao | Kontras 16:1 dan tidak bersaing dengan oranye yang berarti untung |
| Tab bar di HP | Pengguna utama memakai HP dengan satu tangan |
| Toggle tema terang/gelap | Tidak ada alasan kuat memaksa satu tema; banyak penjual bekerja malam hari |
| Landing tanpa testimoni, logo, rating | Belum ada data nyata; bagian kosong lebih baik daripada palsu |

---

## 15. Sebelum Dikirim

Setiap layar yang dibangun dari file ini wajib lolos **Delivery Gate** di `antislop.md` (4 blok, laporan PASS/FAIL dengan bukti), termasuk: diuji di lebar 320, 390, 768, dan 1280 px; kedua tema; navigasi keyboard penuh; dan contoh hitungan PRD bagian 7 menghasilkan angka yang sama persis di kartu hasil.
