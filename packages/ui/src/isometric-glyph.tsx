export function IsometricGlyph({ size = 16 }: { size?: number } = {}) {
  return (
    <svg
      aria-hidden="true"
      className="takaran-isometric-glyph"
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      focusable="false"
    >
      <path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z" fill="var(--tan-200)" />
      <path d="m12 2 9 5-9 5-9-5 9-5Z" fill="var(--tan-100)" />
      <path d="m3 7 9 5v10l-9-5V7Z" fill="var(--tan-300)" />
      <path d="m12 12 9-5v10l-9 5V12Z" fill="var(--tan-400)" />
      <path d="m12 7 4 2.25-4 2.25-4-2.25L12 7Z" fill="var(--caramel-500)" />
    </svg>
  );
}
