const items = [
  {
    title: 'Rincian terbuka',
    text: 'Modal bisa dirinci sampai per gram bahan.',
  },
  {
    title: 'Data milikmu',
    text: 'Hanya akunmu yang bisa membuka resep. Bisa diunduh atau dihapus.',
  },
  {
    title: 'Mulai gratis',
    text: 'Simpan 3 resep dan hitung untung per jam kerja.',
  },
  {
    title: 'Pro segera hadir',
    text: 'Paket untuk menambah resep dan saluran jual sedang disiapkan.',
  },
];

export function TrustGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
      {items.map((item) => (
        <div
          className="grid gap-2 border-t border-[var(--mk-border-strong)] pt-4.5"
          key={item.title}
        >
          <span className="text-base font-bold">{item.title}</span>
          <span className="text-[15px] leading-[1.55] text-[var(--mk-text-2)]">
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
}
