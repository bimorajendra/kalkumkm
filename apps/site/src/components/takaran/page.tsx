import { cn } from '@/lib/utils';

/** Kerangka isi halaman aplikasi: gutter 16 px di HP, ruang untuk tab bar di bawah. */
export function Page({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        'mx-auto w-full max-w-[1120px] px-4 pb-28 pt-4 lg:px-8 lg:pb-12',
        className,
      )}
    >
      {children}
    </main>
  );
}

export function PageTitle({
  children,
  id = 'page-title',
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <h1
      id={id}
      className="font-display text-[34px] font-normal leading-[38px] lg:text-[44px] lg:leading-[48px]"
    >
      {children}
    </h1>
  );
}

/** Keadaan kosong: satu kalimat penjelasan dan satu tombol yang jelas. */
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="grid justify-items-start gap-3 rounded-xl border border-dashed border-input p-6">
      <h2 className="font-display text-3xl font-semibold">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </section>
  );
}
