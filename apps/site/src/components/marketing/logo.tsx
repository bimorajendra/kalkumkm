import Image from 'next/image';

const ASPECT_RATIO = 640 / 198;

/** Logo asli Takaran (ikon timbangan + wordmark), dipakai di header dan footer. */
export function MkLogo({ height = 28 }: { height?: number }) {
  return (
    <Image
      alt="Takaran"
      height={height}
      priority
      src="/logo.png"
      width={Math.round(height * ASPECT_RATIO)}
    />
  );
}

export function MkMark({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="relative block shrink-0 overflow-hidden"
      style={{ width: size, height: size }}
    >
      <Image
        alt=""
        fill
        sizes={`${size}px`}
        src="/logo.png"
        style={{ objectFit: 'cover', objectPosition: 'left center' }}
      />
    </span>
  );
}
