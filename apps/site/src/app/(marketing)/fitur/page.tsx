import type { Metadata } from 'next';
import { BeforeAfter } from '@/components/marketing/before-after';
import { CtaPanel } from '@/components/marketing/cta-panel';
import { CustomOrderBuilder } from '@/components/marketing/custom-order-builder';
import { MarginAlertTable } from '@/components/marketing/margin-alert-table';
import { publicMetadata } from '@/features/seo/metadata';
import { getSessionUser } from '@/server/session';

export const metadata: Metadata = publicMetadata({
  title: 'Fitur kalkulator HPP Takaran',
  description:
    'Lihat cara Takaran membantu menghitung dampak harga bahan dan menyiapkan harga untuk pesanan custom.',
  path: '/fitur',
});

const orderIdeas = [
  {
    title: 'Hampers Lebaran',
    text: 'Hitung satu paket, lalu kali 50.',
  },
  {
    title: 'Nasi kotak arisan',
    text: 'Per kotak, dengan lauk tambahan.',
  },
  {
    title: 'Kue tema',
    text: 'Ukuran, warna, dan hiasan beda-beda.',
  },
];

export default async function FiturPage() {
  const user = await getSessionUser().catch(() => null);
  const start = user ? '/dashboard' : '/masuk';

  return (
    <>
      <section className="mk-up flex flex-col gap-4.5 px-5 pt-10 pb-10 lg:px-20 lg:pt-18 lg:pb-14">
        <span className="text-sm font-semibold text-[var(--mk-primary-ink)]">
          Fitur
        </span>
        <h1 className="max-w-[880px] text-[34px] leading-[1.15] font-bold tracking-[-0.035em] lg:text-[52px] lg:leading-[1.1]">
          Dua momen yang paling sering bikin rugi, sekarang ada hitungannya.
        </h1>
        <p className="max-w-[600px] text-base leading-[1.6] text-[var(--mk-text-2)] lg:text-lg">
          Saat harga bahan naik, dan saat pelanggan minta pesanan yang beda dari
          biasanya.
        </p>
        <nav
          aria-label="Bagian halaman"
          className="mt-1.5 flex flex-wrap gap-2.5"
        >
          <a
            className="flex h-11 items-center gap-2 rounded-full border border-[var(--mk-border)] bg-[var(--mk-surface)] px-4 text-sm font-semibold"
            href="#naik"
          >
            <span className="text-xs text-[var(--mk-text-3)]">01</span>
            Harga bahan naik
          </a>
          <a
            className="flex h-11 items-center gap-2 rounded-full border border-[var(--mk-border)] bg-[var(--mk-surface)] px-4 text-sm font-semibold"
            href="#custom"
          >
            <span className="text-xs text-[var(--mk-text-3)]">02</span>
            Pesanan custom
          </a>
        </nav>
      </section>

      <section
        className="flex flex-col gap-9 px-5 pb-14 lg:px-20 lg:pb-18"
        id="naik"
      >
        <div className="grid grid-cols-1 items-end gap-6 border-t border-[var(--mk-border-strong)] pt-10 lg:grid-cols-12">
          <div className="grid gap-3 lg:col-span-7">
            <span className="text-[13px] font-semibold text-[var(--mk-text-3)]">
              01 · Harga bahan naik
            </span>
            <h2 className="text-[28px] leading-[1.2] font-bold tracking-[-0.03em] lg:text-[38px]">
              Telur naik Rp 600. Untung brownies ikut turun, diam-diam.
            </h2>
          </div>
          <p className="text-base leading-[1.6] text-[var(--mk-text-2)] lg:col-span-4 lg:col-start-9">
            Ubah satu harga bahan, semua menu dihitung ulang. Yang untungnya
            menipis langsung ditandai.
          </p>
        </div>
        <BeforeAfter />
      </section>

      <section className="border-y border-[var(--mk-border)] bg-[var(--mk-surface)] px-5 py-14 lg:px-20 lg:py-20">
        <div className="grid grid-cols-1 gap-9 lg:grid-cols-12 lg:gap-6">
          <div className="grid content-start gap-4 lg:col-span-4">
            <span className="text-sm font-semibold text-[var(--mk-primary-ink)]">
              Di dalam Takaran
            </span>
            <h3 className="text-[26px] leading-[1.2] font-bold tracking-[-0.03em]">
              Tiga menu ditandai, satu masih aman.
            </h3>
            <ol className="mt-2 grid list-none gap-0 p-0">
              {[
                'Ubah harga telur di daftar bahan.',
                'Lihat menu yang untungnya turun.',
                'Pakai harga saran, atau tahan dulu.',
              ].map((text, index) => (
                <li
                  className="flex items-center gap-3.5 border-t border-[var(--mk-divider)] py-3.5 text-base last:border-b"
                  key={text}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--mk-primary-tint)] text-[13px] font-bold text-[var(--mk-primary-ink)]">
                    {index + 1}
                  </span>
                  {text}
                </li>
              ))}
            </ol>
            <span className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--mk-success-ink)]">
              <CheckDot /> Tersedia di versi gratis
            </span>
          </div>
          <div className="lg:col-span-8 lg:col-start-6">
            <MarginAlertTable />
          </div>
        </div>
      </section>

      <section
        className="flex flex-col gap-9 px-5 py-14 lg:px-20 lg:py-20"
        id="custom"
      >
        <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
          <div className="grid gap-3 lg:col-span-7">
            <span className="flex items-center gap-2.5 text-[13px] font-semibold text-[var(--mk-text-3)]">
              02 · Pesanan custom
              <span className="rounded-full bg-[var(--mk-ink)] px-2 py-0.5 text-[11px] font-bold text-white">
                PRO
              </span>
            </span>
            <h2 className="text-[28px] leading-[1.2] font-bold tracking-[-0.03em] lg:text-[38px]">
              Pelanggan minta tulisan dan topper. Harganya jadi berapa?
            </h2>
          </div>
          <p className="text-base leading-[1.6] text-[var(--mk-text-2)] lg:col-span-4 lg:col-start-9">
            Pilih kue dasar, centang tambahannya. Harga total dan untungnya
            langsung terlihat.
          </p>
        </div>

        <CustomOrderBuilder />

        <div className="grid grid-cols-1 gap-6 border-t border-[var(--mk-border-strong)] sm:grid-cols-3">
          {orderIdeas.map((idea, index) => (
            <div
              className={`grid gap-1.5 py-5 ${index > 0 ? 'sm:border-l sm:border-[var(--mk-border)] sm:pl-6' : ''}`}
              key={idea.title}
            >
              <span className="text-base font-bold">{idea.title}</span>
              <span className="text-[15px] leading-[1.5] text-[var(--mk-text-2)]">
                {idea.text}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 pb-14 lg:px-20 lg:pb-24">
        <CtaPanel
          ctaHref={start}
          ctaLabel="Coba gratis"
          secondaryHref="/harga"
          secondaryLabel="Lihat harga"
          text="Pengingat untung menipis sudah gratis. Penawaran custom ada di Pro yang segera hadir."
          title="Mulai dari yang gratis dulu."
        />
      </section>
    </>
  );
}

function CheckDot() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 20 20"
      width="18"
    >
      <circle cx="10" cy="10" fill="var(--mk-success-tint)" r="9" />
      <path
        d="m6 10.2 2.6 2.6L14 7.5"
        stroke="var(--mk-success)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
