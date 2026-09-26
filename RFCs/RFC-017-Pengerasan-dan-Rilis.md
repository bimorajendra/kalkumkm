# RFC-017: Pengerasan dan Rilis v1.0

## Ringkasan
Tidak menambah fitur. Membuktikan bahwa semua NFR, aturan aksesibilitas dan performa, serta Delivery Gate antislop terpenuhi, lalu merilis v1.0 ke produksi setelah diuji dengan penjual nyata.

**Kompleksitas**: Medium
**Fitur**: Tidak ada fitur baru. Memverifikasi NFR-01 s.d. NFR-10 dan journey J-1 s.d. J-4 untuk F1 s.d. F32 serta F41.
**Dibangun di atas**: RFC-004 s.d. RFC-016
**Dibutuhkan oleh**: Tidak ada (RFC terakhir v1.0)

## Pendekatan Teknis

### File
```
e2e/journeys/j1-first-recipe.spec.ts
e2e/journeys/j2-price-increase.spec.ts
e2e/journeys/j3-custom-order.spec.ts
e2e/journeys/j4-upgrade.spec.ts
e2e/a11y-all-screens.spec.ts
lighthouserc.json
.github/workflows/deploy.yml
anti-slop/gate-v1.0.md          # laporan Delivery Gate PASS/FAIL dengan bukti
docs/release-checklist.md
docs/field-test-notes.md        # catatan uji dengan penjual nyata
```

### Verifikasi
| Target | Cara | Batas |
|---|---|---|
| NFR-01 | Benchmark `recalcAll` di CI | < 200 ms, CPU 4× lebih lambat |
| NFR-02, RU-52 | `size-limit` | JS awal ≤ 170 KB, total ≤ 250 KB gzip |
| NFR-03 | Fitur lokal dan aktivasi kode diulang offline; checkout Mayar memakai sandbox/mock saat online dan tetap memberi state menunggu jika offline | Lulus |
| NFR-04 | Test tetap brownies + pemeriksaan angka yang sama di kalkulator, daftar resep, dan gambar | Identik |
| NFR-05 | Test Playwright yang mencatat semua permintaan jaringan selama J-1 s.d. J-4 | Tidak ada nama bahan, resep, atau harga di URL/body |
| NFR-06 | `a11y-all-screens.spec.ts` di 4 lebar x 2 tema, plus uji manual TalkBack di Android | Nol pelanggaran serius |
| NFR-07 | Tinjau semua `copy.ts` | Bahasa sehari-hari, format angka Indonesia |
| NFR-08 | Journey di 320, 390, 768, 1280 px | Tanpa overflow horizontal |
| NFR-09 | Test pengingat cadangan (RFC-010) | Lulus |
| NFR-10 | Tagihan dan konfigurasi Cloudflare | Pages, Workers, D1; tidak ada backend di luar stack yang disetujui |
| F41, RU-63 s.d. RU-67 | API checkout dan webhook | Sandbox/mock saja; harga server-side; verifikasi invoice; webhook duplikat idempoten; kunci tidak muncul di klien/log |
| RU-56 | Lighthouse CI | Performa ≥ 90, Aksesibilitas 100 untuk app dan landing |

### Delivery Gate antislop
Jalankan 4 blok Delivery Gate `antislop.md` pada aplikasi dan landing. Tulis laporan PASS/FAIL dengan bukti per baris di `anti-slop/gate-v1.0.md`. Semua placeholder DESIGN bagian 13 harus sudah diganti data nyata atau tetap berlabel jelas.

### Uji lapangan
Minimal 5 penjual nyata (dari daftar pre-order) memakai aplikasi di HP mereka sendiri. Catat di `docs/field-test-notes.md`: waktu sampai HPP pertama, di mana mereka bingung, dan bug. Bug yang ditemukan diperbaiki sebelum rilis atau dicatat sebagai issue dengan alasan penundaan.

### Rilis
`deploy.yml`: pada tag `v*`, jalankan semua cek, migrasi D1, deploy Worker, deploy Pages app dan landing ke produksi. `docs/release-checklist.md` mencatat pemeriksaan pemilik: kunci publik, secret Worker, `MAYAR_BASE_URL` dan konfigurasi Mayar produksi, opsi cadangan `VITE_PAYMENT_*`, domain final, dan kebijakan privasi. RFC ini tidak melakukan perubahan akun atau produksi.

## Edge Case
- Delivery Gate menemukan FAIL: rilis ditunda sampai diperbaiki (tidak ada pengecualian).
- Uji lapangan menunjukkan HPP pertama rata-rata > 5 menit: temuan dicatat dan dibahas dengan `/manage-changes` sebelum rilis.

## Aturan Terkait
RU-36, RU-39 s.d. RU-44, RU-49, RU-50, RU-52 s.d. RU-58.

## Acceptance Criteria
- [ ] Semua file di bagian Struktur ada
- [ ] J-1 s.d. J-3 lulus online dan offline di 4 lebar x 2 tema; J-4 lulus dengan Mayar sandbox/mock dan aktivasi lisensi offline
- [ ] Test jaringan membuktikan tidak ada nama bahan, resep, takaran, atau harga yang keluar dari perangkat
- [ ] `a11y-all-screens.spec.ts` lulus dengan nol pelanggaran serius; uji TalkBack manual tercatat
- [ ] Benchmark, `size-limit`, dan Lighthouse CI memenuhi batas di tabel Verifikasi
- [ ] Angka brownies identik di kalkulator, daftar resep, landing, dan gambar daftar harga
- [ ] `anti-slop/gate-v1.0.md` berisi laporan 4 blok tanpa FAIL, setiap PASS disertai bukti
- [ ] Minimal 5 penjual nyata mencoba dan temuannya tercatat di `docs/field-test-notes.md`
- [ ] `deploy.yml` merilis Worker, D1, app, dan landing dari tag `v*` setelah semua cek lulus
- [ ] `docs/release-checklist.md` selesai dicentang sebelum tag `v1.0.0`
- [ ] J-4 mencakup pembayaran belum dikonfirmasi, sukses, invoice kedaluwarsa/nominal salah, webhook berulang, dan jalur transfer manual cadangan
