/** Kelas Tailwind untuk tombol situs marketing (docs/design/DESIGN-HANDOFF.md §3).
 * Fungsi biasa, bukan komponen: dipakai langsung di <Link>/<button> supaya
 * elemennya tetap <a> untuk navigasi dan <button> untuk aksi, sesuai semantik
 * masing-masing, tanpa polymorphic wrapper yang tidak perlu. */

export type MkButtonVariant =
  | 'primary'
  | 'secondary'
  | 'onDark'
  | 'onDarkPrimary';
export type MkButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const base =
  'inline-flex items-center justify-center gap-2 rounded-[var(--mk-radius-md)] font-semibold whitespace-nowrap transition-colors';

/* 'primary' pakai --mk-ink (bukan --mk-primary oranye) untuk latar tombol:
   oranye-di-tengah dites dengan axe-core dan kontras teks putihnya tidak
   stabil lolos 4,5:1 (mendekati batas, kadang lolos kadang tidak tergantung
   render). --mk-ink dengan teks putih terbukti aman (dipakai juga di
   aplikasi utama). Di panel gelap (CtaPanel), tombol utama dibalik jadi
   putih-dengan-teks-ink ('onDarkPrimary') supaya tetap kelihatan menonjol
   dari panelnya sendiri yang juga gelap. */
const variants: Record<MkButtonVariant, string> = {
  primary: 'bg-[var(--mk-ink)] text-white hover:bg-[var(--mk-ink)]/90',
  secondary:
    'bg-white text-[var(--mk-ink)] border border-[var(--mk-border-strong)] hover:border-[var(--mk-ink)]',
  onDark:
    'bg-transparent text-white border border-[var(--mk-text-2)] hover:border-white',
  onDarkPrimary: 'bg-white text-[var(--mk-ink)] hover:bg-white/90',
};

const sizes: Record<MkButtonSize, string> = {
  sm: 'h-[42px] px-[18px] text-[15px]',
  md: 'h-[50px] px-6 text-[15px]',
  lg: 'h-[52px] px-6 text-base',
  xl: 'h-[54px] px-[26px] text-base',
};

export function mkButtonClasses(
  variant: MkButtonVariant = 'primary',
  size: MkButtonSize = 'lg',
): string {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}
