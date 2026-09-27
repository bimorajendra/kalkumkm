const DEFAULT_PNG_WIDTH = 1080;
const DEFAULT_PNG_HEIGHT = 1350;
const FONT_WAIT_MS = 3000;

export async function renderPng(
  svg: SVGSVGElement,
  dimensions: { width?: number; height?: number } = {},
): Promise<Blob> {
  await waitForFonts();
  const computed = getComputedStyle(svg);
  const serialized = new XMLSerializer()
    .serializeToString(svg)
    .replace(
      /var\((--[\w-]+)\)/g,
      (token, name: string) => computed.getPropertyValue(name).trim() || token,
    );
  const source = new Blob([serialized], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const sourceUrl = URL.createObjectURL(source);
  try {
    const image = await loadImage(sourceUrl);
    const canvas = document.createElement('canvas');
    const width = dimensions.width ?? DEFAULT_PNG_WIDTH;
    const height = dimensions.height ?? DEFAULT_PNG_HEIGHT;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Gambar belum bisa dibuat.');
    context.fillStyle = '#fbf6f1';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Gambar belum bisa disimpan.'));
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

async function waitForFonts(): Promise<void> {
  if (!('fonts' in document)) return;
  await Promise.race([
    document.fonts.ready,
    new Promise<void>((resolve) => window.setTimeout(resolve, FONT_WAIT_MS)),
  ]);
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Pratinjau gambar gagal dibaca.'));
    image.src = source;
  });
}
