import { formatRupiah } from '@takaran/ui/format';
import { Cookie } from 'lucide-react';
import { forwardRef } from 'react';

export type PriceListFormat = 'story' | 'square';

export interface PriceListMenu {
  id: string;
  name: string;
  price: number;
}

interface PriceListImageProps {
  businessName: string;
  menus: PriceListMenu[];
  format: PriceListFormat;
  isPro: boolean;
  domain: string;
}

const formats = {
  story: { width: 1080, height: 1920, listTop: 480, bottom: 270, rowMax: 92 },
  square: { width: 1080, height: 1080, listTop: 300, bottom: 155, rowMax: 56 },
} as const;

export function priceListLayoutFits(
  count: number,
  format: PriceListFormat,
): boolean {
  if (count < 1) return true;
  const layout = formats[format];
  return (
    Math.floor((layout.height - layout.listTop - layout.bottom) / count) >= 44
  );
}

function ellipsize(value: string, maxLength: number): string {
  return value.length > maxLength
    ? `${value.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`
    : value;
}

export const PriceListImage = forwardRef<SVGSVGElement, PriceListImageProps>(
  function PriceListImage({ businessName, menus, format, isPro, domain }, ref) {
    const { width, height, listTop, bottom, rowMax } = formats[format];
    const available = height - listTop - bottom;
    const rowHeight = menus.length
      ? Math.min(rowMax, Math.floor(available / menus.length))
      : rowMax;
    const fontSize = Math.max(28, Math.min(48, Math.floor(rowHeight * 0.68)));
    const maxNameLength = Math.floor(760 / (fontSize * 0.57));
    const fontFamily = 'Plus Jakarta Sans, Arial, sans-serif';

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label={`Daftar harga ${businessName}, ${menus.length} menu`}
        style={{ fontFamily }}
      >
        <rect width={width} height={height} fill="var(--bg)" />
        <path d={`M0 0h${width}v26H0z`} fill="var(--caramel-500)" />
        <text
          x="88"
          y={format === 'story' ? 210 : 150}
          fill="var(--ink)"
          fontFamily="Plus Jakarta Sans, Arial, sans-serif"
          fontSize={format === 'story' ? 76 : 64}
          fontWeight="700"
        >
          {ellipsize(businessName, 30)}
        </text>
        <text x="88" y={listTop - 68} fill="var(--ink-muted)" fontSize="28">
          Daftar harga
        </text>
        {menus.map((menu, index) => {
          const y = listTop + index * rowHeight;
          return (
            <g key={menu.id}>
              <path
                d={`M88 ${y + Math.floor(rowHeight * 0.34)}h904`}
                stroke="var(--tan-200)"
                strokeWidth="2"
              />
              <text
                x="88"
                y={y + Math.floor(rowHeight * 0.78)}
                fill="var(--ink)"
                fontSize={fontSize}
              >
                {ellipsize(menu.name, maxNameLength)}
              </text>
              <text
                x="992"
                y={y + Math.floor(rowHeight * 0.78)}
                fill="var(--ink)"
                fontSize={fontSize}
                fontWeight="600"
                textAnchor="end"
              >
                {formatRupiah(menu.price)}
              </text>
            </g>
          );
        })}
        <g transform={`translate(900 ${height - bottom + 10})`}>
          <Cookie color="var(--caramel-500)" size={64} strokeWidth={1.5} />
        </g>
        {!isPro ? (
          <text x="88" y={height - 70} fill="var(--ink-muted)" fontSize="26">
            dihitung dengan Takaran · {domain}
          </text>
        ) : null}
      </svg>
    );
  },
);
