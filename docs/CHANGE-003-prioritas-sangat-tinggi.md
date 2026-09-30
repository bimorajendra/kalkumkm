# CHANGE-003: Perluasan scope prioritas sangat tinggi

> Status: disetujui pemilik, 30 September 2026
> Perubahan kebutuhan disiapkan manual karena command `/manage-changes` tidak tersedia di lingkungan kerja ini. Dokumen ini disinkronkan ke PRD dan FEATURES.md.

## Keputusan

1. Menambahkan What-if + Impact Analysis ke scope v1.0. Simulasi menghitung selisih biaya sementara di klien; harga dan konteks tersimpan tidak berubah.
2. Menaikkan FR-28 (pesanan menjadi daftar belanja) dari v1.1/Won't ke v1.0/Must. Jumlah resep diskalakan tepat terhadap jumlah porsi pesanan; hasil tidak dibulatkan ke batch penuh.
3. Menambahkan kalkulator order/batch untuk resep tersimpan dengan total biaya, omzet, dan laba.
4. Menambahkan kalkulator publik tanpa login pada `/kalkulator-hpp`, `/margin`, `/bep`, `/harga-jual`, dan `/harga-ojol`.
5. Menambahkan halaman SEO untuk kebutuhan usaha yang disebut pemilik: brownies, katering, frozen food, rice bowl, minuman, dan hampers.
6. Seluruh angka uang tetap mengikuti aturan CR dan semua rumus baru berada di `packages/calc`; What-if menerapkan selisih biaya tanpa cabang tambahan di jalur HPP umum. Kalkulator publik berjalan tanpa menyimpan data pengguna.
7. Testing kalkulator dipertahankan sebagai gerbang kualitas: brownies PRD, nilai nol, input invalid, persentase, pembulatan, nilai besar, harga saluran, simulasi, dan kalkulasi order/list belanja.

## Bukan bagian perubahan

Fitur yang hanya berlabel "Tinggi" tetap di luar scope ini: simulasi promo/biaya marketplace lanjutan, pricing grosir bertingkat, supplier, import nota/resep, versioning resep, hampers, dan langganan.

## RFC

- `RFCs/RFC-013-what-if-impact.md`
- `RFCs/RFC-014-order-shopping-list.md`
- `RFCs/RFC-015-public-calculators-seo.md`
