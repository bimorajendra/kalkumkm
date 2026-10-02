import Link from 'next/link';
import type { PublicCalculatorMode } from './content';
import { calculatorGuides } from './guides';

export function CalculatorGuide({ mode }: { mode: PublicCalculatorMode }) {
  const guide = calculatorGuides[mode];
  return (
    <article className="mx-auto grid w-full max-w-3xl gap-8 px-5 pb-12 lg:pb-16">
      <header className="grid gap-3">
        <h2 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
          {guide.title}
        </h2>
      </header>
      {guide.sections.map((section) => (
        <section key={section.heading} className="grid gap-3">
          <h3 className="text-xl font-semibold">{section.heading}</h3>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="leading-7 text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      <section className="grid gap-3">
        <h2 className="font-display text-xl font-semibold">
          Pertanyaan tentang {mode === 'hpp' ? 'HPP' : 'hitungan ini'}
        </h2>
        {guide.questions.map(({ question, answer }) => (
          <details key={question} className="border-b border-input/60 py-3">
            <summary className="min-h-11 cursor-pointer py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {question}
            </summary>
            <p className="pb-2 leading-7 text-muted-foreground">{answer}</p>
          </details>
        ))}
      </section>
      <nav
        aria-label="Kalkulator lanjutan"
        className="grid gap-1 border-t border-input/50 pt-4"
      >
        <h2 className="text-lg font-semibold">Lanjutkan hitungan</h2>
        <Link
          className="inline-flex min-h-11 items-center text-link underline underline-offset-4"
          href="/kalkulator-hpp"
        >
          Hitung modal per porsi
        </Link>
        <Link
          className="inline-flex min-h-11 items-center text-link underline underline-offset-4"
          href="/harga-jual"
        >
          Tentukan harga jual
        </Link>
        <Link
          className="inline-flex min-h-11 items-center text-link underline underline-offset-4"
          href="/margin"
        >
          Periksa margin keuntungan
        </Link>
        <Link
          className="inline-flex min-h-11 items-center text-link underline underline-offset-4"
          href="/bep"
        >
          Hitung jumlah untuk impas
        </Link>
      </nav>
    </article>
  );
}
