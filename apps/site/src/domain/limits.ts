import { FREE_LIMITS } from '@takaran/schema';
import { DomainError, type Snapshot } from './types';

/** Batas paket gratis. Dicek di server, bukan hanya di layar. */
export function assertCanCreate(
  snapshot: Snapshot,
  item: 'recipe' | 'channel',
): void {
  if (snapshot.plan === 'pro') return;
  const count =
    item === 'recipe' ? snapshot.recipes.length : snapshot.channels.length;
  const limit = item === 'recipe' ? FREE_LIMITS.recipes : FREE_LIMITS.channels;
  if (count >= limit)
    throw new DomainError(
      'FREE_LIMIT',
      item === 'recipe'
        ? 'Batas 3 resep di paket gratis sudah tercapai.'
        : 'Batas 1 saluran di paket gratis sudah tercapai.',
      item,
    );
}

export function assertPro(
  snapshot: Snapshot,
  trigger: 'quote' | 'sub_recipe',
): void {
  if (snapshot.plan !== 'pro')
    throw new DomainError(
      'PRO_REQUIRED',
      trigger === 'quote'
        ? 'Penawaran pesanan custom ada di Takaran Pro.'
        : 'Fitur subresep ada di Takaran Pro.',
      trigger,
    );
}
