# RFC-015: Kalkulator publik dan halaman SEO use-case

> Status: disetujui pemilik, 30 September 2026

## Tujuan

Menyediakan kalkulator dasar tanpa login dan halaman use-case yang membantu pemilik usaha menemukan cara menghitung biaya dan harga.

## Acceptance criteria

- Tersedia `/kalkulator-hpp`, `/margin`, `/bep`, `/harga-jual`, dan `/harga-ojol` tanpa login.
- Rumus HPP, margin, harga jual, dan komisi memakai `packages/calc`; rumus break-even memiliki fungsi murni dan tes sendiri di paket yang sama.
- Semua field tervalidasi, format rupiah Indonesia, dan contoh kalkulasi diberi label ilustrasi.
- Setiap halaman memiliki metadata title/description/canonical yang unik, masuk sitemap, dan memiliki tautan internal yang jelas.
- Halaman use-case brownies, katering, frozen food, rice bowl, minuman, dan hampers memberi petunjuk kontekstual tanpa statistik/testimoni buatan.
- Tidak ada input kalkulator yang dikirim ke server atau disimpan.
- Lolos test, axe, keyboard, viewport 320 px dan 1280 px dalam tema yang didukung.
