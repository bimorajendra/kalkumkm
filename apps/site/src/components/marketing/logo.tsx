import Image from 'next/image';

/** Logo asli Takaran (ikon timbangan + wordmark), dipakai di header dan footer. */
export function MkLogo({ height = 28 }: { height?: number }) {
  return (
    <Image
      alt="Takaran"
      height={198}
      priority
      src="/logo.png"
      style={{ height, width: 'auto' }}
      width={640}
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
