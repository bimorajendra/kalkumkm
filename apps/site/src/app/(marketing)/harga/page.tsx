import { PRICING } from '@takaran/schema';
import { formatRupiah } from '@takaran/ui/format';
import type { Metadata } from 'next';
import { Faq } from '@/components/marketing/faq';
import { PaymentStrip } from '@/components/marketing/payment-strip';
import { PlanCard } from '@/components/marketing/plan-card';
import { publicMetadata } from '@/features/seo/metadata';
import { getSessionUser } from '@/server/session';

export const metadata: Metadata = publicMetadata({
  title: 'Harga Takaran Gratis dan Pro',
  description:
    'Bandingkan paket Takaran Gratis dan Pro untuk menghitung HPP resep dan harga jual usaha makanan.',
  path: '/harga',
});

const faqItems = [
  {
    question: 'Benar cuma bayar sekali?',
    answer: 'Iya. Sekali bayar, termasuk fitur baru di pembaruan berikutnya.',
  },
  {
    question: 'Kalau di versi gratis sudah 3 resep?',
    answer:
      'Resep yang sudah ada tetap aman. Untuk menyimpan resep keempat, perlu Pro.',
  },
  {
    question: 'Siapa yang bisa melihat resepku?',
    answer: 'Hanya akunmu. Semua data bisa kamu unduh atau hapus kapan saja.',
  },
];

export default async function HargaPage() {
  const user = await getSessionUser().catch(() => null);
  const start = user ? '/dashboard' : '/masuk';

  return (
    <>
      <section className="mk-up flex flex-col items-center gap-4 px-5 pt-10 pb-10 text-center lg:px-20 lg:pt-18 lg:pb-12">
        <span className="text-sm font-semibold text-[var(--mk-primary-ink)]">
          Harga
        </span>
        <h1 className="max-w-[760px] text-[34px] leading-[1.15] font-bold tracking-[-0.035em] lg:text-[52px] lg:leading-[1.1]">
          Mulai gratis. Kalau cocok, cukup bayar sekali.
        </h1>
        <p className="text-base leading-[1.6] text-[var(--mk-text-2)] lg:text-lg">
          Tanpa biaya bulanan. Tanpa langganan yang lupa diputus.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 px-5 pb-10 sm:grid-cols-2 lg:mx-auto lg:max-w-[880px] lg:px-0">
        <PlanCard
          ctaHref={start}
          ctaLabel="Mulai gratis"
          description="Untuk mencoba menghitung resep pertamamu."
          features={[
            'Simpan 3 resep',
            '1 jalur jual',
            'Pengingat saat untung menipis',
            'Untung per jam kerja',
            'Gambar daftar harga, dengan tanda Takaran',
          ]}
          name="Gratis"
          price="Rp 0"
        />
        <PlanCard
          badge="Harga awal · 100 pembeli pertama"
          ctaHref={user ? '/dashboard/beli' : '/masuk'}
          ctaLabel="Beli Pro"
          description="Sekali bayar. Lebih murah dari satu loyang brownies (Rp 80.000)."
          features={[
            <>
              <strong className="font-semibold">Semua fitur Gratis</strong>,
              ditambah:
            </>,
            'Resep tanpa batas',
            'Semua jalur jual: langsung, reseller, ojol',
            'Sub-resep dan penawaran pesanan custom',
            'Gambar daftar harga tanpa tanda, fitur baru ikut',
          ]}
          highlighted
          name="Pro"
          originalPrice={formatRupiah(PRICING.pro.idr)}
          price={formatRupiah(PRICING.pro.founderIdr)}
        />
      </section>

      <section className="px-5 pb-14 lg:px-20 lg:pb-20">
        <PaymentStrip />
      </section>

      <section className="flex-1 px-5 pb-20 lg:px-20 lg:pb-24">
        <div className="mx-auto grid max-w-[820px] gap-8">
          <h2 className="text-[26px] leading-[1.2] font-bold tracking-[-0.03em]">
            Pertanyaan yang sering muncul
          </h2>
          <Faq items={faqItems} />
        </div>
      </section>
    </>
  );
}
