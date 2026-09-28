# CHANGE-002: Motif komposisi biaya jadi batang flat + perbaikan bug terkait

> Status: sebagian disetujui, sebagian sudah dibalik pemilik (27 September 2026)
> **Bagian tipografi (font judul jadi sans-serif) sudah dibalik.** DESIGN.md kini kembali memakai judul serif (lihat banner "Arah pemilik" di atas file itu), yang menggantikan pengecualian tipografi yang tadinya ada di sini. Bagian di bawah ini yang **masih berlaku**: motif komposisi biaya (batang flat, bukan lagi isometrik 3D), ikon dekoratif lucide, elevasi `shadow-sm` pada kartu konten, warna segmen batang biaya, dan bug fix yang ditemukan sekalian. Jika ingin motif komposisi biaya dikembalikan ke isometrik 3D sesuai DESIGN.md §3 dan §9.6 saat ini, itu pekerjaan terpisah yang belum dikerjakan.

## Konteks

Pemilik menunjukkan tiga referensi visual (fleet management tool, ZkCloud, Kindly) dan sempat meminta tampilan diubah total mengikuti gaya itu, termasuk motif komposisi biaya dari tumpukan isometrik 3D menjadi batang flat + legenda teks. Tipografi kemudian dibalik lagi ke serif, tapi motif batang flat dan perbaikan di bawah ini tetap dipertahankan.

## Yang masih berubah dari DESIGN.md asli

| Aspek | Sebelum (`DESIGN.md` asli) | Sesudah (masih berlaku) |
|---|---|---|
| Motif komposisi biaya | Tumpukan 3D isometrik dengan label di dalam tiap lempeng | Batang vertikal flat proporsional + legenda teks terpisah (dot warna + label + nilai), baris tinggi tetap |
| Ikon dekoratif kecil (chip resep, sudut gambar dibagikan) | `IsometricGlyph` (kubus 3D custom) | Ikon `Cookie` dari lucide-react |
| Elevasi kartu | Hanya navbar dan kartu hasil yang berbayang; kartu lain datar dengan garis (R-12 lama) | Kartu konten (`bg-card`) memakai `shadow-sm` di seluruh aplikasi. Kotak contoh/placeholder bergaris putus-putus tetap tanpa bayangan. |
| Warna, layout dua kolom, slider bertitik, bahasa Indonesia santai | Tetap | Tidak berubah |

## Alasan teknis

- `calculateLayerHeights` di `packages/ui/src/isometric-stack.tsx` dipertahankan apa adanya (fungsi murni, sudah diuji); hanya cara merender yang berubah dari SVG 3D ke `<div>` bertingkat memakai `flexBasis`/`height` piksel. Ini juga sekaligus memperbaiki bug nyata (lihat di bawah).
- Legenda dipisah dari geometri gambar sejak sebelum keputusan ini (perbaikan bug), keputusan ini hanya mengubah bentuk gambarnya dari kubus ke batang.
- Nama komponen (`IsometricStack`, `calculateLayerHeights`, kelas CSS `takaran-isometric-stack*`) **sengaja dipertahankan** meski sudah tidak isometrik lagi, untuk membatasi jumlah berkas yang disentuh dalam satu perubahan. Ini utang penamaan yang tercatat di sini; ganti nama saat ada alasan lain untuk menyentuh berkas yang sama.

## Bug yang ikut ditemukan dan diperbaiki di perubahan yang sama

Ditemukan lewat tangkapan layar Playwright sungguhan terhadap `pnpm dev`, bukan tebakan:

