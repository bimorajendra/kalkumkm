export function Faq({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  return (
    <div className="flex flex-col border-t border-[var(--mk-border-strong)]">
      {items.map((item, index) => (
        <details
          className="group border-b border-[var(--mk-border-strong)]"
          key={item.question}
          open={index === 0}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
            {item.question}
            <span
              aria-hidden="true"
              className="text-xl font-normal text-[var(--mk-primary-ink)] transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mb-5 text-[15px] leading-[1.6] text-[var(--mk-text-2)]">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
