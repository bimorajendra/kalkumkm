export const ingredientCopy = {
  title: 'Bahan',
  emptyTitle: 'Rak bahanmu masih kosong.',
  emptyDescription: 'Tambah bahan dari struk belanja terakhirmu.',
  add: 'Tambah bahan',
  searchLabel: 'Cari bahan',
  searchPlaceholder: 'Cari nama bahan',
  save: 'Simpan bahan',
  cancel: 'Batal',
  savePrice: 'Simpan harga',
  delete: 'Hapus bahan',
  duplicate: 'Nama bahan ini sudah ada.',
  saveError: 'Bahan belum tersimpan. Coba lagi.',
  loadError: 'Bahan belum terbaca. Muat ulang aplikasi lalu coba lagi.',
  deleteInUse: (count: number) =>
    `Bahan ini dipakai di ${count} resep. Hapus dari resepnya dulu.`,
  dimensionChange:
    'Satuan dasar tidak bisa diubah karena bahan ini dipakai di resep.',
  usedBy: (count: number) => `Dipakai di ${count} resep`,
  priceLabel: 'Harga beli (rupiah)',
  packLabel: 'Isi kemasan',
  unitLabel: 'Satuan beli',
  customUnit: 'Satuan lain',
} as const;
