/* --mk-primary-ink (bukan --mk-primary): --mk-primary sendiri kontrasnya
   di bawah 4,5:1 untuk teks berukuran ini di atas latar terang (dites
   dengan axe-core). --mk-primary-ink tetap oranye tapi cukup gelap. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-sm font-semibold text-[var(--mk-primary-ink)]">
      {children}
    </span>
  );
}
