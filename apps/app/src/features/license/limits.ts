import { FREE_LIMITS } from '@takaran/schema';
import { db } from '../../db/db';
import { getLicenseCode } from './record';
import { verifyLicenseCode } from './verify';

export class FreeLimitError extends Error {
  constructor(readonly item: 'recipe' | 'channel') {
    super(
      item === 'recipe'
        ? 'Batas 3 resep di paket gratis sudah tercapai.'
        : 'Batas 1 saluran di paket gratis sudah tercapai.',
    );
    this.name = 'FreeLimitError';
  }
}

export async function hasProLicense(): Promise<boolean> {
  const setting = await db.settings.get('license');
  const code = getLicenseCode(setting?.value);
  if (!code) return false;
  try {
    await verifyLicenseCode(code);
    return true;
  } catch {
    return false;
  }
}

export class ProRequiredError extends Error {
  constructor() {
    super('Fitur subresep ada di Takaran Pro.');
    this.name = 'ProRequiredError';
  }
}

export async function assertCanCreate(
  item: 'recipe' | 'channel',
  isPro: boolean,
): Promise<void> {
  if (isPro) return;
  const count =
    item === 'recipe' ? await db.recipes.count() : await db.channels.count();
  const limit = item === 'recipe' ? FREE_LIMITS.recipes : FREE_LIMITS.channels;
  if (count >= limit) throw new FreeLimitError(item);
}
