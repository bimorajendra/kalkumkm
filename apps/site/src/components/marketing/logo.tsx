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
