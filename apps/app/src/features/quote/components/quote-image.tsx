import { formatRupiah } from '@takaran/ui';
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
        <rect width="1080" height="1350" fill="#fbf6f1" />
        <path d="M0 0h1080v34H0z" fill="#9e4308" />
        <text x="88" y="164" fill="#2b1d14" fontSize="28">
          {businessName}
        </text>
        <text
          x="88"
          y="332"
          fill="#2b1d14"
          fontFamily="Instrument Serif, Georgia, serif"
          fontSize="72"
        >
          Penawaran pesanan
        </text>
        <text x="88" y="430" fill="#6e5a4b" fontSize="34">
          {recipeName} · {portions} porsi
        </text>
        <path d="M88 492h904" stroke="#e7d9cb" strokeWidth="3" />
        <text x="88" y="570" fill="#9e4308" fontSize="26" fontWeight="700">
          Rincian tambahan
        </text>
        {options.length ? (
          options.slice(0, 7).map((option, index) => (
            <g key={`${option.name}-${index}`}>
              <text x="88" y={646 + index * 45} fill="#2b1d14" fontSize="24">
                {option.name}
              </text>
              <text
                x="992"
                y={646 + index * 45}
                fill="#6e5a4b"
                fontSize="22"
                textAnchor="end"
              >
                + {formatRupiah(option.priceAdd)}
              </text>
            </g>
          ))
        ) : (
          <text x="88" y="646" fill="#6e5a4b" fontSize="24">
            Tanpa tambahan
          </text>
        )}
        {options.length > 7 ? (
          <text x="88" y="961" fill="#6e5a4b" fontSize="22">
            + {options.length - 7} opsi lainnya, sudah masuk total
          </text>
        ) : null}
        <path d="M88 1004h904" stroke="#e7d9cb" strokeWidth="3" />
        <text x="88" y="1090" fill="#6e5a4b" fontSize="30">
          Total pesanan
        </text>
        <text
          x="88"
          y="1190"
          fill="#9e4308"
          fontFamily="Instrument Serif, Georgia, serif"
          fontSize="78"
        >
          {formatRupiah(totalPrice)}
        </text>
        <text x="88" y="1280" fill="#6e5a4b" fontSize="24">
          {date}
        </text>
      </svg>
    );
  },
);
