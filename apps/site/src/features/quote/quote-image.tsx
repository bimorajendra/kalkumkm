import { formatRupiah } from '@takaran/ui/format';
import { forwardRef } from 'react';

interface QuoteImageProps {
  businessName: string;
  recipeName: string;
  portions: number;
  options: Array<{ name: string; priceAdd: number }>;
  totalPrice: number;
  date: string;
}

export const QuoteImage = forwardRef<SVGSVGElement, QuoteImageProps>(
  function QuoteImage(
    { businessName, recipeName, portions, options, totalPrice, date },
    ref,
  ) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1080 1350"
        width="1080"
        height="1350"
        role="img"
        aria-label={`Penawaran ${businessName}, ${recipeName}, ${formatRupiah(totalPrice)}`}
        style={{ fontFamily: 'Plus Jakarta Sans, Arial, sans-serif' }}
      >
        <rect width="1080" height="1350" fill="var(--bg)" />
        <path d="M0 0h1080v34H0z" fill="var(--caramel-700)" />
        <text x="88" y="164" fill="var(--ink)" fontSize="28">
          {businessName}
        </text>
        <text
          x="88"
          y="332"
          fill="var(--ink)"
          fontFamily="Plus Jakarta Sans, Arial, sans-serif"
          fontSize="72"
          fontWeight="700"
        >
          Penawaran pesanan
        </text>
        <text x="88" y="430" fill="var(--ink-muted)" fontSize="34">
          {recipeName} · {portions} porsi
        </text>
        <path d="M88 492h904" stroke="var(--line)" strokeWidth="3" />
        <text
          x="88"
          y="570"
          fill="var(--caramel-700)"
          fontSize="26"
          fontWeight="700"
        >
          Rincian tambahan
        </text>
        {options.length ? (
          options.slice(0, 7).map((option, index) => (
            <g key={`${option.name}-${index}`}>
              <text x="88" y={646 + index * 45} fill="var(--ink)" fontSize="24">
                {option.name}
              </text>
              <text
                x="992"
                y={646 + index * 45}
                fill="var(--ink-muted)"
                fontSize="22"
                textAnchor="end"
              >
                + {formatRupiah(option.priceAdd)}
              </text>
            </g>
          ))
        ) : (
          <text x="88" y="646" fill="var(--ink-muted)" fontSize="24">
            Tanpa tambahan
          </text>
        )}
        {options.length > 7 ? (
          <text x="88" y="961" fill="var(--ink-muted)" fontSize="22">
            + {options.length - 7} opsi lainnya, sudah masuk total
          </text>
        ) : null}
        <path d="M88 1004h904" stroke="var(--line)" strokeWidth="3" />
        <text x="88" y="1090" fill="var(--ink-muted)" fontSize="30">
          Total pesanan
        </text>
        <text
          x="88"
          y="1190"
          fill="var(--caramel-700)"
          fontFamily="Plus Jakarta Sans, Arial, sans-serif"
          fontSize="78"
          fontWeight="700"
        >
          {formatRupiah(totalPrice)}
        </text>
        <text x="88" y="1280" fill="var(--ink-muted)" fontSize="24">
          {date}
        </text>
      </svg>
    );
  },
);
