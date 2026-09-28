import type { Metadata } from 'next';
import { CostBreakdown } from '@/components/marketing/cost-breakdown';
import { CtaPanel } from '@/components/marketing/cta-panel';
import { FormulaList, InfoNote } from '@/components/marketing/formula-list';
import { StepCard } from '@/components/marketing/step-card';
import { getSessionUser } from '@/server/session';

export const metadata: Metadata = {
  title: 'Cara hitung',
  description:
    'Dari struk belanja ke harga jual, dalam 3 langkah. Contohnya brownies, 16 potong per loyang.',
};

function StaticField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-semibold text-[var(--mk-text-2)]">
        {label}
      </span>
      <div className="flex h-11 items-center rounded-[var(--mk-radius-sm)] border border-[var(--mk-border-strong)] bg-[var(--mk-surface)] px-3 text-[15px]">
        {value}
      </div>
    </div>
  );
}

export default async function CaraHitungPage() {
  const user = await getSessionUser().catch(() => null);
  const start = user ? '/dashboard' : '/masuk';

  return (
    <>
      <section className="mk-up flex flex-col gap-4.5 px-5 pt-10 pb-12 lg:px-20 lg:pt-18 lg:pb-14">
        <span className="text-sm font-semibold text-[var(--mk-primary-ink)]">
          Cara hitung
        </span>
        <h1 className="max-w-[820px] text-[34px] leading-[1.15] font-bold tracking-[-0.035em] lg:text-[52px] lg:leading-[1.1]">
          Dari struk belanja ke harga jual, dalam 3 langkah.
        </h1>
        <p className="max-w-[600px] text-base leading-[1.6] text-[var(--mk-text-2)] lg:text-lg">
          Contohnya brownies, 16 potong per loyang. Tidak perlu rumus atau
          Excel.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 px-5 pb-14 sm:grid-cols-2 lg:grid-cols-3 lg:px-20 lg:pb-24">
        <StepCard
          step={1}
          text="Tulis apa adanya. Takaran yang mengubahnya ke harga per gram."
          title="Catat harga dari struk"
        >
          <div className="grid gap-3">
            <StaticField label="Nama bahan" value="Tepung terigu" />
            <div className="grid grid-cols-[1.4fr_0.7fr_0.8fr] gap-2">
              <StaticField label="Harga" value="Rp 14.000" />
              <StaticField label="Isi" value="1" />
              <StaticField label="Satuan" value="kg" />
            </div>
            <div className="flex items-center justify-between border-t border-[var(--mk-divider)] pt-3">
              <span className="text-[13px] text-[var(--mk-text-3)]">
                Otomatis jadi
              </span>
              <span className="text-base font-bold text-[var(--mk-success-ink)]">
                Rp 14 / gram
              </span>
            </div>
          </div>
        </StepCard>

        <StepCard
          step={2}
          text="Takaran per loyang, lalu satu loyang jadi berapa potong."
          title="Susun resepnya"
        >
          <div className="grid gap-2.5 text-sm">
            <div className="grid grid-cols-[1fr_56px_76px] gap-2">
              <span>Tepung terigu</span>
              <span className="text-[var(--mk-text-3)]">150 g</span>
              <span className="text-right">Rp 2.100</span>
            </div>
            <div className="grid grid-cols-[1fr_56px_76px] gap-2">
              <span>Cokelat masak</span>
              <span className="text-[var(--mk-text-3)]">200 g</span>
              <span className="text-right">Rp 10.000</span>
            </div>
            <div className="grid grid-cols-[1fr_56px_76px] gap-2">
              <span>Telur</span>
              <span className="text-[var(--mk-text-3)]">4 butir</span>
              <span className="text-right">Rp 8.000</span>
            </div>
            <div className="text-[var(--mk-text-3)]">
              + gula pasir, margarin
            </div>
            <div className="flex items-center justify-between border-t border-[var(--mk-divider)] pt-3">
              <span className="text-sm font-semibold">1 loyang jadi</span>
              <span className="text-[17px] font-bold">16 potong</span>
            </div>
          </div>
        </StepCard>

        <StepCard
          step={3}
          text="Geser slider, harga jual ikut menyesuaikan."
          title="Tentukan target untung"
        >
          <div className="grid gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Target untung</span>
              <span className="text-[15px] font-bold text-[var(--mk-primary-ink)]">
                40%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--mk-divider)]">
              <div className="h-1.5 w-1/2 rounded-full bg-[var(--mk-primary)]" />
            </div>
            <div className="flex items-baseline justify-between border-t border-[var(--mk-divider)] pt-3">
              <span className="text-sm font-semibold">Harga jual</span>
              <span className="text-[28px] font-bold tracking-[-0.03em]">
                Rp 5.000
              </span>
            </div>
            <span className="text-right text-xs text-[var(--mk-text-3)]">
              Rp 4.875, dibulatkan ke atas
            </span>
          </div>
        </StepCard>
      </section>

      <section className="border-y border-[var(--mk-border)] bg-[var(--mk-surface)] px-5 py-14 lg:px-20 lg:py-22">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-6">
          <div className="grid gap-3">
            <span className="text-sm font-semibold text-[var(--mk-primary-ink)]">
              Hasilnya
            </span>
            <span className="text-[17px] font-semibold">
              Modal per potong brownies
            </span>
            <span className="text-[64px] leading-none font-bold tracking-[-0.05em] lg:text-[96px]">
              Rp 2.925
            </span>
            <p className="max-w-[400px] text-base leading-[1.6] text-[var(--mk-text-2)]">
              Bahan, gas, dan kemasan sudah masuk. Rinciannya selalu bisa
              dibuka.
            </p>
          </div>
          <CostBreakdown />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 px-5 py-14 lg:grid-cols-2 lg:gap-6 lg:px-20 lg:py-22">
        <div className="grid content-start gap-3.5">
          <span className="text-sm font-semibold text-[var(--mk-primary-ink)]">
            Transparan
          </span>
          <h2 className="text-[28px] leading-[1.2] font-bold tracking-[-0.03em] lg:text-[36px]">
            Rumus yang kami pakai.
          </h2>
          <p className="text-base leading-[1.6] text-[var(--mk-text-2)]">
            Tidak ada angka ajaib. Semua bisa kamu hitung ulang sendiri.
          </p>
        </div>
        <div className="grid gap-3">
          <FormulaList />
          <InfoNote>
            Kenapa bukan modal + 40%? Modal Rp 3.000 + 40% = Rp 4.200, tapi
            untungnya hanya 28,6% dari harga jual.
          </InfoNote>
        </div>
      </section>

      <section className="px-5 pb-14 lg:px-20 lg:pb-24">
        <CtaPanel
          ctaHref={start}
          ctaLabel="Coba gratis"
          title="Sekarang coba dengan resepmu sendiri."
        />
      </section>
    </>
  );
}
