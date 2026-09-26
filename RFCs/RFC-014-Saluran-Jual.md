# RFC-014: Saluran Jual

## Ringkasan
Saluran jual dengan komisi atau diskon (langsung, reseller, ojol), harga saran per saluran di kalkulator, dan slider saluran di panel.

**Kompleksitas**: Medium
**Fitur**: F27 (Harga per saluran jual)
**Dibangun di atas**: RFC-008, RFC-011
**Dibutuhkan oleh**: RFC-017

## Pendekatan Teknis

### File
```
apps/app/src/features/channels/repository.ts
apps/app/src/features/channels/schema.ts
apps/app/src/features/channels/copy.ts
apps/app/src/features/channels/ensure-default.ts        # membuat "Langsung" jika belum ada
apps/app/src/features/channels/components/channel-list.tsx      # di /lainnya
apps/app/src/features/channels/components/channel-form.tsx
apps/app/src/features/channels/components/channel-price-table.tsx
apps/app/src/features/channels/repository.test.ts
e2e/channels.spec.ts
```

### Model
`Channel { id, name, kind: 'commission' | 'discount', rateBp }` (tipe dari `packages/calc`).
- **Komisi** (misal ojol 20%): harga dihitung agar margin bersih tetap sesuai target (CR-05 dengan komisi).
- **Diskon** (misal reseller 15%): harga = harga saluran Langsung dikurangi diskon, dibulatkan ke bawah; margin aktualnya ditampilkan dan bisa di bawah target.

Semua perhitungan lewat `priceForChannel` dari RFC-002.

### Perilaku
- `ensureDefaultChannel()` dijalankan saat aplikasi dibuka: jika tabel `channels` kosong, buat "Langsung" (komisi 0). Saluran ini tidak bisa dihapus dan dihitung dalam batas gratis (1 saluran).
- Menambah saluran kedua memanggil `assertCanCreate('channel')`.
- Validasi: nama 1 s.d. 30 karakter, unik; `rateBp` 0 s.d. 9000.
- Di `SliderPanel` (RFC-008) muncul slider bertitik "Saluran jual" berisi nama saluran, hanya jika ada lebih dari satu saluran.
- `ResultCard` menampilkan harga untuk saluran terpilih; label berubah menjadi "harga jual per potong di <saluran>".
- `ChannelPriceTable` di bawah kartu (desktop) atau di sheet detail (HP): semua saluran, harga, dan margin aktual dengan status teks.
- Mengubah harga Langsung (`currentPrice`) memperbarui harga saluran diskon secara langsung.

## Edge Case
- Komisi + target margin ≥ 100%: saluran itu menampilkan "Komisi terlalu besar untuk target untung ini" di tabel, bukan angka.
- Saluran diskon saat Langsung belum punya harga: memakai harga saran Langsung.

## Aturan Terkait
RU-05, RU-07, RU-18, RU-40, RU-43.

## Testing
- `repository.test.ts`: saluran default dibuat sekali; "Langsung" tidak bisa dihapus; batas gratis; validasi.
- `channels.spec.ts`: tambah Ojol 20% (Pro), brownies menampilkan Rp 7.500 dengan margin 41%; tambah Reseller diskon 15%, harga dan margin tampil; slider saluran dengan keyboard; pengguna gratis melihat paywall saat menambah saluran kedua.

## Acceptance Criteria
- [ ] Semua file di bagian Struktur ada
- [ ] Saluran "Langsung" dibuat otomatis sekali, tidak bisa dihapus, dan dihitung dalam batas gratis
- [ ] Saluran bisa ditambah, diubah, dan dihapus dengan jenis komisi atau diskon; validasi nama dan `rateBp`
- [ ] Saluran kedua untuk pengguna gratis memunculkan paywall
- [ ] Harga tiap saluran dihitung dengan `priceForChannel`, tidak ada rumus di komponen
- [ ] Slider "Saluran jual" tampil hanya jika ada lebih dari satu saluran, dan mengubah harga di `ResultCard`
- [ ] `ChannelPriceTable` menampilkan semua saluran dengan harga, margin aktual, dan status teks
- [ ] Brownies di saluran komisi 20% menampilkan Rp 7.500 dan margin 41%
- [ ] Komisi terlalu besar menampilkan pesan, bukan angka
- [ ] `repository.test.ts` dan `channels.spec.ts` lulus; axe tanpa pelanggaran serius
