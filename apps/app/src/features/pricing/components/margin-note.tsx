import type { RecipeResult } from '@takaran/calc';
import { formatPercent, formatRupiah, NoteBox } from '@takaran/ui';

interface MarginNoteProps {
  profit: RecipeResult['hpp'];
  price: number;
  marginBp: number;
  markupBp: number;
}

export function MarginNote({
  marginBp,
  markupBp,
  price,
  profit,
}: MarginNoteProps) {
  return (
    <NoteBox className="margin-note">
      Markup {formatPercent(markupBp)} artinya harga jual{' '}
      {formatPercent(markupBp)} di atas modal. Margin {formatPercent(marginBp)}{' '}
      artinya dari setiap {formatRupiah(price)} yang kamu terima,{' '}
      {formatRupiah(profit)} adalah untung.
    </NoteBox>
  );
}
