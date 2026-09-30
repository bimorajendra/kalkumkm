# RFC-014: Kalkulator order dan daftar belanja

> Status: disetujui pemilik, 30 September 2026

## Tujuan

Menghitung kebutuhan bahan dan hasil finansial untuk jumlah porsi tertentu dari resep yang tersimpan.

## Acceptance criteria

- Pengguna memilih resep dan memasukkan jumlah porsi/box dalam bilangan bulat positif.
- Takaran bahan diskalakan tepat sesuai jumlah pesanan, walau membutuhkan porsi batch pecahan.
- Sub-resep diekspansi hingga bahan dasar dan kuantitas bahan dijumlahkan per bahan/satuan dasar.
- Daftar belanja menampilkan kebutuhan bersih, jumlah kemasan beli yang perlu disiapkan (dibulatkan ke atas), dan estimasi biaya pembelian.
- Kalkulator menampilkan HPP per porsi, total biaya produksi, omzet berdasarkan harga jual tersimpan atau harga saran, dan laba.
- Perhitungan murni di `packages/calc`; tidak menyimpan pesanan atau mengubah resep.
- Invalid recipe, referensi putus, jumlah nol/negatif, dan jumlah ekstrem ditangani.
- UI dapat dipakai keyboard dan pada lebar 320 px / 1280 px.