1. **Kartu hasil (`ResultCard--with-visual`) memecah angka rupiah jadi satu karakter per baris** di lebar kartu ~420–500 px, karena grid CSS lama memaksa kolom gambar minimal 280 px. CSS grid itu dihapus.
2. **Label komposisi biaya saling tumpang tindih** ketika nilai antar lapisan jauh berbeda (mis. energi Rp 188 vs bahan Rp 1.738), karena teks ditaruh di dalam lempeng setipis nilainya. Diperbaiki dengan legenda terpisah, baris tinggi tetap.
3. **Baris bahan di HP tidak konsisten**: harga kadang sejajar nama, kadang jatuh ke kiri bawah, tergantung panjang teks nama bahan (`flex-wrap` otomatis). Diganti pola tegas: selalu tersusun vertikal di HP (`flex-col`), selalu sejajar di `sm:` ke atas.
4. **Tombol mengambang "Tambah bahan" menutupi baris bahan terakhir di HP** karena `<Page>` tidak diberi jarak bawah yang cukup untuk tempat tombol itu. Ditambahkan `pb-36` pada halaman Bahan.

## Susulan: warna segmen batang biaya (27 September 2026)

Setelah CHANGE-002 pertama, pemilik menilai warna belum sesuai referensi. Ditemukan lewat tangkapan layar: token `--tan-100..400` (dipakai untuk segmen Bahan/Energi/Kemasan pada batang biaya) adalah cokelat-krem pudar, sedangkan referensi memakai satu keluarga oranye yang senada untuk seluruh elemen data (persis seperti gauge oranye di referensi *Fleet insights*). Warna pudar itu terlihat "putus" dari gradasi oranye kartu hasil di sekitarnya.

- `--tan-100..400` diubah dari cokelat-krem (`#f3e6d8`…`#c49a74`) menjadi anak tangga oranye muda ke sedang (`#ffe9d2`, `#ffd3a8`, `#ffb977`, `#f5984a`) yang menyambung ke `--caramel-500` (oranye Untung) sebagai anak tangga paling gelap/jenuh.
- Segmen batang biaya (`packages/ui/src/isometric-stack.tsx`) diberi garis pemisah tipis 1 px (`color-mix` dengan `--ink`) supaya batas antar segmen tetap jelas walau warnanya senada.
- Garis pemisah antar baris menu pada gambar daftar harga yang dibagikan (`price-list-image.tsx`) sebelumnya salah memakai `--tan-200` (kini jadi oranye terang, bukan garis tipis lagi); diperbaiki memakai `--line`, token yang memang untuk garis pemisah dekoratif.
- `--tan-*` tidak dipakai di tempat lain selain batang biaya dan (yang baru diperbaiki) garis daftar harga, jadi tidak ada regresi lain.

## Sudah diverifikasi

- `pnpm lint`, `pnpm typecheck`, `pnpm test` (65 test) lulus.
- `pnpm test:e2e` (80 test Playwright + axe, lebar 320 dan 1280, tema terang dan gelap) lulus dua kali jalan penuh.
- Tangkapan layar manual: landing, kalkulator (desktop dan HP, kedua tema), bahan, resep, detail resep, penawaran, daftar harga, pengaturan.

Verifikasi ini dijalankan sebelum tipografi dibalik ke serif; belum diuji ulang setelah pembalikan itu.

## Belum diverifikasi / diketahui masih ada

- **Kartu hasil ringkas di HP (posisi tetap di atas tab bar) menutupi sebagian panel slider "Target untung" saat halaman pertama dibuka**, sebelum pengguna menggeser sedikit ke bawah. Ini ada sejak sebelum perubahan ini (bukan regresi dari redesain), muncul karena kartu ringkas sengaja dibuat menempel tetap di layar (`position: fixed`) sesuai `DESIGN.md` §10.1, dan kontennya lebih tinggi dari jarak yang tersisa di layar pertama. Bisa diatasi dengan menampilkan kartu ringkas hanya setelah pengguna mulai menggeser (intersection observer), atau memperpendek konten kartu ringkas — belum dikerjakan, perlu keputusan produk dulu karena mengubah perilaku, bukan sekadar CSS.
- Lighthouse dan uji lapangan penjual nyata belum dijalankan (di luar cakupan perubahan ini).
- Motif komposisi biaya masih batang flat, belum dikembalikan ke isometrik 3D sesuai `DESIGN.md` §3 dan §9.6 saat ini — ketidaksesuaian ini belum diperbaiki (lihat catatan status di atas).
