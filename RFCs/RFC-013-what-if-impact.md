# RFC-013: What-if dan dampak perubahan harga bahan

> Status: disetujui pemilik, 30 September 2026

## Tujuan

Menjawab dampak kenaikan harga satu bahan terhadap semua resep yang menggunakannya tanpa mengubah harga tersimpan.

## Acceptance criteria

- Pengguna dapat memasukkan persentase kenaikan untuk satu bahan.
- Semua resep terdampak dihitung ulang melalui `packages/calc`.
- Hasil menunjukkan HPP dan margin sebelum/sesudah, harga jual yang dipakai untuk evaluasi, dan resep yang jatuh di bawah target.
- Resep tanpa referensi bahan itu tidak ditampilkan sebagai terdampak.
- Simulasi tidak memanggil perintah penyimpanan, tidak mengubah snapshot, dan tidak mengirim harga ke server.
- Input persen invalid dan kondisi tanpa resep terkait ditangani dengan state yang jelas.
- Kontrol dapat dipakai dengan keyboard, pembaca layar, dan viewport 320 px / 1280 px.

## Batas teknis

Hitung selisih biaya per satuan memakai Big.js, termasuk pemakaian melalui sub-resep; hasil simulasi hanya sementara dan tidak mengubah snapshot.
